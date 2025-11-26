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
	 * Opens Lite Mode with walkthrough content
	 */
	openWalkthroughPreview(filePath: string, preview: string): Promise<void>;

	/**
	 * Opens Lite Mode with arbitrary markdown content (for implementation plans, etc.)
	 */
	openContentPreview(title: string, content: string): Promise<void>;

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
registerSingleton(ILiteModeService, LiteModeService, InstantiationType.Delayed);
