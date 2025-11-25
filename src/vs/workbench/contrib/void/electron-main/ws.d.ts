declare module 'ws' {
	import { IncomingMessage } from 'http';
	import { EventEmitter } from 'events';

	export class WebSocketServer extends EventEmitter {
		constructor(options: { server: any });
		close(): void;
	}

	export class WebSocket extends EventEmitter {
		readyState: number;
		static readonly OPEN: number;
		send(data: string): void;
		close(code?: number, reason?: string): void;
	}
}
