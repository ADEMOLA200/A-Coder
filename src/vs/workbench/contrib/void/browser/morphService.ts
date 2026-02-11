/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { IVoidSettingsService } from '../common/voidSettingsService.js';
import { IMainProcessService } from '../../../../platform/ipc/common/mainProcessService.js';

export const IMorphService = createDecorator<IMorphService>('MorphService');

export interface IMorphService {
	_serviceBrand: undefined;

	/**
	 * Gather context using Morph Fast Context (warpGrep) API
	 * @param query Search query
	 * @param repoRoot Root directory of the repository
	 * @returns The context results from Morph
	 */
	fastContext(params: {
		query: string;
		repoRoot: string;
	}): Promise<{ file: string; content: string }[]>;

	/**
	 * Apply code changes using Morph Fast Apply API
	 */
	applyCodeChange(params: {
		instruction: string;
		originalCode: string;
		updatedCode: string;
		model?: 'morph-v3-fast' | 'morph-v3-large' | 'auto';
	}): Promise<string>;

	/**
	 * Morph Repo Storage: codebase semantic search
	 */
	codebaseSearch(params: {
		query: string;
		repoId?: string;
		branch?: string;
		commitHash?: string;
		target_directories?: string[];
		limit?: number;
	}): Promise<{
		success: boolean;
		results: Array<{
			filepath: string;
			content: string;
			rerankScore: number;
			language: string;
			startLine: number;
			endLine: number;
		}>;
		stats: { searchTimeMs: number };
	}>;

	/**
	 * Morph Repo Storage: git operations
	 */
	repoInit(params: { repoId?: string; dir?: string }): Promise<{ success: boolean }>;
	repoClone(params: { repoId: string; dir: string }): Promise<{ success: boolean }>;
	repoAdd(params: { dir?: string; filepath?: string }): Promise<{ success: boolean }>;
	repoCommit(params: { dir?: string; message: string; metadata?: Record<string, any> }): Promise<{ success: boolean; commitSha?: string }>;
	repoPush(params: { dir?: string; branch?: string; index?: boolean; waitForEmbeddings?: boolean }): Promise<{ success: boolean }>;
	repoPull(params: { dir?: string }): Promise<{ success: boolean }>;
	repoStatus(params: { dir?: string; filepath: string }): Promise<any>;
	repoStatusMatrix(params: { dir?: string }): Promise<any[]>;
	repoLog(params: { dir?: string; depth?: number }): Promise<any[]>;
	repoCheckout(params: { dir?: string; ref: string }): Promise<{ success: boolean }>;
	repoBranch(params: { dir?: string; name: string }): Promise<{ success: boolean }>;
	repoListBranches(params: { dir?: string }): Promise<string[]>;
	repoCurrentBranch(params: { dir?: string }): Promise<string>;
	repoResolveRef(params: { dir?: string; ref: string }): Promise<string>;
	repoGetCommitMetadata(params: { repoId?: string; commitHash: string }): Promise<any>;
	repoWaitForEmbeddings(params: { repoId?: string; timeoutMs?: number }): Promise<{ success: boolean }>;
}

export class MorphService implements IMorphService {
	_serviceBrand: undefined;

	constructor(
		@IVoidSettingsService private readonly _settingsService: IVoidSettingsService,
		@IMainProcessService private readonly _mainProcessService: IMainProcessService,
	) { }

	async fastContext(params: {
		query: string;
		repoRoot: string;
	}): Promise<{ file: string; content: string }[]> {
		const { query, repoRoot } = params;

		console.log('[MorphService] Starting fastContext...');
		console.log('[MorphService] Query:', query);
		console.log('[MorphService] Repo root:', repoRoot);

		// Get API key from settings
		const apiKey = this._settingsService.state.globalSettings.morphApiKey;
		if (!apiKey) {
			console.error('[MorphService] No API key configured');
			throw new Error('Morph API key not configured. Please add your API key in Settings.');
		}

		// Get IPC channel to electron-main
		const channel = this._mainProcessService.getChannel('void-channel-morph');

		console.log('[MorphService] Calling Morph SDK (warpGrep) via IPC channel...');

		try {
			// Call the main process to use Morph SDK
			const contexts = await channel.call('fastContext', {
				query,
				repoRoot,
				apiKey
			}) as { file: string; content: string }[];

			console.log(`[MorphService] Successfully received ${contexts.length} contexts from Morph`);
			return contexts;
		} catch (error) {
			console.error('[MorphService] IPC call failed for fastContext:', error);
			throw error;
		}
	}

	async applyCodeChange(params: {
		instruction: string;
		originalCode: string;
		updatedCode: string;
		model?: 'morph-v3-fast' | 'morph-v3-large' | 'auto';
	}): Promise<string> {
		const { instruction, originalCode, updatedCode, model } = params;

		console.log('[MorphService] Starting applyCodeChange...');
		console.log('[MorphService] Instruction:', instruction);
		console.log('[MorphService] Original code length:', originalCode.length);
		console.log('[MorphService] Updated code length:', updatedCode.length);

		// Get API key and model from settings
		const apiKey = this._settingsService.state.globalSettings.morphApiKey;
		if (!apiKey) {
			console.error('[MorphService] No API key configured');
			throw new Error('Morph API key not configured. Please add your API key in Settings.');
		}

		// Use model from parameter or fall back to settings
		const selectedModel = model || this._settingsService.state.globalSettings.morphModel;
		console.log('[MorphService] Using model:', selectedModel);

		// Get IPC channel to electron-main
		const channel = this._mainProcessService.getChannel('void-channel-morph');

		console.log('[MorphService] Calling Morph SDK via IPC channel...');

		try {
			// Call the main process to use Morph SDK
			const appliedCode = await channel.call('applyCodeChange', {
				instruction,
				originalCode,
				updatedCode,
				filePath: 'temp.ts', // Temp file name, actual path created in main process
				apiKey,
				model: selectedModel
			}) as string;

			console.log('[MorphService] Successfully received applied code, length:', appliedCode.length);
			return appliedCode;
		} catch (error) {
			console.error('[MorphService] IPC call failed:', error);
			throw error;
		}
	}

	private _getApiKey(): string {
		const apiKey = this._settingsService.state.globalSettings.morphApiKey;
		if (!apiKey) {
			throw new Error('Morph API key not configured. Please add your API key in Settings.');
		}
		return apiKey;
	}

	private _getRepoDefaults() {
		const gs = this._settingsService.state.globalSettings;
		return {
			repoId: gs.morphRepoId,
			branch: gs.morphRepoBranch || 'main',
			index: gs.morphRepoIndexOnPush ?? true,
			waitForEmbeddings: gs.morphRepoWaitForEmbeddings ?? false,
		};
	}

	async codebaseSearch(params: {
		query: string;
		repoId?: string;
		branch?: string;
		commitHash?: string;
		target_directories?: string[];
		limit?: number;
	}) {
		const apiKey = this._getApiKey();
		const defaults = this._getRepoDefaults();
		const channel = this._mainProcessService.getChannel('void-channel-morph');
		const results = await channel.call('codebaseSearch', {
			apiKey,
			query: params.query,
			repoId: params.repoId ?? defaults.repoId,
			branch: params.branch ?? defaults.branch,
			commitHash: params.commitHash,
			target_directories: params.target_directories ?? [],
			limit: params.limit ?? 10,
		}) as {
			success: boolean;
			results: Array<{
				filepath: string;
				content: string;
				rerankScore: number;
				language: string;
				startLine: number;
				endLine: number;
			}>;
			stats: { searchTimeMs: number };
		};
		return results;
	}

	async repoInit(params: { repoId?: string; dir?: string }) {
		const apiKey = this._getApiKey();
		const defaults = this._getRepoDefaults();
		const channel = this._mainProcessService.getChannel('void-channel-morph');
		return channel.call('repoInit', {
			apiKey,
			repoId: params.repoId ?? defaults.repoId,
			dir: params.dir,
		}) as Promise<{ success: boolean }>;
	}

	async repoClone(params: { repoId: string; dir: string }) {
		const apiKey = this._getApiKey();
		const channel = this._mainProcessService.getChannel('void-channel-morph');
		return channel.call('repoClone', { apiKey, ...params }) as Promise<{ success: boolean }>;
	}

	async repoAdd(params: { dir?: string; filepath?: string }) {
		const apiKey = this._getApiKey();
		const channel = this._mainProcessService.getChannel('void-channel-morph');
		return channel.call('repoAdd', { apiKey, ...params }) as Promise<{ success: boolean }>;
	}

	async repoCommit(params: { dir?: string; message: string; metadata?: Record<string, any> }) {
		const apiKey = this._getApiKey();
		const channel = this._mainProcessService.getChannel('void-channel-morph');
		return channel.call('repoCommit', { apiKey, ...params }) as Promise<{ success: boolean; commitSha?: string }>;
	}

	async repoPush(params: { dir?: string; branch?: string; index?: boolean; waitForEmbeddings?: boolean }) {
		const apiKey = this._getApiKey();
		const defaults = this._getRepoDefaults();
		const channel = this._mainProcessService.getChannel('void-channel-morph');
		return channel.call('repoPush', {
			apiKey,
			dir: params.dir,
			branch: params.branch ?? defaults.branch,
			index: params.index ?? defaults.index,
			waitForEmbeddings: params.waitForEmbeddings ?? defaults.waitForEmbeddings,
		}) as Promise<{ success: boolean }>;
	}

	async repoPull(params: { dir?: string }) {
		const apiKey = this._getApiKey();
		const channel = this._mainProcessService.getChannel('void-channel-morph');
		return channel.call('repoPull', { apiKey, ...params }) as Promise<{ success: boolean }>;
	}

	async repoStatus(params: { dir?: string; filepath: string }) {
		const apiKey = this._getApiKey();
		const channel = this._mainProcessService.getChannel('void-channel-morph');
		return channel.call('repoStatus', { apiKey, ...params }) as Promise<any>;
	}

	async repoStatusMatrix(params: { dir?: string }) {
		const apiKey = this._getApiKey();
		const channel = this._mainProcessService.getChannel('void-channel-morph');
		return channel.call('repoStatusMatrix', { apiKey, ...params }) as Promise<any[]>;
	}

	async repoLog(params: { dir?: string; depth?: number }) {
		const apiKey = this._getApiKey();
		const channel = this._mainProcessService.getChannel('void-channel-morph');
		return channel.call('repoLog', { apiKey, ...params }) as Promise<any[]>;
	}

	async repoCheckout(params: { dir?: string; ref: string }) {
		const apiKey = this._getApiKey();
		const channel = this._mainProcessService.getChannel('void-channel-morph');
		return channel.call('repoCheckout', { apiKey, ...params }) as Promise<{ success: boolean }>;
	}

	async repoBranch(params: { dir?: string; name: string }) {
		const apiKey = this._getApiKey();
		const channel = this._mainProcessService.getChannel('void-channel-morph');
		return channel.call('repoBranch', { apiKey, ...params }) as Promise<{ success: boolean }>;
	}

	async repoListBranches(params: { dir?: string }) {
		const apiKey = this._getApiKey();
		const channel = this._mainProcessService.getChannel('void-channel-morph');
		return channel.call('repoListBranches', { apiKey, ...params }) as Promise<string[]>;
	}

	async repoCurrentBranch(params: { dir?: string }) {
		const apiKey = this._getApiKey();
		const channel = this._mainProcessService.getChannel('void-channel-morph');
		return channel.call('repoCurrentBranch', { apiKey, ...params }) as Promise<string>;
	}

	async repoResolveRef(params: { dir?: string; ref: string }) {
		const apiKey = this._getApiKey();
		const channel = this._mainProcessService.getChannel('void-channel-morph');
		return channel.call('repoResolveRef', { apiKey, ...params }) as Promise<string>;
	}

	async repoGetCommitMetadata(params: { repoId?: string; commitHash: string }) {
		const apiKey = this._getApiKey();
		const defaults = this._getRepoDefaults();
		const channel = this._mainProcessService.getChannel('void-channel-morph');
		return channel.call('repoGetCommitMetadata', {
			apiKey,
			repoId: params.repoId ?? defaults.repoId,
			commitHash: params.commitHash,
		}) as Promise<any>;
	}

	async repoWaitForEmbeddings(params: { repoId?: string; timeoutMs?: number }) {
		const apiKey = this._getApiKey();
		const defaults = this._getRepoDefaults();
		const channel = this._mainProcessService.getChannel('void-channel-morph');
		return channel.call('repoWaitForEmbeddings', {
			apiKey,
			repoId: params.repoId ?? defaults.repoId,
			timeoutMs: params.timeoutMs ?? 120000,
		}) as Promise<{ success: boolean }>;
	}
}

registerSingleton(IMorphService, MorphService, InstantiationType.Delayed);
