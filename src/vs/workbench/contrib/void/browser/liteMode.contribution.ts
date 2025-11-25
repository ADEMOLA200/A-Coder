/*--------------------------------------------------------------------------------------
 *  Copyright 2025 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { LiteModeService } from './liteModeService.js';

export interface ILiteModeService {
	/**
	 * Opens Lite Mode in a new webview panel
	 */
	openLiteMode(): Promise<void>;

	/**
	 * Closes the Lite Mode webview panel
	 */
	closeLiteMode(): void;

	/**
	 * Checks if Lite Mode is currently open
	 */
	isLiteModeOpen(): boolean;
}

// Create the service decorator
export const ILiteModeService = createDecorator<ILiteModeService>('voidLiteModeService');

// Register the Lite Mode service as a singleton
registerSingleton(ILiteModeService, LiteModeService, InstantiationType.Eager);
