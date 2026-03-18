/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { Emitter, Event } from '../../../../base/common/event.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { IChannel } from '../../../../base/parts/ipc/common/ipc.js';
import { IMainProcessService } from '../../../../platform/ipc/common/mainProcessService.js';
import {
	ComposioToolkit,
	ComposioTool,
	ComposioConnection,
	ComposioConnectionInitResponse,
	ComposioToolExecutionResponse,
	ComposioAuthScheme,
} from './voidSettingsTypes.js';
import { IVoidSettingsService } from './voidSettingsService.js';
import { IMetricsService } from './metricsService.js';

/**
 * API response types (snake_case from Composio API)
 * These map to our internal camelCase types
 */
interface ComposioToolkitApiResponse {
	slug: string;
	name: string;
	meta?: {
		description?: string;
		logo?: string;
		categories?: (string | { name: string })[];
		tools_count?: number;
		triggers_count?: number;
	};
	auth_schemes?: string[];
	composio_managed_auth_schemes?: string[];
	status: string;
	deprecated?: boolean;
}

interface ComposioToolApiResponse {
	slug: string;
	name: string;
	description: string;
	toolkit?: {
		slug: string;
		name: string;
	};
	input_parameters?: Record<string, {
		type: string;
		description?: string;
		required?: boolean;
		default?: unknown;
		enum?: string[];
	}>;
	output_parameters?: Record<string, {
		type: string;
		description?: string;
	}>;
	scopes?: string[];
	tags?: string[];
	no_auth?: boolean;
	status: string;
}

/**
 * Composio service state for UI binding
 */
export interface ComposioServiceState {
	/** Cached list of available toolkits */
	toolkits: ComposioToolkit[];
	/** Whether a fetch operation is in progress */
	isLoading: boolean;
	/** Last error message, if any */
	error: string | undefined;
	/** Timestamp of last successful toolkit fetch */
	lastFetch: number | undefined;
	/** Current Tool Router session ID */
	sessionId: string | undefined;
}

/**
 * Tool Router session response from Composio API
 */
export interface ComposioSessionResponse {
	session_id: string;
	mcp: {
		type: string;
		url: string;
	};
	tool_router_tools: string[];
	config: {
		user_id: string;
		toolkits: {
			enabled?: string[];
			disabled?: string[];
		};
		manage_connections?: {
			enabled: boolean;
			callback_url?: string;
			enable_wait_for_connections?: boolean;
		};
	};
	experimental?: {
		assistive_prompt?: string;
	};
}

/**
 * Tool Router meta tool definition (for agent use)
 * These are the special tools that let the agent self-manage connections and tool discovery.
 */
export interface ComposioMetaTool {
	/** Tool name (e.g., 'COMPOSIO_MANAGE_CONNECTIONS', 'COMPOSIO_SEARCH_TOOLS') */
	name: string;
	/** Tool description */
	description: string;
	/** JSON Schema for parameters */
	parameters: {
		type: 'object';
		properties: Record<string, {
			type: string;
			description?: string;
			enum?: string[];
			items?: {
				type: string;
			};
		}>;
		required: string[];
	};
}

/**
 * Service interface for Composio app marketplace integration.
 *
 * This service manages:
 * - Fetching available apps/toolkits from Composio
 * - Managing connections to third-party apps
 * - Executing tools on behalf of the agent during chat
 * - Tool Router session management for dynamic tool discovery
 *
 * The Tool Router approach allows the agent to:
 * - Self-manage connections via COMPOSIO_MANAGE_CONNECTIONS
 * - Search for appropriate tools via COMPOSIO_SEARCH_TOOLS
 * - Execute tools via the session-based MCP endpoint
 *
 * @example
 * // Check if Composio is configured
 * if (composioService.isConfigured()) {
 *   // Create a Tool Router session for the agent
 *   const session = await composioService.createSession();
 *   const metaTools = await composioService.getMetaTools(session.session_id);
 *   // Pass metaTools to the agent for self-managed tool usage
 * }
 */
export interface IComposioService {
	readonly _serviceBrand: undefined;
	readonly state: ComposioServiceState;
	readonly onDidChangeState: Event<void>;

	// ============================================
	// API Key Management
	// ============================================

	/** Set the user's Composio API key */
	setApiKey(apiKey: string): Promise<void>;

	/** Get the current API key (may be empty) */
	getApiKey(): string;

	// ============================================
	// Tool Router Session Management
	// ============================================

	/**
	 * Create a new Tool Router session for the agent.
	 * This session provides meta tools for self-managing connections and tool discovery.
	 * @param enabledToolkits Optional list of toolkit slugs to enable. If empty, enables all.
	 * @param callbackUrl Optional callback URL for OAuth flows
	 */
	createSession(enabledToolkits?: string[], callbackUrl?: string): Promise<ComposioSessionResponse>;

	/**
	 * Get the current session ID if one exists.
	 */
	getSessionId(): string | undefined;

	/**
	 * Get meta tools for a Tool Router session.
	 * These are special tools like COMPOSIO_MANAGE_CONNECTIONS and COMPOSIO_SEARCH_TOOLS
	 * that allow the agent to self-manage connections and discover tools.
	 */
	getMetaTools(sessionId: string): Promise<ComposioMetaTool[]>;

	/**
	 * Execute a meta tool (COMPOSIO_*) via the Tool Router session.
	 * Meta tools include COMPOSIO_MANAGE_CONNECTIONS, COMPOSIO_SEARCH_TOOLS, etc.
	 */
	executeMetaTool(
		sessionId: string,
		toolSlug: string,
		arguments_: Record<string, unknown>
	): Promise<{ data?: unknown; error?: string }>;

	/**
	 * Execute a tool via the Tool Router session.
	 * This handles tool execution with automatic connection management.
	 */
	executeToolViaSession(
		sessionId: string,
		toolSlug: string,
		arguments_: Record<string, unknown>
	): Promise<ComposioToolExecutionResponse>;

	// ============================================
	// Toolkit (App) Management (for UI)
	// ============================================

	/** Fetch all available toolkits/apps from Composio */
	fetchToolkits(): Promise<ComposioToolkit[]>;

	/** Get cached toolkit by slug or fetch it */
	fetchToolkitBySlug(slug: string): Promise<ComposioToolkit | undefined>;

	/** Get all tools for a specific toolkit */
	fetchTools(toolkitSlug: string): Promise<ComposioTool[]>;

	// ============================================
	// Connection Management (for UI)
	// ============================================

	/** Initiate an OAuth connection flow for a toolkit */
	initiateConnection(toolkitSlug: string, redirectUrl?: string): Promise<ComposioConnectionInitResponse>;

	/** Poll for connection completion (for OAuth flows) */
	waitForConnection(connectionId: string, timeoutMs?: number): Promise<ComposioConnection | undefined>;

	/** Get connection status for a specific connection */
	checkConnectionStatus(connectionId: string): Promise<ComposioConnection | undefined>;

	/** Refresh an expired connection */
	refreshConnection(connectionId: string): Promise<ComposioConnection | undefined>;

	/** Delete a connection */
	deleteConnection(connectionId: string): Promise<void>;

	/** List all active connections for the user */
	listConnections(): Promise<ComposioConnection[]>;

	/** Enable a toolkit for agent use */
	enableToolkit(toolkitSlug: string): Promise<void>;

	/** Disable a toolkit from agent use */
	disableToolkit(toolkitSlug: string): Promise<void>;

	// ============================================
	// Tool Execution (Direct, for backward compatibility)
	// ============================================

	/** Execute a tool with the given arguments (direct API call) */
	executeTool(
		toolSlug: string,
		arguments_: Record<string, unknown>,
		connectedAccountId?: string
	): Promise<ComposioToolExecutionResponse>;

	// ============================================
	// Agent Integration
	// ============================================

	/**
	 * Get tool definitions formatted for the agent to use during chat.
	 * If toolkits are enabled in settings, returns tools for those toolkits.
	 * If using Tool Router, call getMetaTools() instead for self-managing agent.
	 */
	getToolDefinitions(toolkitSlugs?: string[]): Promise<ComposioToolDefinition[]>;

	// ============================================
	// Utility
	// ============================================

	/** Check if the user has configured their Composio API key */
	isConfigured(): boolean;

	/** Clear all cached data */
	clearCache(): void;
}

export const IComposioService = createDecorator<IComposioService>('composioService');

/**
 * Tool definition formatted for the agent to invoke during chats.
 * This is compatible with OpenAI function calling format.
 */
export interface ComposioToolDefinition {
	/** Unique tool name for the agent */
	name: string;
	/** Description of what the tool does */
	description: string;
	/** JSON Schema for parameters */
	parameters: {
		type: 'object';
		properties: Record<string, {
			type: string;
			description?: string;
			enum?: string[];
		}>;
		required: string[];
	};
	/** Parent toolkit slug */
	toolkitSlug: string;
	/** Composio tool slug */
	toolSlug: string;
}

/**
 * Cache entry with TTL support
 */
interface CacheEntry<T> {
	data: T;
	timestamp: number;
}

/**
 * Connection status type from Composio API
 */
type ConnectionStatus = 'ACTIVE' | 'PENDING' | 'FAILED' | 'EXPIRED';

/**
 * Composio service implementation.
 *
 * Uses IPC channel to communicate with Composio backend from the main process,
 * bypassing CORS restrictions in the renderer process.
 *
 * Supports two modes:
 * 1. Tool Router mode: Agent self-manages connections via meta tools (recommended)
 * 2. Direct mode: Pre-configure toolkits and connections in settings
 */
class ComposioService extends Disposable implements IComposioService {
	_serviceBrand: undefined;

	private readonly _onDidChangeState = new Emitter<void>();
	readonly onDidChangeState: Event<void> = this._onDidChangeState.event;

	private readonly channel: IChannel;

	private _state: ComposioServiceState = {
		toolkits: [],
		isLoading: false,
		error: undefined,
		lastFetch: undefined,
		sessionId: undefined,
	};

	// Cache with 5-minute TTL
	private _toolkitCache: Map<string, CacheEntry<ComposioToolkit>> = new Map();
	private _toolsCache: Map<string, CacheEntry<ComposioTool[]>> = new Map();
	private _sessionCache: Map<string, CacheEntry<ComposioMetaTool[]>> = new Map();
	private readonly _cacheTTL = 5 * 60 * 1000; // 5 minutes

	constructor(
		@IMainProcessService private readonly mainProcessService: IMainProcessService,
		@IVoidSettingsService private readonly voidSettingsService: IVoidSettingsService,
		@IMetricsService private readonly metricsService: IMetricsService,
	) {
		super();
		this.channel = this.mainProcessService.getChannel('void-channel-composio');
	}

	get state(): ComposioServiceState {
		return this._state;
	}

	private _setState(newState: Partial<ComposioServiceState>): void {
		this._state = { ...this._state, ...newState };
		this._onDidChangeState.fire();
	}

	/**
	 * Make an authenticated request to Composio API via IPC channel.
	 * This bypasses CORS restrictions by making the request from the main process.
	 */
	private async _fetch<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<{ data?: T; error?: { code: string; message: string } }> {
		const apiKey = this.getApiKey();

		if (!apiKey) {
			return {
				error: {
					code: 'INVALID_API_KEY',
					message: 'Composio API key not configured. Please set your API key in settings.',
				},
			};
		}

		try {
			const result = await this.channel.call<{
				data?: T;
				error?: { code: string; message: string };
			}>('fetch', {
				endpoint,
				method: options.method || 'GET',
				body: options.body as string | undefined,
				apiKey,
			});

			return result;
		} catch (err) {
			return {
				error: {
					code: 'EXECUTION_FAILED',
					message: `IPC error: ${err instanceof Error ? err.message : 'Unknown error'}`,
				},
			};
		}
	}

	// ============================================
	// API Key Management
	// ============================================

	async setApiKey(apiKey: string): Promise<void> {
		await this.voidSettingsService.setGlobalSetting('composioApiKey', apiKey);
		this.metricsService.capture('Composio API Key Set', { hasKey: !!apiKey });
	}

	getApiKey(): string {
		return this.voidSettingsService.state.globalSettings.composioApiKey || '';
	}

	// ============================================
	// Tool Router Session Management
	// ============================================

	/**
	 * Create a new Tool Router session.
	 * This is the primary method for agent integration - the session provides
	 * meta tools that let the agent self-manage connections and discover tools.
	 */
	async createSession(
		enabledToolkits?: string[],
		callbackUrl?: string
	): Promise<ComposioSessionResponse> {
		const userId = 'default'; // Could be made configurable for multi-user scenarios

		const body: Record<string, unknown> = {
			user_id: userId,
		};

		// If specific toolkits are enabled, pass them
		if (enabledToolkits && enabledToolkits.length > 0) {
			body.toolkits = { enable: enabledToolkits };
		}

		// Add callback URL if provided (for OAuth flows)
		if (callbackUrl) {
			body.manage_connections = {
				enabled: true,
				callback_url: callbackUrl,
				enable_wait_for_connections: false,
			};
		}

		console.log('[Composio] Creating session with body:', JSON.stringify(body));

		const { data, error } = await this._fetch<ComposioSessionResponse>(
			'/tool_router/session',
			{
				method: 'POST',
				body: JSON.stringify(body),
			}
		);

		if (error) {
			console.error('[Composio] Session creation failed:', error.code, error.message);
			throw new Error(error.message || 'Failed to create Tool Router session');
		}

		if (!data) {
			throw new Error('Failed to create Tool Router session - no response');
		}

		console.log('[Composio] Session created successfully:', data.session_id);

		// Cache the session ID
		this._setState({ sessionId: data.session_id });

		this.metricsService.capture('Composio Session Created', {
			sessionId: data.session_id,
			toolkits: enabledToolkits?.length || 0,
		});

		return data;
	}

	/**
	 * Get the current session ID if one exists.
	 */
	getSessionId(): string | undefined {
		return this._state.sessionId;
	}

	/**
	 * Get meta tools for a Tool Router session.
	 * These are special tools that allow the agent to:
	 * - COMPOSIO_MANAGE_CONNECTIONS: Create and manage app connections
	 * - COMPOSIO_SEARCH_TOOLS: Search for appropriate tools for a task
	 * - COMPOSIO_GET_TOOL_SCHEMAS: Get input schemas for tools
	 *
	 * Note: We return static definitions because Node.js/Electron fetch doesn't
	 * allow body with GET requests, which the Composio API requires for the
	 * /tool_router/session/:id/tools endpoint.
	 */
	async getMetaTools(sessionId: string): Promise<ComposioMetaTool[]> {
		// Check cache first
		const cached = this._sessionCache.get(sessionId);
		if (cached && Date.now() - cached.timestamp < this._cacheTTL) {
			console.log('[Composio] Returning cached meta tools for session:', sessionId);
			return cached.data;
		}

		console.log('[Composio] Using static meta tool definitions for session:', sessionId);

		// Static definitions for Tool Router meta tools
		// These are well-documented and don't change frequently
		const metaTools: ComposioMetaTool[] = [
			{
				name: 'COMPOSIO_MANAGE_CONNECTIONS',
				description: 'Create or manage connections to user applications. Returns authentication links for OAuth/API key setup. Use this when you need to connect a new app or verify existing connections. Always show the redirect_url to the user as a formatted link.',
				parameters: {
					type: 'object',
					properties: {
						toolkit_names: {
							type: 'array',
							items: { type: 'string' },
							description: 'List of toolkit names to manage connections for (e.g., ["github", "gmail"]). Use exact names returned by COMPOSIO_SEARCH_TOOLS.',
						},
						reinitiate_all: {
							type: 'boolean',
							description: 'Set to true to force reconnection for all toolkits, even if already connected.',
						},
					},
					required: ['toolkit_names'],
				},
			},
			{
				name: 'COMPOSIO_SEARCH_TOOLS',
				description: 'Search for available tools based on a task description. Returns matching tools with their slugs, descriptions, and connection status. Use this first to discover which tools can accomplish a task.',
				parameters: {
					type: 'object',
					properties: {
						search_query: {
							type: 'string',
							description: 'Natural language description of the task you want to accomplish (e.g., "send an email", "create a GitHub issue").',
						},
						toolkit_names: {
							type: 'array',
							items: { type: 'string' },
							description: 'Optional list of toolkit names to filter search results (e.g., ["github", "gmail"]).',
						},
					},
					required: ['search_query'],
				},
			},
			{
				name: 'COMPOSIO_GET_TOOL_SCHEMAS',
				description: 'Get input schemas for specific tools by their slugs. Returns complete parameter definitions including types, descriptions, and required fields. Use this when COMPOSIO_SEARCH_TOOLS does not provide full schema details.',
				parameters: {
					type: 'object',
					properties: {
						tool_slugs: {
							type: 'array',
							items: { type: 'string' },
							description: 'List of tool slugs to get schemas for (e.g., ["GITHUB_CREATE_ISSUE", "GMAIL_SEND_EMAIL"]).',
						},
					},
					required: ['tool_slugs'],
				},
			},
			{
				name: 'COMPOSIO_EXECUTE_TOOLS',
				description: 'Execute a tool action. Use after COMPOSIO_SEARCH_TOOLS to find the right tool and COMPOSIO_GET_TOOL_SCHEMAS to get the parameters. Returns the tool execution result.',
				parameters: {
					type: 'object',
					properties: {
						tool_slug: {
							type: 'string',
							description: 'The slug of the tool to execute (e.g., "GITHUB_CREATE_ISSUE").',
						},
						arguments: {
							type: 'object',
							description: 'The arguments to pass to the tool. Must match the schema returned by COMPOSIO_GET_TOOL_SCHEMAS.',
						},
					},
					required: ['tool_slug'],
				},
			},
		];

		// Cache the result
		this._sessionCache.set(sessionId, {
			data: metaTools,
			timestamp: Date.now(),
		});

		return metaTools;
	}

	/**
	 * Execute a meta tool (COMPOSIO_*) via the Tool Router session.
	 * Meta tools include COMPOSIO_MANAGE_CONNECTIONS, COMPOSIO_SEARCH_TOOLS, etc.
	 */
	async executeMetaTool(
		sessionId: string,
		toolSlug: string,
		arguments_: Record<string, unknown>
	): Promise<{ data?: unknown; error?: string }> {
		console.log('[Composio] Executing meta tool:', toolSlug, 'with args:', JSON.stringify(arguments_));

		const { data, error } = await this._fetch<unknown>(
			`/tool_router/session/${sessionId}/execute_meta`,
			{
				method: 'POST',
				body: JSON.stringify({
					slug: toolSlug,
					arguments: arguments_,
				}),
			}
		);

		if (error) {
			console.error('[Composio] Meta tool execution failed:', error.message);
			return { error: error.message };
		}

		console.log('[Composio] Meta tool raw response:', JSON.stringify(data, null, 2));

		// The API returns { data: {...}, error: null, log_id: "..." }
		// We want to return the nested data field
		const responseData = data as { data?: unknown; error?: string | null } | undefined;
		return { data: responseData?.data };
	}

	/**
	 * Execute a tool via the Tool Router session.
	 * This handles tool execution with automatic connection management.
	 */
	async executeToolViaSession(
		sessionId: string,
		toolSlug: string,
		arguments_: Record<string, unknown>
	): Promise<ComposioToolExecutionResponse> {
		// Check if this is a meta tool
		if (toolSlug.startsWith('COMPOSIO_')) {
			const result = await this.executeMetaTool(sessionId, toolSlug, arguments_);
			return {
				successful: !result.error,
				data: result.data as Record<string, unknown> | undefined,
				error: result.error,
			};
		}

		// For regular tools, use the execute endpoint
		const { data, error } = await this._fetch<ComposioToolExecutionResponse>(
			'/tools/execute',
			{
				method: 'POST',
				body: JSON.stringify({
					session_id: sessionId,
					tool_slug: toolSlug,
					arguments: arguments_,
				}),
			}
		);

		if (error) {
			return {
				successful: false,
				error: error.message,
			};
		}

		this.metricsService.capture('Composio Tool Executed via Session', {
			toolSlug,
			sessionId,
		});

		return {
			successful: data?.successful ?? true,
			data: data?.data,
			error: data?.error,
			logId: data?.logId,
		};
	}

	// ============================================
	// Toolkit (App) Management
	// ============================================

	/**
	 * Fetch all available toolkits/apps from Composio.
	 * Results are cached for 5 minutes.
	 */
	async fetchToolkits(): Promise<ComposioToolkit[]> {
		this._setState({ isLoading: true, error: undefined });

		const { data, error } = await this._fetch<{ items: ComposioToolkitApiResponse[] }>(
			'/toolkits?limit=1000&sort_by=usage'
		);

		if (error) {
			this._setState({ isLoading: false, error: error.message });
			return [];
		}

		const toolkits: ComposioToolkit[] = (data?.items || []).map((item): ComposioToolkit => {
			// Determine status - Composio API may not have 'status' field
			// Default to 'active' unless explicitly marked as deprecated
			let status: 'active' | 'inactive' | 'deprecated';

			if (item.status) {
				// If status is provided, normalize it
				const normalizedStatus = item.status.toLowerCase();
				if (normalizedStatus === 'active') {
					status = 'active';
				} else if (normalizedStatus === 'deprecated' || normalizedStatus === 'inactive') {
					status = normalizedStatus as 'deprecated' | 'inactive';
				} else {
					status = 'active'; // Unknown status, default to active
				}
			} else if (item.deprecated && typeof item.deprecated === 'boolean' && item.deprecated) {
				// Deprecated is a boolean and true
				status = 'deprecated';
			} else {
				// No status field and not explicitly deprecated - default to active
				status = 'active';
			}

			return {
				slug: item.slug,
				name: item.name,
				description: item.meta?.description,
				logo: item.meta?.logo,
				categories: item.meta?.categories?.map((c: string | { name: string }) => typeof c === 'string' ? c : c.name),
				authSchemes: (item.auth_schemes || []) as ComposioAuthScheme[],
				composioManagedAuthSchemes: (item.composio_managed_auth_schemes || []) as ComposioAuthScheme[],
				toolsCount: item.meta?.tools_count || 0,
				triggersCount: item.meta?.triggers_count,
				status,
				appUrl: item.meta?.description,
			};
		});

		// Update cache
		toolkits.forEach(t => {
			this._toolkitCache.set(t.slug, {
				data: t,
				timestamp: Date.now(),
			});
		});

		this._setState({
			toolkits,
			isLoading: false,
			lastFetch: Date.now(),
		});

		this.metricsService.capture('Composio Toolkits Fetched', { count: toolkits.length });

		return toolkits;
	}

	/**
	 * Fetch a specific toolkit by its slug.
	 */
	async fetchToolkitBySlug(slug: string): Promise<ComposioToolkit | undefined> {
		// Check cache first
		const cached = this._toolkitCache.get(slug);
		if (cached && Date.now() - cached.timestamp < this._cacheTTL) {
			return cached.data;
		}

		const { data, error } = await this._fetch<ComposioToolkit>(`/toolkits/${slug}`);

		if (error || !data) {
			return undefined;
		}

		// Update cache
		this._toolkitCache.set(slug, {
			data,
			timestamp: Date.now(),
		});

		return data;
	}

	/**
	 * Fetch all tools for a specific toolkit.
	 */
	async fetchTools(toolkitSlug: string): Promise<ComposioTool[]> {
		// Check cache first
		const cached = this._toolsCache.get(toolkitSlug);
		if (cached && Date.now() - cached.timestamp < this._cacheTTL) {
			return cached.data;
		}

		const { data, error } = await this._fetch<{ items: ComposioToolApiResponse[] }>(
			`/tools?toolkit_slug=${toolkitSlug}&limit=1000`
		);

		if (error || !data) {
			return [];
		}

		const tools: ComposioTool[] = (data.items || []).map((item): ComposioTool => ({
			slug: item.slug,
			name: item.name,
			description: item.description,
			toolkitSlug: item.toolkit?.slug || toolkitSlug,
			toolkitName: item.toolkit?.name || '',
			inputParameters: item.input_parameters || {},
			outputParameters: item.output_parameters,
			scopes: item.scopes,
			tags: item.tags,
			noAuth: item.no_auth,
			status: item.status === 'active' ? 'active' : 'inactive',
		}));

		// Update cache
		this._toolsCache.set(toolkitSlug, {
			data: tools,
			timestamp: Date.now(),
		});

		return tools;
	}

	// ============================================
	// Connection Management
	// ============================================

	/**
	 * Get or create a Composio-managed auth config for a toolkit.
	 * This allows using Composio's OAuth credentials instead of managing your own.
	 */
	private async _getOrCreateAuthConfig(toolkitSlug: string): Promise<string | undefined> {
		// First, check if there's already a Composio-managed auth config for this toolkit
		const { data: existingConfigs, error: listError } = await this._fetch<{
			items: Array<{
				id: string;
				toolkit?: { slug: string };
				is_composio_managed?: boolean;
				status?: string;
			}>;
		}>(`/auth_configs?toolkit_slug=${toolkitSlug}&is_composio_managed=true&limit=10`);

		if (!listError && existingConfigs?.items?.length) {
			// Found existing Composio-managed auth config
			const enabledConfig = existingConfigs.items.find(c =>
				c.status === 'ENABLED' || c.status === 'active'
			);
			if (enabledConfig) {
				console.log('[Composio] Found existing auth config:', enabledConfig.id);
				return enabledConfig.id;
			}
		}

		// No existing config, create a new Composio-managed auth config
		// Using the v3 API format
		const { data: newConfig, error: createError } = await this._fetch<{
			auth_config?: { id: string };
			id?: string;
		}>(
			'/auth_configs',
			{
				method: 'POST',
				body: JSON.stringify({
					toolkit: { slug: toolkitSlug },
					auth_config: { type: 'use_composio_managed_auth' },
				}),
			}
		);

		if (createError) {
			console.error('[Composio] Failed to create auth config:', createError.code, createError.message);
			return undefined;
		}

		// Response can be either { auth_config: { id: string } } or { id: string }
		const authConfigId = newConfig?.auth_config?.id || newConfig?.id;
		if (!authConfigId) {
			console.error('[Composio] Auth config creation returned no ID:', newConfig);
			return undefined;
		}

		console.log('[Composio] Created new auth config:', authConfigId);
		return authConfigId;
	}

	/**
	 * Initiate an OAuth connection flow for a toolkit.
	 * Returns a redirect URL for the user to authorize the app.
	 */
	async initiateConnection(
		toolkitSlug: string,
		redirectUrl?: string
	): Promise<ComposioConnectionInitResponse> {
		const userId = 'default';

		// Get or create an auth config for this toolkit
		const authConfigId = await this._getOrCreateAuthConfig(toolkitSlug);

		if (!authConfigId) {
			console.error('[Composio] No auth config available for toolkit:', toolkitSlug);
			return {
				id: '',
				status: 'failed',
				redirectUrl: undefined,
				error: 'Failed to get or create auth configuration. Please check your Composio API key has the required permissions.',
			};
		}

		console.log('[Composio] Initiating connection for toolkit:', toolkitSlug, 'with auth_config_id:', authConfigId);

		// Initiate the connection using the auth config ID
		const { data, error } = await this._fetch<{
			link_token?: string;
			redirect_url?: string;
			connected_account_id?: string;
			id?: string;
			expires_at?: string;
		}>(
			'/connected_accounts/link',
			{
				method: 'POST',
				body: JSON.stringify({
					auth_config_id: authConfigId,
					user_id: userId,
					callback_url: redirectUrl,
				}),
			}
		);

		if (error) {
			console.error('[Composio] Failed to initiate connection:', error);
			return {
				id: '',
				status: 'failed',
				redirectUrl: undefined,
				error: error.message,
			};
		}

		if (!data) {
			return {
				id: '',
				status: 'failed',
				redirectUrl: undefined,
				error: 'No response from connection request',
			};
		}

		console.log('[Composio] Connection initiated:', data);

		this.metricsService.capture('Composio Connection Initiated', { toolkitSlug });

		// The API may return connected_account_id or id - use whichever is available
		const connectionId = data.connected_account_id || data.id || data.link_token || '';

		return {
			id: connectionId,
			status: 'pending',
			redirectUrl: data.redirect_url,
			connectedAccountId: data.connected_account_id,
		};
	}

	/**
	 * Poll for connection completion.
	 * Useful for OAuth flows where the user needs to authorize in a browser.
	 */
	async waitForConnection(
		connectionId: string,
		timeoutMs: number = 60000
	): Promise<ComposioConnection | undefined> {
		const startTime = Date.now();
		const pollInterval = 2000; // 2 seconds

		while (Date.now() - startTime < timeoutMs) {
			const connection = await this.checkConnectionStatus(connectionId);

			if (connection?.status === 'active') {
				return connection;
			}

			// Wait before next poll
			await new Promise(resolve => setTimeout(resolve, pollInterval));
		}

		return undefined;
	}

	/**
	 * Check the status of a connection.
	 */
	async checkConnectionStatus(connectionId: string): Promise<ComposioConnection | undefined> {
		const { data, error } = await this._fetch<{
			id: string;
			status: ConnectionStatus;
			toolkit?: { slug: string; name: string };
			connected_account?: { id: string };
		}>(`/connected_accounts/${connectionId}`);

		if (error || !data) {
			return undefined;
		}

		return {
			id: data.id,
			toolkitSlug: data.toolkit?.slug || '',
			toolkitName: data.toolkit?.name || '',
			status: this._mapConnectionStatus(data.status),
			connectedAccountId: data.connected_account?.id,
			authScheme: 'oauth2',
			createdAt: Date.now(),
		};
	}

	/**
	 * Refresh an expired connection.
	 */
	async refreshConnection(connectionId: string): Promise<ComposioConnection | undefined> {
		const { data, error } = await this._fetch<ComposioConnection>(
			`/connected_accounts/${connectionId}/refresh`,
			{ method: 'POST' }
		);

		if (error || !data) {
			return undefined;
		}

		return data;
	}

	/**
	 * Delete a connection.
	 */
	async deleteConnection(connectionId: string): Promise<void> {
		await this._fetch(`/connected_accounts/${connectionId}`, { method: 'DELETE' });

		// Update settings
		const connections = { ...this.voidSettingsService.state.globalSettings.composioConnections };
		for (const [slug, id] of Object.entries(connections)) {
			if (id === connectionId) {
				delete connections[slug];
			}
		}
		await this.voidSettingsService.setGlobalSetting('composioConnections', connections);

		this.metricsService.capture('Composio Connection Deleted', { connectionId });
	}

	/**
	 * List all connections for the user.
	 */
	async listConnections(): Promise<ComposioConnection[]> {
		const { data, error } = await this._fetch<{
			items: Array<{
				id: string;
				status: ConnectionStatus;
				toolkit?: { slug: string; name: string };
				connected_account?: { id: string };
				created_at?: string;
			}>;
		}>('/connected_accounts');

		if (error || !data) {
			return [];
		}

		return (data.items || []).map(item => ({
			id: item.id,
			toolkitSlug: item.toolkit?.slug || '',
			toolkitName: item.toolkit?.name || '',
			status: this._mapConnectionStatus(item.status),
			connectedAccountId: item.connected_account?.id,
			authScheme: 'oauth2' as const,
			createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
		}));
	}

	/**
	 * Enable a toolkit for agent use.
	 */
	async enableToolkit(toolkitSlug: string): Promise<void> {
		const enabled = [...this.voidSettingsService.state.globalSettings.composioEnabledToolkits];
		if (!enabled.includes(toolkitSlug)) {
			enabled.push(toolkitSlug);
			await this.voidSettingsService.setGlobalSetting('composioEnabledToolkits', enabled);
		}
	}

	/**
	 * Disable a toolkit from agent use.
	 */
	async disableToolkit(toolkitSlug: string): Promise<void> {
		const enabled = this.voidSettingsService.state.globalSettings.composioEnabledToolkits.filter(
			s => s !== toolkitSlug
		);
		await this.voidSettingsService.setGlobalSetting('composioEnabledToolkits', enabled);
	}

	// ============================================
	// Tool Execution
	// ============================================

	/**
	 * Execute a tool with the given arguments.
	 */
	async executeTool(
		toolSlug: string,
		arguments_: Record<string, unknown>,
		connectedAccountId?: string
	): Promise<ComposioToolExecutionResponse> {
		// Get connected account ID from settings if not provided
		let accountId = connectedAccountId;
		if (!accountId) {
			// Try to find the toolkit slug from the tool slug (e.g., GITHUB_GET_REPO -> github)
			const toolkitSlug = toolSlug.split('_')[0]?.toLowerCase();
			if (toolkitSlug) {
				accountId = this.voidSettingsService.state.globalSettings.composioConnections[toolkitSlug];
			}
		}

		const { data, error } = await this._fetch<ComposioToolExecutionResponse>(
			`/tools/execute/${toolSlug}`,
			{
				method: 'POST',
				body: JSON.stringify({
					connected_account_id: accountId,
					arguments: arguments_,
				}),
			}
		);

		if (error) {
			return {
				successful: false,
				error: error.message,
			};
		}

		this.metricsService.capture('Composio Tool Executed', { toolSlug });

		return {
			successful: data?.successful ?? true,
			data: data?.data,
			error: data?.error,
			logId: data?.logId,
		};
	}

	// ============================================
	// Agent Integration
	// ============================================

	/**
	 * Get tool definitions formatted for the agent to use during chat.
	 * Returns tools in OpenAI function calling format.
	 */
	async getToolDefinitions(toolkitSlugs?: string[]): Promise<ComposioToolDefinition[]> {
		const slugs = toolkitSlugs ||
			this.voidSettingsService.state.globalSettings.composioEnabledToolkits;

		if (slugs.length === 0) {
			return [];
		}

		const allTools: ComposioToolDefinition[] = [];

		for (const slug of slugs) {
			const tools = await this.fetchTools(slug);

			for (const tool of tools) {
				if (tool.status !== 'active') continue;

				const properties: Record<string, {
					type: string;
					description?: string;
					enum?: string[];
				}> = {};

				const required: string[] = [];

				for (const [key, param] of Object.entries(tool.inputParameters)) {
					properties[key] = {
						type: param.type || 'string',
						description: param.description,
					};

					if (param.required) {
						required.push(key);
					}
				}

				allTools.push({
					name: `composio_${tool.slug.toLowerCase()}`,
					description: `${tool.description} (from ${tool.toolkitName})`,
					parameters: {
						type: 'object',
						properties,
						required,
					},
					toolkitSlug: tool.toolkitSlug,
					toolSlug: tool.slug,
				});
			}
		}

		return allTools;
	}

	// ============================================
	// Utility
	// ============================================

	/**
	 * Check if Composio is configured (API key is set).
	 */
	isConfigured(): boolean {
		return !!this.getApiKey();
	}

	/**
	 * Clear all cached data.
	 */
	clearCache(): void {
		this._toolkitCache.clear();
		this._toolsCache.clear();
		this._sessionCache.clear();
		this._setState({ lastFetch: undefined, sessionId: undefined });
	}

	/**
	 * Map Composio API status to our status type.
	 */
	private _mapConnectionStatus(status: ConnectionStatus): ComposioConnection['status'] {
		switch (status) {
			case 'ACTIVE':
				return 'active';
			case 'PENDING':
				return 'pending';
			case 'EXPIRED':
				return 'expired';
			case 'FAILED':
			default:
				return 'failed';
		}
	}
}

registerSingleton(IComposioService, ComposioService, InstantiationType.Eager);