/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { IChatThreadService, ThreadType } from './chatThreadService.js';
import { IThreadSummaryService, WorkspaceThreadSummary, TITLE_TRUNCATE_LENGTH, MESSAGE_TRUNCATE_LENGTH } from '../common/workspaceRegistryTypes.js';
import { truncate } from '../../../../base/common/strings.js';

/**
 * Service for generating lightweight thread summaries.
 * Converts full thread data into minimal summaries for cross-workspace tracking.
 */
class ThreadSummaryService extends Disposable implements IThreadSummaryService {
	_serviceBrand: undefined;

	constructor(
		@IChatThreadService private readonly chatThreadService: IChatThreadService
	) {
		super();
	}

	/**
	 * Generate a lightweight summary from a thread
	 */
	generateSummary(threadId: string): WorkspaceThreadSummary | null {
		const thread = this.chatThreadService.state.allThreads[threadId];
		if (!thread) {
			return null;
		}

		return this.createSummary(thread);
	}

	/**
	 * Generate summaries for all threads in the current workspace
	 */
	generateAllSummaries(): WorkspaceThreadSummary[] {
		const threads = Object.values(this.chatThreadService.state.allThreads);
		return threads
			.filter(thread => thread !== undefined)
			.map(thread => this.createSummary(thread!));
	}

	/**
	 * Get the current active operations count (threads with streaming or tool execution)
	 */
	getActiveOperationsCount(): number {
		const streamState = this.chatThreadService.streamState;
		let count = 0;

		for (const threadId in streamState) {
			const state = streamState[threadId];
			if (state && state.isRunning && state.isRunning !== 'idle') {
				count++;
			}
		}

		return count;
	}

	/**
	 * Create a summary from a thread object
	 */
	private createSummary(thread: ThreadType): WorkspaceThreadSummary {
		const title = this.extractTitle(thread);
		const lastMessage = this.extractLastMessage(thread);
		const status = this.determineStatus(thread.id);
		const messageCount = thread.messages.filter(m => m.role === 'user' || m.role === 'assistant').length;

		return {
			id: thread.id,
			title: truncate(title, TITLE_TRUNCATE_LENGTH),
			status,
			lastMessage: truncate(lastMessage, MESSAGE_TRUNCATE_LENGTH),
			timestamp: new Date(thread.lastModified).getTime(),
			messageCount
		};
	}

	/**
	 * Extract a title from the thread (first user message or generated)
	 */
	private extractTitle(thread: ThreadType): string {
		// Find the first user message
		const firstUserMessage = thread.messages.find(m => m.role === 'user');
		if (firstUserMessage && 'content' in firstUserMessage && typeof firstUserMessage.content === 'string') {
			// Use first line or first 50 chars
			const content = firstUserMessage.content;
			const firstLine = content.split('\n')[0];
			return firstLine || 'New Conversation';
		}
		return 'New Conversation';
	}

	/**
	 * Extract the last message content from the thread
	 */
	private extractLastMessage(thread: ThreadType): string {
		// Find the last message with content
		for (let i = thread.messages.length - 1; i >= 0; i--) {
			const msg = thread.messages[i];
			if (msg.role === 'user' && 'content' in msg && typeof msg.content === 'string') {
				return msg.content;
			}
			if (msg.role === 'assistant') {
				// Use displayContent if available
				if ('displayContent' in msg && typeof msg.displayContent === 'string') {
					return msg.displayContent;
				}
				// Fall back to content
				if ('content' in msg && typeof msg.content === 'string') {
					return msg.content;
				}
			}
		}
		return 'No messages';
	}

	/**
	 * Determine the status of a thread
	 */
	private determineStatus(threadId: string): WorkspaceThreadSummary['status'] {
		const streamState = this.chatThreadService.streamState[threadId];
		if (!streamState || !streamState.isRunning) {
			return 'idle';
		}

		switch (streamState.isRunning) {
			case 'LLM':
				return 'streaming';
			case 'tool':
				return 'streaming';
			case 'awaiting_user':
				return 'awaiting_user';
			case 'idle':
			default:
				if (streamState.error) {
					return 'error';
				}
				return 'idle';
		}
	}
}

registerSingleton(IThreadSummaryService, ThreadSummaryService, InstantiationType.Delayed);