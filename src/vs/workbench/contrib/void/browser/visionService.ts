/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { ImageAttachment } from '../common/chatThreadServiceTypes.js';
import { ILLMMessageService } from '../common/sendLLMMessageService.js';
import { IVoidSettingsService } from '../common/voidSettingsService.js';
import { OpenAILLMChatMessage } from '../common/sendLLMMessageTypes.js';

export const IVisionService = createDecorator<IVisionService>('visionService');

export interface IVisionService {
	readonly _serviceBrand: undefined;
	
	/**
	 * Process images using the selected vision model and return text descriptions
	 * @param images Array of images to process
	 * @param userPrompt Optional user prompt to guide the vision model
	 * @returns Combined text description of all images
	 */
	processImages(images: ImageAttachment[], userPrompt?: string): Promise<string>;
}

class VisionService extends Disposable implements IVisionService {
	readonly _serviceBrand: undefined;

	constructor(
		@ILLMMessageService private readonly _llmMessageService: ILLMMessageService,
		@IVoidSettingsService private readonly _voidSettingsService: IVoidSettingsService,
	) {
		super();
	}

	async processImages(images: ImageAttachment[], userPrompt?: string): Promise<string> {
		if (images.length === 0) return '';

		const visionModelSelection = this._voidSettingsService.state.modelSelectionOfFeature['Vision'];
		if (!visionModelSelection) {
			throw new Error('No vision model selected. Please select a vision model in settings.');
		}

		// Build the vision prompt
		const visionPrompt = userPrompt 
			? `The user has attached ${images.length} image(s) with this message: "${userPrompt}"\n\nPlease describe what you see in the image(s) in detail.`
			: `Please describe what you see in the ${images.length} image(s) in detail.`;

		// Build multimodal message content for vision model
		const content: Array<{ type: 'text' | 'image_url', text?: string, image_url?: { url: string } }> = [
			{ type: 'text', text: visionPrompt }
		];

		// Add all images
		for (const image of images) {
			content.push({
				type: 'image_url',
				image_url: {
					url: `data:${image.mimeType};base64,${image.base64}`
				}
			});
		}

		// Create message for vision model
		const messages: OpenAILLMChatMessage[] = [
			{
				role: 'user',
				content: content as any // Type assertion needed for multimodal content
			}
		];

		// Collect response text
		return new Promise<string>((resolve, reject) => {
			let fullText = '';
			let hasError = false;

			try {
				// Send to vision model
				this._llmMessageService.sendLLMMessage({
					messagesType: 'chatMessages',
					messages,
					separateSystemMessage: undefined,
					chatMode: null,
					modelSelection: visionModelSelection,
					modelSelectionOptions: undefined,
					overridesOfModel: this._voidSettingsService.state.overridesOfModel,
					logging: { loggingName: 'Vision Processing' },
					onText: (params) => {
						fullText = params.fullText; // Use fullText from params
					},
					onFinalMessage: () => {
						if (!hasError) {
							if (!fullText.trim()) {
								reject(new Error('Vision model returned empty response'));
							} else {
								resolve(fullText);
							}
						}
					},
					onError: (params) => {
						hasError = true;
						reject(new Error(`Vision model error: ${params.message}`));
					},
					onAbort: () => {
						if (!hasError) {
							reject(new Error('Vision processing was aborted'));
						}
					}
				});
			} catch (error) {
				console.error('[VisionService] Error processing images:', error);
				reject(new Error(`Failed to process images: ${error instanceof Error ? error.message : 'Unknown error'}`));
			}
		});
	}
}

registerSingleton(IVisionService, VisionService, InstantiationType.Delayed);
