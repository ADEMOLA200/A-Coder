/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import * as http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Emitter } from '../../../../base/common/event.js';

/**
 * Mobile API Server
 * Provides REST and WebSocket endpoints for mobile companion app
 */
export class ApiServer {
	private server: http.Server | null = null;
	private wss: WebSocketServer | null = null;
	private readonly clients: Set<WebSocket> = new Set();

	private readonly _onRequest = new Emitter<{ req: http.IncomingMessage, res: http.ServerResponse }>();
	readonly onRequest = this._onRequest.event;

	constructor(
		private readonly port: number,
		private readonly validateToken: (token: string) => boolean
	) { }

	/**
	 * Start the API server
	 */
	async start(): Promise<void> {
		if (this.server) {
			throw new Error('API server is already running');
		}

		return new Promise((resolve, reject) => {
			// Create HTTP server
			this.server = http.createServer((req, res) => {
				this.handleRequest(req, res);
			});

			// Create WebSocket server
			this.wss = new WebSocketServer({ server: this.server });
			this.wss.on('connection', (ws: WebSocket, req: any) => {
				this.handleWebSocketConnection(ws, req);
			});

			// Start listening
			this.server.listen(this.port, '127.0.0.1', () => {
				resolve();
			});

			this.server.on('error', (err) => {
				console.error('[API Server] Error:', err);
				reject(err);
			});
		});
	}

	/**
	 * Stop the API server
	 */
	async stop(): Promise<void> {
		if (!this.server) {
			return;
		}

		// Close all WebSocket connections
		this.clients.forEach(client => {
			client.close();
		});
		this.clients.clear();

		// Close WebSocket server
		if (this.wss) {
			this.wss.close();
			this.wss = null;
		}

		// Close HTTP server
		return new Promise((resolve) => {
			this.server!.close(() => {
				this.server = null;
				resolve();
			});
		});
	}

	/**
	 * Check if server is running
	 */
	isRunning(): boolean {
		return this.server !== null;
	}

	/**
	 * Broadcast event to all connected WebSocket clients
	 */
	broadcast(event: { type: string, channel: string, event: string, data: any }): void {
		const message = JSON.stringify(event);
		this.clients.forEach(client => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(message);
			}
		});
	}

	/**
	 * Handle HTTP request
	 */
	private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
		// Set CORS headers
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

		// Handle preflight
		if (req.method === 'OPTIONS') {
			res.writeHead(200);
			res.end();
			return;
		}

		// Validate authentication
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			res.writeHead(401, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: 'Unauthorized: Missing or invalid Authorization header' }));
			return;
		}

		const token = authHeader.substring(7); // Remove 'Bearer ' prefix
		if (!this.validateToken(token)) {
			res.writeHead(401, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: 'Unauthorized: Invalid token' }));
			return;
		}

		// Fire event for route handling
		this._onRequest.fire({ req, res });
	}

	/**
	 * Handle WebSocket connection
	 */
	private handleWebSocketConnection(ws: WebSocket, req: http.IncomingMessage): void {
		// Validate authentication from query string or headers
		const url = new URL(req.url!, `http://${req.headers.host}`);
		const token = url.searchParams.get('token') || req.headers.authorization?.substring(7);

		if (!token || !this.validateToken(token)) {
			ws.close(1008, 'Unauthorized');
			return;
		}

		// Add to clients
		this.clients.add(ws);

		// Handle messages
		ws.on('message', (data: any) => {
			try {
				const message = JSON.parse(data.toString());
				this.handleWebSocketMessage(ws, message);
			} catch (err) {
				console.error('[API Server] WebSocket message error:', err);
			}
		});

		// Handle close
		ws.on('close', () => {
			this.clients.delete(ws);
		});

		// Send welcome message
		ws.send(JSON.stringify({ type: 'connected', message: 'Connected to A-Coder API' }));
	}

	/**
	 * Handle WebSocket message
	 */
	private handleWebSocketMessage(ws: WebSocket, message: any): void {
		// Handle subscription requests
		if (message.type === 'subscribe') {
			// Store subscription preferences (could be enhanced)
			ws.send(JSON.stringify({
				type: 'subscribed',
				channels: message.channels || []
			}));
		}
	}
}
