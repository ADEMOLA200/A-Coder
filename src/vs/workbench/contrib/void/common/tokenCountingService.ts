/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { LLMChatMessage } from './sendLLMMessageTypes.js';

// Type definitions for js-tiktoken (loaded dynamically)
type Tiktoken = any;

/**
 * Service for counting tokens in messages and managing context windows.
 * Uses tiktoken for accurate token counting across different models.
 * Falls back to character-based estimation if tiktoken is unavailable.
 */
export class TokenCountingService {
	private encoderCache: Map<string, Tiktoken> = new Map();
	private tiktokenAvailable: boolean = false;
	private encodingForModel: any = null;

	constructor() {
		// Try to load js-tiktoken dynamically (only works in Node.js/Electron main process)
		this.initializeTiktoken();
	}

	private async initializeTiktoken(): Promise<void> {
		try {
			// Dynamic import - will fail gracefully in browser context
			const tiktoken = await import('js-tiktoken');
			this.encodingForModel = tiktoken.encodingForModel;
			this.tiktokenAvailable = true;
			console.log('[TokenCountingService] js-tiktoken loaded successfully');
		} catch (error) {
			console.warn('[TokenCountingService] js-tiktoken not available, using character-based estimation');
			this.tiktokenAvailable = false;
		}
	}

	/**
	 * Get or create an encoder for a specific model
	 */
	private getEncoder(modelName: string): Tiktoken | null {
		if (!this.tiktokenAvailable || !this.encodingForModel) {
			return null;
		}

		if (!this.encoderCache.has(modelName)) {
			try {
				const encoder = this.encodingForModel(modelName as any);
				this.encoderCache.set(modelName, encoder);
			} catch (error) {
				// Fallback to cl100k_base for unknown models (GPT-4 encoding)
				console.warn(`[TokenCountingService] Unknown model ${modelName}, using cl100k_base encoding`);
				try {
					const encoder = this.encodingForModel('gpt-4' as any);
					this.encoderCache.set(modelName, encoder);
				} catch {
					return null;
				}
			}
		}
		return this.encoderCache.get(modelName) || null;
	}

	/**
	 * Count tokens in a single text string
	 */
	public countTextTokens(text: string, modelName: string): number {
		const encoder = this.getEncoder(modelName);
		if (!encoder) {
			// Fallback: estimate ~4 characters per token
			return Math.ceil(text.length / 4);
		}
		return encoder.encode(text).length;
	}

	/**
	 * Count tokens in a chat message
	 * Based on OpenAI's token counting logic
	 * Handles Anthropic, OpenAI, and Gemini message formats
	 */
	public countMessageTokens(message: LLMChatMessage, modelName: string): number {
		const encoder = this.getEncoder(modelName);
		if (!encoder) {
			// Fallback: estimate based on JSON string length
			return Math.ceil(JSON.stringify(message).length / 4);
		}
		
		// Token overhead per message varies by model
		const { tokensPerMessage } = this.getModelOverhead(modelName);
		
		let numTokens = tokensPerMessage;
		
		// Count tokens in role
		numTokens += encoder.encode(message.role).length;
		
		// Handle different message formats
		if ('content' in message) {
			// Anthropic or OpenAI format
			if (typeof message.content === 'string') {
				numTokens += encoder.encode(message.content).length;
			} else if (Array.isArray(message.content)) {
				// Handle multi-part content (images, text, tool calls, etc.)
				for (const part of message.content) {
					if ('type' in part) {
						if (part.type === 'text' && 'text' in part) {
							numTokens += encoder.encode(part.text).length;
						} else if (part.type === 'tool_use' && 'name' in part) {
							numTokens += encoder.encode(part.name).length;
							numTokens += encoder.encode(JSON.stringify(part.input)).length;
						} else if (part.type === 'tool_result' && 'content' in part) {
							numTokens += encoder.encode(part.content).length;
						}
					}
				}
			}
		} else if ('parts' in message) {
			// Gemini format
			for (const part of message.parts) {
				if ('text' in part) {
					numTokens += encoder.encode(part.text).length;
				} else if ('functionCall' in part) {
					numTokens += encoder.encode(part.functionCall.name).length;
					numTokens += encoder.encode(JSON.stringify(part.functionCall.args)).length;
				} else if ('functionResponse' in part) {
					numTokens += encoder.encode(part.functionResponse.name).length;
					numTokens += encoder.encode(part.functionResponse.response.output).length;
				}
			}
		}
		
		// Handle OpenAI tool calls
		if ('tool_calls' in message && message.tool_calls) {
			for (const toolCall of message.tool_calls) {
				numTokens += encoder.encode(toolCall.function.name).length;
				numTokens += encoder.encode(toolCall.function.arguments).length;
			}
		}
		
		// Handle OpenAI tool results
		if ('tool_call_id' in message && message.tool_call_id) {
			numTokens += encoder.encode(message.tool_call_id).length;
		}
		
		return numTokens;
	}

	/**
	 * Count tokens in an array of chat messages
	 */
	public countMessagesTokens(messages: LLMChatMessage[], modelName: string): number {
		let totalTokens = 0;
		
		for (const message of messages) {
			totalTokens += this.countMessageTokens(message, modelName);
		}
		
		// Every reply is primed with assistant message tokens
		totalTokens += 3;
		
		return totalTokens;
	}

	/**
	 * Get token overhead per message and name for a specific model
	 */
	private getModelOverhead(modelName: string): { tokensPerMessage: number; tokensPerName: number } {
		// Based on OpenAI's official token counting logic
		if (modelName.includes('gpt-4') || modelName.includes('gpt-3.5-turbo')) {
			if (modelName.includes('0301')) {
				return { tokensPerMessage: 4, tokensPerName: -1 };
			}
			return { tokensPerMessage: 3, tokensPerName: 1 };
		}
		
		// Default for unknown models
		return { tokensPerMessage: 3, tokensPerName: 1 };
	}

	/**
	 * Get the context window size for a model
	 */
	public getContextWindowSize(modelName: string): number {
		const lowerName = modelName.toLowerCase();
		
		// Common model context windows
		const contextWindows: Record<string, number> = {
			// OpenAI
			'gpt-4-turbo': 128000,
			'gpt-4-turbo-preview': 128000,
			'gpt-4-1106-preview': 128000,
			'gpt-4': 8192,
			'gpt-4-32k': 32768,
			'gpt-3.5-turbo': 16385,
			'gpt-3.5-turbo-16k': 16385,
			// Anthropic
			'claude-3-opus': 200000,
			'claude-3-sonnet': 200000,
			'claude-3-haiku': 200000,
			'claude-3.5-sonnet': 200000,
			// Google
			'gemini-pro': 32768,
			'gemini-1.5-pro': 1000000,
			'gemini-1.5-flash': 1000000,
			// Ollama models (common ones)
			'llama3': 8192,
			'llama3.1': 128000,
			'llama3.2': 128000,
			'llama2': 4096,
			'mistral': 8192,
			'mixtral': 32768,
			'qwen': 32768,
			'qwen2': 32768,
			'codellama': 16384,
			'deepseek-coder': 16384,
			'phi': 2048,
			'gemma': 8192,
			'gemma2': 8192,
			// Other local models
			'yi': 4096,
			'solar': 4096,
		};
		
		// Try exact match first
		if (contextWindows[lowerName]) {
			return contextWindows[lowerName];
		}
		
		// Try partial match
		for (const [key, value] of Object.entries(contextWindows)) {
			if (lowerName.includes(key)) {
				return value;
			}
		}
		
		// For Ollama and local models, default to 8k (more generous than 4k)
		// Most modern local models support at least 8k context
		const isLikelyLocal = lowerName.includes('ollama') || 
		                      lowerName.includes('local') ||
		                      lowerName.includes('llama') ||
		                      lowerName.includes('mistral');
		
		if (isLikelyLocal) {
			console.warn(`[TokenCountingService] Unknown Ollama/local model ${modelName}, defaulting to 8192`);
			return 8192;
		}
		
		// Default to 4096 for unknown cloud models (conservative)
		console.warn(`[TokenCountingService] Unknown context window for ${modelName}, defaulting to 4096`);
		return 4096;
	}

	/**
	 * Calculate remaining tokens in context window
	 */
	public getRemainingTokens(messages: LLMChatMessage[], modelName: string): number {
		const usedTokens = this.countMessagesTokens(messages, modelName);
		const contextWindow = this.getContextWindowSize(modelName);
		return Math.max(0, contextWindow - usedTokens);
	}

	/**
	 * Check if messages fit within context window
	 */
	public fitsInContextWindow(messages: LLMChatMessage[], modelName: string): boolean {
		return this.getRemainingTokens(messages, modelName) > 0;
	}

	/**
	 * Estimate tokens for a completion response
	 * This is a rough estimate - actual tokens will vary
	 */
	public estimateCompletionTokens(promptTokens: number, modelName: string): number {
		const contextWindow = this.getContextWindowSize(modelName);
		// Reserve 25% of remaining window for completion, or max 4096 tokens
		const remaining = contextWindow - promptTokens;
		return Math.min(4096, Math.floor(remaining * 0.25));
	}

	/**
	 * Dispose of cached encoders
	 */
	public dispose(): void {
		// Clear the cache
		// Note: js-tiktoken encoders don't have a free() method like Python version
		this.encoderCache.clear();
	}
}
