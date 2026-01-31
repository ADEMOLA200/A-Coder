/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { IServerChannel } from '../../../../base/parts/ipc/common/ipc.js';
import { Event } from '../../../../base/common/event.js';

interface ImageGenerationRequest {
	baseUrl: string;
	model: string;
	prompt: string;
	size: string;
	quality?: string;
}

interface ImageGenerationResponse {
	success: boolean;
	data?: string; // base64 encoded image
	error?: string;
}

/**
 * IPC Channel for Image Generation
 * Handles image generation requests from renderer process
 */
export class ImageGenerationChannel implements IServerChannel {

	async call(_: unknown, command: string, arg?: any): Promise<any> {
		switch (command) {
			case 'generateImage': {
				const { baseUrl, model, prompt, size, quality } = arg as ImageGenerationRequest;
				return this.handleImageGeneration({ baseUrl, model, prompt, size, quality });
			}
			default:
				throw new Error(`Unknown command: ${command}`);
		}
	}

	listen(_: unknown, event: string): Event<any> {
		throw new Error(`Event not supported: ${event}`);
	}

	dispose(): void {
		// Nothing to dispose
	}

	private async handleImageGeneration(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
		const { baseUrl, model, prompt, size, quality } = request;

		try {
			const url = `${baseUrl}/images/generations`;
			const requestBody: any = {
				prompt,
				model,
				n: 1,
				size,
				response_format: 'b64_json',
			};

			if (quality) {
				requestBody.quality = quality;
			}

			console.log('[ImageGenerationChannel] Sending request to:', url);

			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('[ImageGenerationChannel] Request failed:', response.status, errorText);
				return {
					success: false,
					error: `Image generation failed: ${response.status} ${response.statusText} - ${errorText}`,
				};
			}

			const data = await response.json();
			const b64Json = data?.data?.[0]?.b64_json;

			if (!b64Json) {
				return {
					success: false,
					error: 'No image data returned from API',
				};
			}

			console.log('[ImageGenerationChannel] Image generated successfully');
			return {
				success: true,
				data: b64Json,
			};
		} catch (error) {
			console.error('[ImageGenerationChannel] Error:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}
}