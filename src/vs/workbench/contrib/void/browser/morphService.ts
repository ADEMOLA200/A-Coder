/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { IVoidSettingsService } from '../common/voidSettingsService.js';

export const IMorphService = createDecorator<IMorphService>('MorphService');

export interface IMorphService {
	_serviceBrand: undefined;
	
	/**
	 * Apply code changes using Morph Fast Apply API
	 * @param instruction First-person description of the change
	 * @param originalCode Complete original file content
	 * @param updatedCode Code snippet with changes (can use // ... existing code ... markers)
	 * @param model Morph model to use ('morph-v3-fast', 'morph-v3-large', or 'auto')
	 * @returns The applied code from Morph
	 */
	applyCodeChange(params: {
		instruction: string;
		originalCode: string;
		updatedCode: string;
		model?: 'morph-v3-fast' | 'morph-v3-large' | 'auto';
	}): Promise<string>;
}

export class MorphService implements IMorphService {
	_serviceBrand: undefined;

	constructor(
		@IVoidSettingsService private readonly _settingsService: IVoidSettingsService,
	) { }

	async applyCodeChange(params: {
		instruction: string;
		originalCode: string;
		updatedCode: string;
		model?: 'morph-v3-fast' | 'morph-v3-large' | 'auto';
	}): Promise<string> {
		const { instruction, originalCode, updatedCode, model = 'morph-v3-large' } = params;
		
		console.log('[MorphService] Starting applyCodeChange...');
		console.log('[MorphService] Instruction:', instruction);
		console.log('[MorphService] Original code length:', originalCode.length);
		console.log('[MorphService] Updated code length:', updatedCode.length);
		
		// Get API key from settings
		const apiKey = this._settingsService.state.globalSettings.morphApiKey;
		if (!apiKey) {
			console.error('[MorphService] No API key configured');
			throw new Error('Morph API key not configured. Please add your API key in Settings.');
		}

		// Format the content according to Morph's required format
		// IMPORTANT: No spaces/newlines between tags per Morph API spec
		const content = `<instruction>${instruction}</instruction><code>${originalCode}</code><update>${updatedCode}</update>`;
		console.log('[MorphService] Formatted content length:', content.length);

		// Make API request to Morph
		console.log('[MorphService] Making API request to Morph...');
		const response = await fetch('https://morphllm.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model,
				messages: [
					{
						role: 'user',
						content,
					}
				],
				stream: false,
			}),
		});

		console.log('[MorphService] Response status:', response.status, response.statusText);
		
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
			console.error('[MorphService] API error:', errorData);
			throw new Error(`Morph API error: ${errorData.error?.message || response.statusText}`);
		}

		const data = await response.json();
		console.log('[MorphService] Response received, parsing...');
		
		// Extract the applied code from the response
		const appliedCode = data.choices?.[0]?.message?.content;
		if (!appliedCode) {
			console.error('[MorphService] No content in response:', data);
			throw new Error('Morph API returned no content');
		}

		console.log('[MorphService] Successfully received applied code, length:', appliedCode.length);
		return appliedCode;
	}
}

registerSingleton(IMorphService, MorphService, InstantiationType.Delayed);
