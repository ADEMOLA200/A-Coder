/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import ivm from 'isolated-vm';

/**
 * Code Execution Service
 * 
 * Implements Anthropic's "Code Execution with MCP" pattern for 98% token reduction.
 * Instead of passing large data through the model context, code runs in a sandbox
 * and only returns small summaries/results.
 * 
 * Key benefits:
 * - Large data stays in execution environment (never enters model context)
 * - Tools can be composed in code (no round-trips through model)
 * - Local processing (filter, transform, aggregate without token cost)
 * - Progressive tool discovery (load only needed tools)
 */

export interface CodeExecutionOptions {
	/** Maximum memory in MB (default: 128) */
	memoryLimit?: number;
	/** Execution timeout in ms (default: 30000) */
	timeout?: number;
	/** Language to execute (default: 'typescript') */
	language?: 'typescript' | 'javascript';
	/** Callback function for tool calls (called via IPC) */
	toolCallback?: (toolName: string, params: any) => Promise<any>;
}

export interface CodeExecutionResult {
	/** Success or error */
	success: boolean;
	/** Return value from code (if success) */
	result?: any;
	/** Error message (if failure) */
	error?: string;
	/** Console output captured during execution */
	logs?: string[];
}

export class CodeExecutionService {
	
	constructor() {
		// Tool calling will be added via IPC in a future iteration
	}

	/**
	 * Execute TypeScript/JavaScript code in an isolated sandbox.
	 * 
	 * Note: Tool access will be added in a future iteration via IPC callbacks.
	 * For now, this executes pure JavaScript/TypeScript code.
	 * 
	 * Example:
	 * ```typescript
	 * const data = [1, 2, 3, 4, 5];
	 * const sum = data.reduce((a, b) => a + b, 0);
	 * return { sum, average: sum / data.length };
	 * ```
	 */
	async executeCode(
		code: string,
		options: CodeExecutionOptions = {}
	): Promise<CodeExecutionResult> {
		const {
			memoryLimit = 128,
			timeout = 30000,
			toolCallback
		} = options;

		const logs: string[] = [];

		try {
			// Create isolate with memory limit
			const isolate = new ivm.Isolate({ memoryLimit });

			// Create context
			const context = await isolate.createContext();

			// Get global object
			const jail = context.global;

			// Set global reference
			await jail.set('global', jail.derefInto());

			// Create console.log for capturing output
			await jail.set('log', new ivm.Callback((...args: any[]) => {
				const message = args.map(arg => 
					typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
				).join(' ');
				logs.push(message);
			}));

			// Create console object
			await context.eval(`
				global.console = {
					log: (...args) => log(...args),
					error: (...args) => log('ERROR:', ...args),
					warn: (...args) => log('WARN:', ...args),
					info: (...args) => log('INFO:', ...args)
				};
			`);

			// Create tools object if callback provided
			if (toolCallback) {
				const toolsObject = await this.createToolsObject(isolate, context, toolCallback);
				await jail.set('tools', toolsObject);
			}

			// Wrap code in async function
			const wrappedCode = `
				(async () => {
					${code}
				})()
			`;

			// Compile and run with timeout
			const script = await isolate.compileScript(wrappedCode);
			const result = await script.run(context, { timeout, promise: true });

			// Copy result back to main isolate
			const copiedResult = await result?.copy();

			// Dispose isolate
			isolate.dispose();

			return {
				success: true,
				result: copiedResult,
				logs
			};

		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
				logs
			};
		}
	}

	/**
	 * Create a tools object that exposes all built-in tools as async functions
	 * in the isolated context via IPC callbacks.
	 */
	private async createToolsObject(
		isolate: ivm.Isolate,
		context: ivm.Context,
		toolCallback: (toolName: string, params: any) => Promise<any>
	): Promise<ivm.Reference<object>> {
		const toolWrappers: Record<string, ivm.Callback> = {};

		// List of all built-in tools (excluding run_code to prevent recursion)
		const toolNames = [
			'read_file', 'outline_file', 'ls_dir', 'get_dir_tree',
			'search_pathnames_only', 'search_for_files', 'search_in_file',
			'read_lint_errors', 'create_file_or_folder', 'delete_file_or_folder',
			'edit_file', 'rewrite_file', 'run_command', 'run_persistent_command',
			'open_persistent_terminal', 'kill_persistent_terminal'
		];

		// Create a callback wrapper for each tool
		for (const toolName of toolNames) {
			toolWrappers[toolName] = new ivm.Callback(async (...args: any[]) => {
				try {
					// Call the tool via IPC callback
					const result = await toolCallback(toolName, args);
					// Return stringified result since we can't transfer complex objects
					return JSON.stringify(result);
				} catch (error) {
					throw new Error(`Tool ${toolName} failed: ${error instanceof Error ? error.message : String(error)}`);
				}
			}, { async: true });
		}

		// Create the tools object in the isolate
		const toolsRef = await context.eval(`({})`);
		for (const [name, callback] of Object.entries(toolWrappers)) {
			await toolsRef.set(name, callback);
		}

		return toolsRef;
	}
}
