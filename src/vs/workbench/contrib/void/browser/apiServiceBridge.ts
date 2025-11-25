/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { IChatThreadService } from './chatThreadService.js';
import { IToolsService } from './toolsService.js';
import { IVoidSettingsService } from '../common/voidSettingsService.js';
import { IFileService } from '../../../../platform/files/common/files.js';
import { IWorkspaceContextService } from '../../../../platform/workspace/common/workspace.js';
import { URI } from '../../../../base/common/uri.js';

/**
 * API Service Bridge (Renderer Process)
 * Handles API requests from the main process and forwards them to actual services
 */
export class ApiServiceBridge extends Disposable {

	constructor(
		@IChatThreadService private readonly chatThreadService: IChatThreadService,
		@IToolsService private readonly toolsService: IToolsService,
		@IVoidSettingsService private readonly settingsService: IVoidSettingsService,
		@IFileService private readonly fileService: IFileService,
		@IWorkspaceContextService private readonly workspaceContextService: IWorkspaceContextService,
	) {
		super();
	}

	/**
	 * Handle API method calls from main process
	 */
	async handleApiCall(method: string, params: any): Promise<any> {
		switch (method) {
			// ===== Chat/Thread Methods =====
			case 'getThreads':
				return this.getThreads();

			case 'getThread':
				return this.getThread(params.threadId);

			case 'createThread':
				return this.createThread(params.name);

			case 'sendMessage':
				return this.sendMessage(params.threadId, params.message);

			case 'deleteThread':
				return this.deleteThread(params.threadId);

			case 'getThreadStatus':
				return this.getThreadStatus(params.threadId);

			case 'cancelThread':
				return this.cancelThread(params.threadId);

			// ===== Workspace Methods =====
			case 'getWorkspace':
				return this.getWorkspace();

			case 'getFiles':
				return this.getFiles(params.page, params.limit, params.filter);

			case 'getFileTree':
				return this.getFileTree();

			case 'readFile':
				return this.readFile(params.path);

			case 'getFileOutline':
				return this.getFileOutline(params.path);

			case 'searchFiles':
				return this.searchFiles(params.query, params.type);

			case 'getDiagnostics':
				return this.getDiagnostics();

			// ===== Planning Methods =====
			case 'getCurrentPlan':
				return this.getCurrentPlan();

			case 'createPlan':
				return this.createPlan(params.goal, params.tasks);

			case 'updateTaskStatus':
				return this.updateTaskStatus(params.taskId, params.status, params.notes);

			// ===== Settings Methods =====
			case 'getSettings':
				return this.getSettings();

			case 'getModels':
				return this.getModels();

			default:
				throw new Error(`Unknown API method: ${method}`);
		}
	}

	// ===== Chat/Thread Implementations =====

	private async getThreads() {
		const allThreads = this.chatThreadService.state.allThreads;
		if (!allThreads) return [];
		return Object.values(allThreads).map((thread: any) => ({
			id: thread.id,
			createdAt: thread.createdAt,
			lastModified: thread.lastModified,
			messageCount: thread.messages?.length || 0,
		}));
	}

	private async getThread(threadId: string) {
		const allThreads = this.chatThreadService.state.allThreads;
		if (!allThreads) throw new Error('No threads available');
		const thread = allThreads[threadId];
		if (!thread) {
			throw new Error('Thread not found');
		}
		return {
			id: thread.id,
			createdAt: thread.createdAt,
			lastModified: thread.lastModified,
			messages: thread.messages.map((msg: any) => ({
				role: msg.role,
				content: msg.content,
				timestamp: msg.timestamp,
			})),
		};
	}

	private async createThread(_name?: string) {
		this.chatThreadService.openNewThread();
		const currentThread = this.chatThreadService.getCurrentThread();
		return {
			id: currentThread.id,
			createdAt: currentThread.createdAt,
		};
	}

	private async sendMessage(threadId: string, message: string) {
		const allThreads = this.chatThreadService.state.allThreads;
		if (!allThreads || !allThreads[threadId]) {
			throw new Error('Thread not found');
		}

		// Send message via chat service
		await this.chatThreadService.addUserMessageAndStreamResponse({
			userMessage: message,
			threadId
		});

		return { success: true, threadId };
	}

	private async deleteThread(threadId: string) {
		this.chatThreadService.deleteThread(threadId);
		return { success: true };
	}

	private async getThreadStatus(threadId: string) {
		const allThreads = this.chatThreadService.state.allThreads;
		if (!allThreads) throw new Error('No threads available');
		const thread = allThreads[threadId];
		if (!thread) {
			throw new Error('Thread not found');
		}

		// Check stream state for running status
		const streamState = this.chatThreadService.streamState[threadId];
		const isRunning = streamState?.isRunning === 'LLM' || streamState?.isRunning === 'tool';
		return {
			threadId,
			isRunning,
			lastActivity: thread.lastModified,
		};
	}

	private async cancelThread(threadId: string) {
		// Cancel any running operations for this thread
		await this.chatThreadService.abortRunning(threadId);
		return { success: true };
	}

	// ===== Workspace Implementations =====

	private async getWorkspace() {
		// Get workspace root folders
		const workspace = this.workspaceContextService.getWorkspace();
		return {
			folders: workspace.folders.map((folder: any) => ({
				uri: folder.uri.toString(),
				name: folder.name,
			})),
		};
	}

	private async getFiles(page: number = 1, limit: number = 50, filter?: string) {
		// This is a simplified implementation
		// In a real implementation, you'd traverse the workspace and filter files
		return {
			files: [],
			page,
			limit,
			total: 0,
		};
	}

	private async getFileTree() {
		// Simplified - return workspace structure
		const workspace = this.workspaceContextService.getWorkspace();
		return {
			roots: workspace.folders.map((folder: any) => ({
				uri: folder.uri.toString(),
				name: folder.name,
			})),
		};
	}

	private async readFile(path: string) {
		try {
			const uri = URI.parse(path);
			const content = await this.fileService.readFile(uri);
			return {
				path,
				content: content.value.toString(),
				size: content.value.byteLength,
			};
		} catch (err) {
			throw new Error(`Failed to read file: ${err}`);
		}
	}

	private async getFileOutline(path: string) {
		// This would require integration with the outline service
		// For now, return a placeholder
		return {
			path,
			outline: [],
		};
	}

	private async searchFiles(query: string, type: string = 'content') {
		// This would require integration with the search service
		// For now, return empty results
		return {
			query,
			type,
			results: [],
		};
	}

	private async getDiagnostics() {
		// This would require integration with the diagnostics service
		// For now, return empty diagnostics
		return {
			diagnostics: [],
		};
	}

	// ===== Planning Implementations =====

	private async getCurrentPlan() {
		const planningService = this.toolsService.getPlanningService();
		const plan = planningService.getPlanStatus();
		return plan;
	}

	private async createPlan(goal: string, tasks: any[]) {
		const planningService = this.toolsService.getPlanningService();
		const plan = planningService.createPlan(goal, tasks);
		return plan;
	}

	private async updateTaskStatus(taskId: string, status: string, notes?: string) {
		const planningService = this.toolsService.getPlanningService();
		const task = planningService.updateTaskStatus(taskId, status as any, notes);
		return task;
	}

	// ===== Settings Implementations =====

	private async getSettings() {
		const state = this.settingsService.state;
		return {
			globalSettings: state.globalSettings,
			modelSelectionOfFeature: state.modelSelectionOfFeature,
		};
	}

	private async getModels() {
		const state = this.settingsService.state;
		return {
			models: state._modelOptions,
		};
	}
}
