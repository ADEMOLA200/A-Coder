/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { IChannel } from '../../../../base/parts/ipc/common/ipc.js';
import { Emitter, Event } from '../../../../base/common/event.js';
import { ApiServiceBridge } from './apiServiceBridge.js';

/**
 * API Server Handler Channel
 * This is a client-side channel that listens for API requests from the main process
 * and forwards them to the ApiServiceBridge for execution
 */
export class ApiServerHandler implements IChannel {

	private readonly _onDidReceiveRequest = new Emitter<{ method: string, params: any, resolve: (result: any) => void, reject: (error: any) => void }>();
	private apiBridge: ApiServiceBridge;

	constructor(apiBridge: ApiServiceBridge) {
		this.apiBridge = apiBridge;

		// Listen for requests from main process and forward to the bridge
		this._onDidReceiveRequest.event(async ({ method, params, resolve, reject }) => {
			try {
				const result = await this.apiBridge.handleApiCall(method, params);
				resolve(result);
			} catch (error) {
				reject(error);
			}
		});
	}

	call(command: string, args?: any): Promise<any> {
		// This channel only receives requests, doesn't send them
		throw new Error(`ApiServerHandler does not support call command: ${command}`);
	}

	listen(event: string): Event<any> {
		if (event === 'request') {
			return this._onDidReceiveRequest.event;
		}
		throw new Error(`Unknown event: ${event}`);
	}
}
