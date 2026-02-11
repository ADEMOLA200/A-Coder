/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { IChannel } from '../../../../base/parts/ipc/common/ipc.js';
import { Emitter, Event } from '../../../../base/common/event.js';
import { ApiServiceBridge } from './apiServiceBridge.js';

/**
 * API Request Handler Channel
 * Handles bidirectional communication between main and renderer processes for API requests
 */
export class ApiRequestHandler implements IChannel {

	private readonly _onRequest = new Emitter<{ method: string, params: any, requestId: string }>();
	private apiBridge: ApiServiceBridge;
	private apiChannel: IChannel;

	constructor(apiBridge: ApiServiceBridge, apiChannel: IChannel) {
		this.apiBridge = apiBridge;
		this.apiChannel = apiChannel;

		// Listen for requests from main process
		this._onRequest.event(async ({ method, params, requestId }) => {
			try {
				console.log(`[ApiRequestHandler] Handling request: ${method}`);
				const result = await this.apiBridge.handleApiCall(method, params);

				// Send response back to main process
				await this.apiChannel.call('apiResponse', { requestId, result });
			} catch (error) {
				console.error(`[ApiRequestHandler] Error handling ${method}:`, error);

				// Send error back to main process
				await this.apiChannel.call('apiResponse', {
					requestId,
					error: error instanceof Error ? error.message : String(error)
				});
			}
		});
	}

	call(command: string, args?: any): Promise<any> {
		if (command === 'handleRequest') {
			const { method, params, requestId } = args;
			// Fire the event to trigger the handler
			this._onRequest.fire({ method, params, requestId });
			return Promise.resolve();
		}

		throw new Error(`Unknown command: ${command}`);
	}

	listen(event: string): Event<any> {
		throw new Error(`ApiRequestHandler does not support listening to events: ${event}`);
	}
}
