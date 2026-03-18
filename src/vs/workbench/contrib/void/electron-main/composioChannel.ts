/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

/**
 * Composio Channel for IPC communication between renderer and main processes.
 * Handles Composio API calls that would otherwise be blocked by CORS in the renderer.
 */

import { IServerChannel } from '../../../../base/parts/ipc/common/ipc.js';
import { Event, Emitter } from '../../../../base/common/event.js';

const COMPOSIO_API_BASE = 'https://backend.composio.dev/api/v3';

interface ComposioFetchParams {
	endpoint: string;
	method?: string;
	body?: string;
	apiKey: string;
}

interface ComposioFetchResult {
	data?: any;
	error?: { code: string; message: string };
}

export class ComposioChannel implements IServerChannel {

	private readonly _onDidChangeState = new Emitter<void>();
	readonly onDidChangeState: Event<void> = this._onDidChangeState.event;

	constructor() { }

	listen(_: unknown, event: string): Event<any> {
		switch (event) {
			case 'onDidChangeState':
				return this.onDidChangeState;
			default:
				throw new Error(`Composio Channel does not support listening to event: ${event}`);
		}
	}

	async call(_: unknown, command: string, params: any): Promise<any> {
		switch (command) {
			case 'fetch':
				return this._fetch(params as ComposioFetchParams);
			default:
				throw new Error(`Unknown command: ${command}`);
		}
	}

	/**
	 * Make an authenticated request to the Composio API from the main process.
	 * This bypasses CORS restrictions since main process has full network access.
	 */
	private async _fetch(params: ComposioFetchParams): Promise<ComposioFetchResult> {
		const { endpoint, method = 'GET', body, apiKey } = params;

		if (!apiKey) {
			return {
				error: {
					code: 'INVALID_API_KEY',
					message: 'Composio API key not configured.',
				},
			};
		}

		try {
			const logData = body ? (() => {
				try { return JSON.parse(body); } catch { return body; }
			})() : null;
			console.log(`[ComposioChannel] ${method} ${endpoint}`, logData !== null ? JSON.stringify(logData) : '(no body)');

			// Build fetch options
			const fetchOptions: RequestInit = {
				method,
				headers: {
					'x-api-key': apiKey,
					'Content-Type': 'application/json',
				},
			};

			// Add body if provided (some GET endpoints require empty JSON body)
			if (body) {
				fetchOptions.body = body;
			}

			console.log(`[ComposioChannel] Fetch options:`, JSON.stringify({
				method,
				hasBody: !!fetchOptions.body,
				bodyType: fetchOptions.body ? typeof fetchOptions.body : undefined,
			}));

			const response = await fetch(`${COMPOSIO_API_BASE}${endpoint}`, fetchOptions);

			if (!response.ok) {
				const errorText = await response.text();
				console.error(`[ComposioChannel] Error ${response.status}:`, errorText);
				let errorMessage = errorText;

				try {
					const errorJson = JSON.parse(errorText);
					errorMessage = errorJson.message || errorJson.error || errorJson.details || JSON.stringify(errorJson);
				} catch {
					// Use raw text if not JSON
				}

				if (response.status === 401) {
					return {
						error: {
							code: 'INVALID_API_KEY',
							message: 'Invalid Composio API key.',
						},
					};
				}

				if (response.status === 429) {
					return {
						error: {
							code: 'RATE_LIMIT_EXCEEDED',
							message: 'Rate limit exceeded. Please try again later.',
						},
					};
				}

				return {
					error: {
						code: 'EXECUTION_FAILED',
						message: `Composio API error: ${response.status} - ${errorMessage}`,
					},
				};
			}

			const data = await response.json();
			console.log(`[ComposioChannel] Success:`, endpoint, data ? JSON.stringify(data).substring(0, 500) : 'no data');
			return { data };
		} catch (err) {
			console.error(`[ComposioChannel] Network error:`, err);
			return {
				error: {
					code: 'EXECUTION_FAILED',
					message: `Network error: ${err instanceof Error ? err.message : 'Unknown error'}`,
				},
			};
		}
	}
}