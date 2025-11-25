/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { IServerChannel } from '../../../../base/parts/ipc/common/ipc.js';
import { Event, Emitter } from '../../../../base/common/event.js';

/**
 * API Channel for IPC communication between main and renderer processes
 * Allows the API server (main process) to call services in the renderer process
 */
export class ApiChannel implements IServerChannel {

	private readonly _onApiRequest = new Emitter<{ method: string, params: any, resolve: (result: any) => void, reject: (error: any) => void }>();

	constructor() { }

	listen(_: unknown, event: string): Event<any> {
		throw new Error(`API Channel does not support listening to events: ${event}`);
	}

	async call(_: unknown, command: string, params: any): Promise<any> {
		// Forward API requests to the renderer process
		return new Promise((resolve, reject) => {
			this._onApiRequest.fire({ method: command, params, resolve, reject });
		});
	}

	/**
	 * Subscribe to API requests from the main process
	 */
	onApiRequest(handler: (request: { method: string, params: any, resolve: (result: any) => void, reject: (error: any) => void }) => void): void {
		this._onApiRequest.event(handler);
	}
}
