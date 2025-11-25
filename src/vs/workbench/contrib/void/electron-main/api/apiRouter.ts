/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import * as http from 'http';
import * as url from 'url';

/**
 * Router for handling API requests
 */
export class ApiRouter {
	private routes: Map<string, Map<string, (req: http.IncomingMessage, res: http.ServerResponse, params: any) => Promise<void>>> = new Map();

	constructor() {
		// Initialize route maps for each HTTP method
		this.routes.set('GET', new Map());
		this.routes.set('POST', new Map());
		this.routes.set('PUT', new Map());
		this.routes.set('DELETE', new Map());
		this.routes.set('PATCH', new Map());
	}

	/**
	 * Register a route handler
	 */
	register(method: string, path: string, handler: (req: http.IncomingMessage, res: http.ServerResponse, params: any) => Promise<void>): void {
		const methodRoutes = this.routes.get(method.toUpperCase());
		if (!methodRoutes) {
			throw new Error(`Unsupported HTTP method: ${method}`);
		}
		methodRoutes.set(path, handler);
	}

	/**
	 * Handle an incoming request
	 */
	async handle(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
		const method = req.method?.toUpperCase() || 'GET';
		const parsedUrl = url.parse(req.url || '', true);
		const pathname = parsedUrl.pathname || '/';

		// Find matching route
		const methodRoutes = this.routes.get(method);
		if (!methodRoutes) {
			this.sendError(res, 405, 'Method Not Allowed');
			return;
		}

		// Try exact match first
		let handler = methodRoutes.get(pathname);
		let params: any = {};

		// If no exact match, try pattern matching
		if (!handler) {
			for (const [pattern, routeHandler] of methodRoutes.entries()) {
				const match = this.matchRoute(pattern, pathname);
				if (match) {
					handler = routeHandler;
					params = match.params;
					break;
				}
			}
		}

		if (!handler) {
			this.sendError(res, 404, 'Not Found');
			return;
		}

		try {
			// Parse body if present
			if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
				params.body = await this.parseBody(req);
			}

			// Add query params
			params.query = parsedUrl.query;

			// Call handler
			await handler(req, res, params);
		} catch (err) {
			console.error('[API Router] Error handling request:', err);
			this.sendError(res, 500, 'Internal Server Error', err instanceof Error ? err.message : String(err));
		}
	}

	/**
	 * Match a route pattern to a pathname
	 */
	private matchRoute(pattern: string, pathname: string): { params: any } | null {
		const patternParts = pattern.split('/').filter(p => p);
		const pathParts = pathname.split('/').filter(p => p);

		if (patternParts.length !== pathParts.length) {
			return null;
		}

		const params: any = {};
		for (let i = 0; i < patternParts.length; i++) {
			const patternPart = patternParts[i];
			const pathPart = pathParts[i];

			if (patternPart.startsWith(':')) {
				// Parameter
				const paramName = patternPart.substring(1);
				params[paramName] = decodeURIComponent(pathPart);
			} else if (patternPart !== pathPart) {
				// Mismatch
				return null;
			}
		}

		return { params };
	}

	/**
	 * Parse request body
	 */
	private parseBody(req: http.IncomingMessage): Promise<any> {
		return new Promise((resolve, reject) => {
			let body = '';
			req.on('data', chunk => {
				body += chunk.toString();
			});
			req.on('end', () => {
				try {
					const parsed = body ? JSON.parse(body) : {};
					resolve(parsed);
				} catch (err) {
					reject(new Error('Invalid JSON in request body'));
				}
			});
			req.on('error', reject);
		});
	}

	/**
	 * Send JSON response
	 */
	sendJson(res: http.ServerResponse, statusCode: number, data: any): void {
		res.writeHead(statusCode, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify(data));
	}

	/**
	 * Send error response
	 */
	sendError(res: http.ServerResponse, statusCode: number, error: string, details?: string): void {
		this.sendJson(res, statusCode, {
			error,
			...(details ? { details } : {})
		});
	}
}
