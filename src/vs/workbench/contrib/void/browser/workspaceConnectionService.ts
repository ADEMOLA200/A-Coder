/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { Emitter, Event } from '../../../../base/common/event.js';
import { IWorkspaceConnectionService, WorkspaceConnection, WorkspaceThreadSummary, WORKSPACE_HEARTBEAT_INTERVAL } from '../common/workspaceRegistryTypes.js';
import { IThreadSummaryService } from '../common/workspaceRegistryTypes.js';
import { IWorkspaceContextService } from '../../../../platform/workspace/common/workspace.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js';
import { WORKSPACE_REGISTRY_STORAGE_KEY } from '../common/storageKeys.js';
import { generateUuid } from '../../../../base/common/uuid.js';
import { IChannel } from '../../../../base/parts/ipc/common/ipc.js';
import { ISharedProcessService } from '../../../../platform/ipc/electron-sandbox/services.js';

/**
 * Browser-side service that connects to the main process hub.
 * Registers the workspace on init and sends periodic heartbeats.
 */
class WorkspaceConnectionService extends Disposable implements IWorkspaceConnectionService {
	_serviceBrand: undefined;

	private workspaceId: string | null = null;
	private workspaceName: string = '';
	private workspacePath: string = '';
	private heartbeatInterval: NodeJS.Timeout | null = null;
	private channel: IChannel | null = null;

	private readonly _onDidReceiveWorkspaces = this._register(new Emitter<WorkspaceConnection[]>());
	readonly onDidReceiveWorkspaces: Event<WorkspaceConnection[]> = this._onDidReceiveWorkspaces.event;

	constructor(
		@IThreadSummaryService private readonly threadSummaryService: IThreadSummaryService,
		@IWorkspaceContextService private readonly workspaceContextService: IWorkspaceContextService,
		@ISharedProcessService private readonly sharedProcessService: ISharedProcessService,
		@IStorageService private readonly storageService: IStorageService
	) {
		super();
		this.initialize();
	}

	/**
	 * Initialize the workspace connection
	 */
	private async initialize(): Promise<void> {
		// Get workspace info
		const workspace = this.workspaceContextService.getWorkspace();
		const folders = workspace.folders;

		if (folders.length > 0) {
			this.workspacePath = folders[0].uri.fsPath;
			this.workspaceName = folders[0].name;
		} else {
			this.workspaceName = 'Untitled Workspace';
			this.workspacePath = '';
		}

		// Try to get or create workspace ID from storage
		const storedId = this.storageService.get(WORKSPACE_REGISTRY_STORAGE_KEY, StorageScope.WORKSPACE);
		if (storedId) {
			this.workspaceId = storedId;
		} else {
			this.workspaceId = generateUuid();
			this.storageService.store(WORKSPACE_REGISTRY_STORAGE_KEY, this.workspaceId, StorageScope.WORKSPACE, StorageTarget.MACHINE);
		}

		// Register with the hub
		await this.registerWithHub();

		// Start heartbeat
		this.startHeartbeat();

		// Listen for workspace changes
		this._register(this.workspaceContextService.onDidChangeWorkspaceFolders(() => {
			const folders = this.workspaceContextService.getWorkspace().folders;
			if (folders.length > 0) {
				this.workspacePath = folders[0].uri.fsPath;
				this.workspaceName = folders[0].name;
			}
		}));
	}

	/**
	 * Register this workspace with the main process hub
	 */
	private async registerWithHub(): Promise<void> {
		if (!this.workspaceId) return;

		try {
			// Get the shared process channel
			this.channel = this.sharedProcessService.getChannel('void-channel-workspace-hub');

			if (this.channel) {
				await this.channel.call('register', {
					id: this.workspaceId,
					name: this.workspaceName,
					path: this.workspacePath
				});

				// Listen for workspace updates
				const event = this.channel.listen<WorkspaceConnection[]>('onDidChangeWorkspaces');
				this._register(event(workspaces => {
					this._onDidReceiveWorkspaces.fire(workspaces);
				}));
			}
		} catch (err) {
			console.error('[WorkspaceConnection] Failed to register with hub:', err);
		}
	}

	/**
	 * Start the heartbeat interval
	 */
	private startHeartbeat(): void {
		this.heartbeatInterval = setInterval(() => {
			this.sendHeartbeatInternal();
		}, WORKSPACE_HEARTBEAT_INTERVAL);
	}

	/**
	 * Internal heartbeat sender
	 */
	private async sendHeartbeatInternal(): Promise<void> {
		if (!this.workspaceId || !this.channel) return;

		try {
			const threads = this.threadSummaryService.generateAllSummaries();
			const activeOperations = this.threadSummaryService.getActiveOperationsCount();

			await this.channel.call('heartbeat', {
				workspaceId: this.workspaceId,
				threads,
				activeOperations
			});
		} catch (err) {
			console.error('[WorkspaceConnection] Heartbeat failed:', err);
		}
	}

	/**
	 * Get all workspaces from the hub
	 */
	async getAllWorkspaces(): Promise<WorkspaceConnection[]> {
		if (!this.channel) {
			return [];
		}

		try {
			return await this.channel.call('getWorkspaces');
		} catch (err) {
			console.error('[WorkspaceConnection] Failed to get workspaces:', err);
			return [];
		}
	}

	/**
	 * Send a heartbeat to the hub
	 */
	async sendHeartbeat(threads: WorkspaceThreadSummary[], activeOperations: number): Promise<void> {
		if (!this.workspaceId || !this.channel) return;

		try {
			await this.channel.call('heartbeat', {
				workspaceId: this.workspaceId,
				threads,
				activeOperations
			});
		} catch (err) {
			console.error('[WorkspaceConnection] Heartbeat failed:', err);
		}
	}

	/**
	 * Update a specific thread
	 */
	async updateThread(thread: WorkspaceThreadSummary): Promise<void> {
		if (!this.workspaceId || !this.channel) return;

		try {
			await this.channel.call('updateThread', {
				workspaceId: this.workspaceId,
				thread
			});
		} catch (err) {
			console.error('[WorkspaceConnection] Update thread failed:', err);
		}
	}

	/**
	 * Full sync of current workspace state
	 */
	async fullSync(threads: WorkspaceThreadSummary[], activeOperations: number): Promise<void> {
		if (!this.workspaceId || !this.channel) return;

		try {
			await this.channel.call('fullSync', {
				workspaceId: this.workspaceId,
				threads,
				activeOperations
			});
		} catch (err) {
			console.error('[WorkspaceConnection] Full sync failed:', err);
		}
	}

	override dispose(): void {
		// Unregister from hub
		if (this.workspaceId && this.channel) {
			this.channel.call('unregister', this.workspaceId).catch(err => {
				console.error('[WorkspaceConnection] Unregister failed:', err);
			});
		}

		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
		}
		super.dispose();
	}
}

registerSingleton(IWorkspaceConnectionService, WorkspaceConnectionService, InstantiationType.Delayed);