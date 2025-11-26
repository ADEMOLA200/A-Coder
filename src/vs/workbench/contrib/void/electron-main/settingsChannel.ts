/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0 See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { IServerChannel } from '../../../../base/parts/ipc/common/ipc.js';
import { Event } from '../../../../base/common/event.js';

/**
 * Settings Channel for IPC communication between renderer and main processes
 * Handles settings updates from renderer process
 */
export class SettingsChannel implements IServerChannel {

	constructor(
		private readonly settingsService: any,
		private readonly apiAuthService: any
	) { }

	listen(_: unknown, event: string): Event<any> {
		throw new Error(`Settings Channel does not support listening to events: ${event}`);
	}

	async call(_: unknown, command: string, params: any): Promise<any> {
		switch (command) {
			case 'updateApiSettings':
				// console.log('[SettingsChannel] Received updateApiSettings:', params);
				this.settingsService.updateApiSettings(params);

				// Also update tokens in API auth service
				if (params.tokens) {
					this.apiAuthService.setTokens(params.tokens);
				}

				return { success: true };

			default:
				throw new Error(`Unknown command: ${command}`);
		}
	}
}
