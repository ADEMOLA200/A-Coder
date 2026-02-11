/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { ILLMMessageService } from '../common/sendLLMMessageService.js';
import { IVoidSettingsService } from '../common/voidSettingsService.js';
import { ChatMode } from '../common/voidSettingsTypes.js';
import { orchestration_systemMessage } from '../common/prompt/prompts.js';

export type OrchestrationToolSuggestion = {
	toolName: string;
	toolParams?: Record<string, any>;
	reasoning: string;
	confidence: 'high' | 'medium' | 'low';
	skipOrchestration?: boolean; // Set to true if orchestration model decides main LLM should handle everything
}

export type OrchestrationResult = {
	suggestions: OrchestrationToolSuggestion[];
	reasoning: string;
	summary: string;
}

export const IToolOrchestrationService = createDecorator<IToolOrchestrationService>('toolOrchestrationService');

export interface IToolOrchestrationService {
	readonly _serviceBrand: undefined;
	/**
	 * Get orchestration suggestions for a user message
	 */
	orchestrate: (params: {
		userMessage: string;
		chatMode: ChatMode;
		onProgress?: (reasoning: string) => void;
	}) => Promise<OrchestrationResult>;
}

class ToolOrchestrationService extends Disposable implements IToolOrchestrationService {
	_serviceBrand: undefined;

	constructor(
		@ILLMMessageService private readonly _llmMessageService: ILLMMessageService,
		@IVoidSettingsService private readonly _settingsService: IVoidSettingsService,
	) {
		super();
	}

	async orchestrate({ userMessage, chatMode, onProgress }: { userMessage: string; chatMode: ChatMode; onProgress?: (reasoning: string) => void }): Promise<OrchestrationResult> {
		// Check if orchestration is enabled
		if (!this._settingsService.state.globalSettings.enableToolOrchestration) {
			return { suggestions: [], reasoning: '', summary: '' };
		}

		// Get orchestration model selection
		const orchestrationModel = this._settingsService.state.modelSelectionOfFeature['ToolOrchestration'];
		if (!orchestrationModel) {
			console.log('[toolOrchestrationService] No orchestration model selected, skipping orchestration');
			return { suggestions: [], reasoning: '', summary: '' };
		}

		// Check if model is disabled
		const providerSettings = this._settingsService.state.settingsOfProvider[orchestrationModel.providerName];

		if (providerSettings.models.filter(m => !m.isHidden).length === 0) {
			console.log('[toolOrchestrationService] Orchestration model is disabled, skipping orchestration');
			return { suggestions: [], reasoning: '', summary: '' };
		}

		console.log('[toolOrchestrationService] Starting orchestration with model:', orchestrationModel.modelName);

		// Build system message for orchestration
		const systemMessage = orchestration_systemMessage({ chatMode });

		// Build messages for orchestration
		const messages = [
			{ role: 'system' as const, content: systemMessage },
			{ role: 'user' as const, content: userMessage },
		];

		// Call orchestration model
		return new Promise<OrchestrationResult>((resolve, reject) => {
			let fullResponse = '';

			const requestId = this._llmMessageService.sendLLMMessage({
				messagesType: 'chatMessages',
				chatMode,
				messages,
				modelSelection: orchestrationModel,
				modelSelectionOptions: undefined,
				overridesOfModel: undefined,
				logging: { loggingName: 'ToolOrchestration', loggingExtras: { chatMode } },
				separateSystemMessage: undefined,
				onText: (params) => {
					fullResponse = params.fullText ?? '';
					if (params.fullReasoning) {
						onProgress?.(params.fullReasoning);
					}
				},
				onFinalMessage: (params) => {
					console.log('[toolOrchestrationService] Orchestration response received');
					const result = this._parseOrchestrationResponse(fullResponse);
					resolve(result);
				},
				onError: (params) => {
					console.error('[toolOrchestrationService] Error during orchestration:', params.message);
					// On error, return empty suggestions to fall back to normal behavior
					resolve({ suggestions: [], reasoning: '', summary: `Orchestration failed: ${params.message}` });
				},
				onAbort: () => {
					console.log('[toolOrchestrationService] Orchestration aborted');
					resolve({ suggestions: [], reasoning: '', summary: 'Orchestration aborted' });
				},
			});

			if (!requestId) {
				reject(new Error('Failed to send orchestration request'));
			}
		});
	}

	private _parseOrchestrationResponse(response: string): OrchestrationResult {
		try {
			// Try to extract JSON from the response
			const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
			const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response;

			// Parse JSON
			let parsed: any;
			try {
				parsed = JSON.parse(jsonString);
			} catch {
				// If JSON parsing fails, try to extract key information from text
				return this._parseTextResponse(response);
			}

			// Validate and extract suggestions
			const suggestions: OrchestrationToolSuggestion[] = [];
			if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
				for (const suggestion of parsed.suggestions) {
					if (suggestion.toolName) {
						suggestions.push({
							toolName: suggestion.toolName,
							toolParams: suggestion.toolParams,
							reasoning: suggestion.reasoning || '',
							confidence: suggestion.confidence || 'medium',
							skipOrchestration: suggestion.skipOrchestration,
						});
					}
				}
			}

			// Check if orchestration decided to skip
			if (parsed.skipOrchestration) {
				return {
					suggestions: [{ toolName: '__skip__', reasoning: parsed.reasoning || 'Main LLM should handle this request', confidence: 'high', skipOrchestration: true }],
					reasoning: parsed.reasoning || '',
					summary: parsed.summary || 'Orchestration skipped - delegating to main LLM',
				};
			}

			return {
				suggestions,
				reasoning: parsed.reasoning || accumulatedReasoningText(response),
				summary: parsed.summary || '',
			};
		} catch (error) {
			console.error('[toolOrchestrationService] Error parsing orchestration response:', error);
			// Return empty suggestions on parse error
			return { suggestions: [], reasoning: '', summary: 'Failed to parse orchestration response' };
		}
	}

	private _parseTextResponse(response: string): OrchestrationResult {
		// Extract reasoning from text
		const reasoning = accumulatedReasoningText(response);

		// Try to find tool mentions
		const toolPattern = /(?:tool|call|use|execute):\s*(\w+)/gi;
		const tools: string[] = [];
		let match;
		while ((match = toolPattern.exec(response)) !== null) {
			tools.push(match[1]);
		}

		const suggestions: OrchestrationToolSuggestion[] = tools.map(tool => ({
			toolName: tool,
			reasoning: '',
			confidence: 'low',
		}));

		return {
			suggestions,
			reasoning,
			summary: response.slice(0, 200) + '...',
		};
	}
}

// Extract reasoning text from <reasoning> or ``` tags
const accumulatedReasoningText = (response: string): string => {
	const reasoningMatch = response.match(/<reasoning>([\s\S]*?)<\/reasoning>/) ||
		response.match(/```([\s\S]*?)```/);
	return reasoningMatch ? reasoningMatch[1].trim() : '';
};

registerSingleton(IToolOrchestrationService, ToolOrchestrationService, InstantiationType.Delayed);