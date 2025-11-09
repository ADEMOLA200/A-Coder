/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { IServerChannel } from '../../../../base/parts/ipc/common/ipc.js';
import { Event } from '../../../../base/common/event.js';
import { MorphClient } from '@morphllm/morphsdk';
import * as fs from 'fs';
import * as path from 'path';

/**
 * IPC Channel for Morph Fast Apply using SDK
 * Handles code application requests from renderer
 */
export class MorphChannel implements IServerChannel {
	private morphClients: Map<string, MorphClient> = new Map();

	private getMorphClient(apiKey: string): MorphClient {
		if (!this.morphClients.has(apiKey)) {
			this.morphClients.set(apiKey, new MorphClient({ apiKey }));
		}
		return this.morphClients.get(apiKey)!;
	}

	async call(_: unknown, command: string, arg?: any): Promise<any> {
		switch (command) {
			case 'applyCodeChange': {
				const { instruction, originalCode, updatedCode, filePath, apiKey } = arg as {
					instruction: string;
					originalCode: string;
					updatedCode: string;
					filePath: string;
					apiKey: string;
				};

				console.log('[MorphChannel] Starting Fast Apply...');
				console.log('[MorphChannel] Instruction:', instruction);
				console.log('[MorphChannel] File path:', filePath);
				console.log('[MorphChannel] Original code length:', originalCode.length);
				console.log('[MorphChannel] Updated code length:', updatedCode.length);

				// Create temp file with original content in current directory
				// SDK seems to treat paths as relative to CWD, so use current directory
				const tempFileName = `morph-${Date.now()}-${path.basename(filePath)}`;
				const tempFilePath = path.resolve(tempFileName);
				
				try {
					console.log('[MorphChannel] Writing temp file:', tempFilePath);
					fs.writeFileSync(tempFilePath, originalCode, 'utf8');

					// Get Morph client
					const morph = this.getMorphClient(apiKey);

					// Execute Fast Apply - use just filename since SDK prepends CWD
					console.log('[MorphChannel] Calling Morph Fast Apply SDK...');
					const result = await morph.fastApply.execute({
						target_filepath: tempFileName,
						instructions: instruction,
						code_edit: updatedCode
					});

					console.log('[MorphChannel] Fast Apply result:', {
						success: result.success,
						linesAdded: result.changes?.linesAdded,
						linesRemoved: result.changes?.linesRemoved,
						linesModified: result.changes?.linesModified
					});

					if (!result.success) {
						console.error('[MorphChannel] Fast Apply failed:', result.error);
						throw new Error(`Morph Fast Apply failed: ${result.error}`);
					}

					// Read the modified file
					const appliedCode = fs.readFileSync(tempFilePath, 'utf8');
					console.log('[MorphChannel] Successfully applied code, length:', appliedCode.length);
					
					return appliedCode;

				} catch (error) {
					console.error('[MorphChannel] Error:', error);
					throw error;
				} finally {
					// Always clean up temp file
					try {
						if (fs.existsSync(tempFilePath)) {
							fs.unlinkSync(tempFilePath);
							console.log('[MorphChannel] Cleaned up temp file');
						}
					} catch (cleanupError) {
						console.error('[MorphChannel] Failed to cleanup temp file:', cleanupError);
					}
				}
			}
			default:
				throw new Error(`Unknown command: ${command}`);
		}
	}

	listen(_: unknown, event: string): Event<any> {
		throw new Error(`Event not supported: ${event}`);
	}
}
