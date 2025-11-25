/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { LLMChatMessage } from './sendLLMMessageTypes.js';
import { TokenCountingService } from './tokenCountingService.js';

/**
 * Configuration for context compression
 */
export interface CompressionConfig {
	/** Target percentage of context window to use (0-1) */
	targetUsage: number;
	/** Minimum number of recent messages to always keep */
	keepLastNMessages: number;
	/** Whether to summarize old messages vs removing them */
	enableSummarization: boolean;
	/** Maximum length for tool results before truncation */
	maxToolResultLength: number;
}

/**
 * Default compression configuration
 */
export const DEFAULT_COMPRESSION_CONFIG: CompressionConfig = {
	targetUsage: 0.75, // Use 75% of context window
	keepLastNMessages: 6, // Keep last 6 messages (3 turns)
	enableSummarization: true,
	maxToolResultLength: 2000, // 2000 chars for tool results
};

/**
 * Service for compressing message context to fit within model limits
 */
export class ContextCompressionService {
	constructor(
		private tokenCountingService: TokenCountingService
	) { }

	/**
	 * Compress messages to fit within target token limit (async version for accuracy)
	 */
	public async compressMessages(
		messages: LLMChatMessage[],
		modelName: string,
		config: Partial<CompressionConfig> = {}
	): Promise<{
		compressedMessages: LLMChatMessage[];
		stats: CompressionStats;
	}> {
		const fullConfig = { ...DEFAULT_COMPRESSION_CONFIG, ...config };
		const contextWindow = this.tokenCountingService.getContextWindowSize(modelName);
		const targetTokens = Math.floor(contextWindow * fullConfig.targetUsage);

		const stats: CompressionStats = {
			originalTokens: await this.tokenCountingService.countMessagesTokensAsync(messages, modelName),
			originalMessageCount: messages.length,
			targetTokens,
			finalTokens: 0,
			finalMessageCount: 0,
			messagesRemoved: 0,
			messagesSummarized: 0,
			toolResultsTruncated: 0,
		};

		// If already under target, no compression needed
		if (stats.originalTokens <= targetTokens) {
			stats.finalTokens = stats.originalTokens;
			stats.finalMessageCount = messages.length;
			return { compressedMessages: messages, stats };
		}

		console.log(`[ContextCompression] Compressing ${messages.length} messages from ${stats.originalTokens} to ~${targetTokens} tokens`);

		// Strategy 1: Truncate large tool results
		let compressed = this.truncateToolResults(messages, fullConfig.maxToolResultLength);
		let currentTokens = await this.tokenCountingService.countMessagesTokensAsync(compressed, modelName);

		if (currentTokens > targetTokens) {
			// Strategy 2: Remove old messages (keep system + recent messages)
			compressed = this.removeOldMessages(compressed, fullConfig.keepLastNMessages);
			currentTokens = await this.tokenCountingService.countMessagesTokensAsync(compressed, modelName);
			stats.messagesRemoved = messages.length - compressed.length;
		}

		if (currentTokens > targetTokens && fullConfig.enableSummarization) {
			// Strategy 3: Summarize middle messages
			compressed = this.summarizeMiddleMessages(compressed, fullConfig.keepLastNMessages);
			currentTokens = await this.tokenCountingService.countMessagesTokensAsync(compressed, modelName);
			stats.messagesSummarized = this.countSummarizedMessages(compressed);
		}

		stats.finalTokens = currentTokens;
		stats.finalMessageCount = compressed.length;

		console.log(`[ContextCompression] Result: ${stats.finalMessageCount} messages, ${stats.finalTokens} tokens (${Math.round(stats.finalTokens / stats.originalTokens * 100)}% of original)`);

		return { compressedMessages: compressed, stats };
	}

	/**
	 * Truncate large tool results to reduce token usage
	 */
	private truncateToolResults(messages: LLMChatMessage[], maxLength: number): LLMChatMessage[] {
		return messages.map(msg => {
			// OpenAI tool format
			if ('role' in msg && msg.role === 'tool' && 'content' in msg) {
				if (typeof msg.content === 'string' && msg.content.length > maxLength) {
					return {
						...msg,
						content: msg.content.substring(0, maxLength) + `\n\n[... truncated ${msg.content.length - maxLength} characters for context window management]`
					};
				}
			}

			// Anthropic tool result format
			if ('content' in msg && Array.isArray(msg.content)) {
				const newContent = msg.content.map(part => {
					if ('type' in part && part.type === 'tool_result' && 'content' in part) {
						if (part.content.length > maxLength) {
							return {
								...part,
								content: part.content.substring(0, maxLength) + `\n\n[... truncated for context window]`
							};
						}
					}
					return part;
				});
				return { ...msg, content: newContent } as LLMChatMessage;
			}

			// Gemini function response format
			if ('parts' in msg) {
				const newParts = msg.parts.map(part => {
					if ('functionResponse' in part) {
						const output = part.functionResponse.response.output;
						if (output.length > maxLength) {
							return {
								...part,
								functionResponse: {
									...part.functionResponse,
									response: {
										output: output.substring(0, maxLength) + `\n\n[... truncated for context window]`
									}
								}
							};
						}
					}
					return part;
				});
				return { ...msg, parts: newParts } as LLMChatMessage;
			}

			return msg;
		});
	}

	/**
	 * Remove old messages, keeping system message and last N messages
	 */
	private removeOldMessages(messages: LLMChatMessage[], keepLastN: number): LLMChatMessage[] {
		if (messages.length <= keepLastN + 1) {
			return messages;
		}

		// Always keep system message (first message)
		const systemMessage = messages[0];
		const recentMessages = messages.slice(-keepLastN);

		// Check if first message is system message
		const hasSystemMessage = 'role' in systemMessage &&
			(systemMessage.role === 'system' || systemMessage.role === 'developer');

		if (hasSystemMessage) {
			return [systemMessage, ...recentMessages];
		} else {
			return recentMessages;
		}
	}

	/**
	 * Summarize middle messages (between system and recent messages)
	 */
	private summarizeMiddleMessages(messages: LLMChatMessage[], keepLastN: number): LLMChatMessage[] {
		if (messages.length <= keepLastN + 1) {
			return messages;
		}

		const systemMessage = messages[0];
		const hasSystemMessage = 'role' in systemMessage &&
			(systemMessage.role === 'system' || systemMessage.role === 'developer');

		const startIdx = hasSystemMessage ? 1 : 0;
		const endIdx = messages.length - keepLastN;

		if (endIdx <= startIdx) {
			return messages;
		}

		// Messages to summarize
		const middleMessages = messages.slice(startIdx, endIdx);
		const recentMessages = messages.slice(endIdx);

		// Create summary message
		const summaryText = this.createSummary(middleMessages);
		const summaryMessage: LLMChatMessage = {
			role: 'user',
			content: `[Previous conversation summary: ${summaryText}]`
		} as LLMChatMessage;

		const result = hasSystemMessage
			? [systemMessage, summaryMessage, ...recentMessages]
			: [summaryMessage, ...recentMessages];

		return result;
	}

	/**
	 * Create a summary of messages
	 */
	private createSummary(messages: LLMChatMessage[]): string {
		const summaryParts: string[] = [];

		for (const msg of messages) {
			if ('content' in msg && typeof msg.content === 'string') {
				// Extract first sentence or first 100 chars
				const preview = msg.content.split('.')[0].substring(0, 100);
				summaryParts.push(`${msg.role}: ${preview}...`);
			} else if ('parts' in msg) {
				// Gemini format
				const textParts = msg.parts.filter(p => 'text' in p);
				if (textParts.length > 0 && 'text' in textParts[0]) {
					const preview = textParts[0].text.split('.')[0].substring(0, 100);
					summaryParts.push(`${msg.role}: ${preview}...`);
				}
			}
		}

		return summaryParts.join(' | ');
	}

	/**
	 * Count how many messages were summarized
	 */
	private countSummarizedMessages(messages: LLMChatMessage[]): number {
		return messages.filter(msg =>
			'content' in msg &&
			typeof msg.content === 'string' &&
			msg.content.includes('[Previous conversation summary:')
		).length;
	}

	/**
	 * Check if compression is needed (async version for accuracy)
	 */
	public async needsCompression(
		messages: LLMChatMessage[],
		modelName: string,
		threshold: number = 0.8
	): Promise<boolean> {
		const currentTokens = await this.tokenCountingService.countMessagesTokensAsync(messages, modelName);
		const contextWindow = this.tokenCountingService.getContextWindowSize(modelName);
		const usage = currentTokens / contextWindow;

		return usage > threshold;
	}

	/**
	 * Get compression statistics without actually compressing (async version for accuracy)
	 */
	public async getCompressionPreview(
		messages: LLMChatMessage[],
		modelName: string,
		config: Partial<CompressionConfig> = {}
	): Promise<CompressionStats> {
		const { stats } = await this.compressMessages(messages, modelName, config);
		return stats;
	}
}

/**
 * Statistics about compression operation
 */
export interface CompressionStats {
	originalTokens: number;
	originalMessageCount: number;
	targetTokens: number;
	finalTokens: number;
	finalMessageCount: number;
	messagesRemoved: number;
	messagesSummarized: number;
	toolResultsTruncated: number;
}
