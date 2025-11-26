/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { generateUuid } from '../../../../base/common/uuid.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { IVoidSettingsService } from './voidSettingsService.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';

/**
 * Service for managing Mobile API authentication tokens
 */
export interface IApiAuthService {
	readonly _serviceBrand: undefined;

	/**
	 * Generate a new API token
	 * @returns The generated token
	 */
	generateToken(): Promise<string>;

	/**
	 * Validate an API token
	 * @param token The token to validate
	 * @returns True if the token is valid
	 */
	validateToken(token: string): boolean;

	/**
	 * Revoke an API token
	 * @param token The token to revoke
	 */
	revokeToken(token: string): Promise<void>;

	/**
	 * Get all active tokens
	 * @returns Array of active tokens
	 */
	getTokens(): string[];
}

export const IApiAuthService = createDecorator<IApiAuthService>('ApiAuthService');
export class ApiAuthService implements IApiAuthService {
	_serviceBrand: undefined;

	constructor(
		@IVoidSettingsService private readonly settingsService: IVoidSettingsService
	) { }

	async generateToken(): Promise<string> {
		// Generate a secure random token (UUID v4)
		const token = `acoder_${generateUuid()}`;

		// Add to settings
		const currentTokens = this.settingsService.state.globalSettings.apiTokens;
		await this.settingsService.setGlobalSetting('apiTokens', [...currentTokens, token]);

		return token;
	}

	validateToken(token: string): boolean {
		const tokens = this.settingsService.state.globalSettings.apiTokens;
		return tokens.includes(token);
	}

	async revokeToken(token: string): Promise<void> {
		const currentTokens = this.settingsService.state.globalSettings.apiTokens;
		const newTokens = currentTokens.filter(t => t !== token);
		await this.settingsService.setGlobalSetting('apiTokens', newTokens);
	}

	getTokens(): string[] {
		return this.settingsService.state.globalSettings.apiTokens;
	}
}

registerSingleton(IApiAuthService, ApiAuthService, InstantiationType.Delayed);
