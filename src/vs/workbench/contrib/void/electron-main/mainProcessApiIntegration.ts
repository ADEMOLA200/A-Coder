/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { ApiServiceManager } from './apiServiceManager.js';
import { IVoidSettingsService } from '../common/voidSettingsService.js';
import { IApiAuthService } from '../common/apiAuthService.js';

/**
 * Main Process API Integration
 * Manages the API server lifecycle in the main process
 */
export class MainProcessApiIntegration extends Disposable {

	private apiServiceManager: ApiServiceManager | null = null;

	constructor(
		@IVoidSettingsService private readonly settingsService: IVoidSettingsService,
		@IApiAuthService private readonly apiAuthService: IApiAuthService,
	) {
		super();

		// Initialize API service manager
		this.initializeApiServer();

		// Listen for settings changes
		this._register(this.settingsService.onDidChangeState(() => {
			this.handleSettingsChange();
		}));
	}

	private async initializeApiServer() {
		const settings = this.settingsService.state.globalSettings;

		// Create API service manager
		this.apiServiceManager = new ApiServiceManager(
			() => ({
				enabled: settings.apiEnabled,
				port: settings.apiPort,
				tokens: settings.apiTokens,
				tunnelUrl: settings.apiTunnelUrl,
			}),
			(token: string) => this.apiAuthService.validateToken(token)
		);

		// Start if enabled
		if (settings.apiEnabled) {
			try {
				await this.apiServiceManager.start();
			} catch (err) {
				console.error('[API Integration] Failed to start API server:', err);
			}
		}
	}

	private async handleSettingsChange() {
		if (!this.apiServiceManager) {
			return;
		}

		// Restart server if settings changed
		try {
			await this.apiServiceManager.restart();
		} catch (err) {
			console.error('[API Integration] Failed to restart API server:', err);
		}
	}

	override dispose(): void {
		if (this.apiServiceManager) {
			this.apiServiceManager.stop();
		}
		super.dispose();
	}
}
