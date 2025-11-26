/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

// NOTE: This file is currently disabled - the API channel connection is handled by apiServiceBridge.ts
// The IMainProcessApiIntegration interface doesn't have getChannel() method.
// This file was intended to connect the main process API channel to the renderer process API bridge,
// but the actual implementation is in apiServiceBridge.ts which handles IPC directly.

/*
import { Disposable } from '../../../../base/common/lifecycle.js';
import { IApiServiceBridge } from './apiServiceBridge.js';
import { IMainProcessApiIntegration } from '../electron-main/mainProcessApiIntegration.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';

export const IApiChannelConnector = createDecorator<IApiChannelConnector>('ApiChannelConnector');

export interface IApiChannelConnector {
	readonly _serviceBrand: undefined;
}

export class ApiChannelConnector extends Disposable implements IApiChannelConnector {
	_serviceBrand: undefined;

	constructor(
		@IApiServiceBridge private readonly apiBridge: IApiServiceBridge,
		@IMainProcessApiIntegration private readonly mainProcessIntegration: IMainProcessApiIntegration,
	) {
		super();

		// Set up the connection
		this.setupConnection();
	}

	private setupConnection(): void {
		// Get the API channel from the main process integration
		const apiChannel = this.mainProcessIntegration.getChannel();

		// Set up the API bridge to handle requests from the channel
		apiChannel.onApiRequest(async (request: any) => {
			const { method, params, resolve, reject } = request;

			try {
				const result = await this.apiBridge.handleApiCall(method, params);
				resolve(result);
			} catch (error) {
				reject(error);
			}
		});
	}
}

// Register the service
registerSingleton(IApiChannelConnector, ApiChannelConnector, InstantiationType.Delayed);
*/
