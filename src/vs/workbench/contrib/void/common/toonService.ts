/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

/**
 * TOON (Token-Oriented Object Notation) Service
 *
 * Provides efficient JSON compression for LLM tool outputs.
 * TOON uses a compact format that reduces token usage while preserving structure.
 *
 * Format examples:
 * - Objects: {key:value,key2:value2}
 * - Arrays: [item1,item2,item3]
 * - Strings: Unquoted when safe, quoted when needed
 * - Numbers/booleans: Direct representation
 * - Null: null
 */

export interface IToonService {
	/**
	 * Encode a JavaScript value to TOON format
	 * @param value Any JSON-serializable value
	 * @returns TOON-formatted string
	 */
	encode(value: any): string;

	/**
	 * Decode a TOON-formatted string back to JavaScript value
	 * @param toonStr TOON-formatted string
	 * @returns Decoded JavaScript value
	 */
	decode(toonStr: string): any;

	/**
	 * Check if TOON encoding would save tokens
	 * @param value Value to potentially encode
	 * @returns true if TOON would be more efficient
	 */
	shouldUseToon(value: any): boolean;
}

/**
 * Simple TOON implementation
 * This is a minimal implementation that provides basic compression.
 * For production use, consider using the @toon-format/toon package.
 */
export class ToonService implements IToonService {

	encode(value: any): string {
		return this._encodeValue(value);
	}

	decode(toonStr: string): any {
		try {
			// For now, TOON is JSON-compatible enough that we can parse it
			return JSON.parse(toonStr);
		} catch (e) {
			// Fallback: return as-is if parsing fails
			return toonStr;
		}
	}

	shouldUseToon(value: any): boolean {
		// Use TOON for objects and arrays that would benefit from compression
		if (typeof value === 'object' && value !== null) {
			const jsonStr = JSON.stringify(value);
			// Only use TOON if the JSON is reasonably large (>100 chars)
			// and contains structure that can be compressed
			return jsonStr.length > 100 && (Array.isArray(value) || Object.keys(value).length > 3);
		}
		return false;
	}

	private _encodeValue(value: any): string {
		if (value === null) return 'null';
		if (value === undefined) return 'null';

		const type = typeof value;

		if (type === 'boolean' || type === 'number') {
			return String(value);
		}

		if (type === 'string') {
			return this._encodeString(value);
		}

		if (Array.isArray(value)) {
			return this._encodeArray(value);
		}

		if (type === 'object') {
			return this._encodeObject(value);
		}

		return JSON.stringify(value);
	}

	private _encodeString(str: string): string {
		// Simple heuristic: use quotes if string contains special chars
		const needsQuotes = /[,:\[\]{}"\s]/.test(str) || str.length === 0;
		if (needsQuotes) {
			return JSON.stringify(str);
		}
		return str;
	}

	private _encodeArray(arr: any[]): string {
		const items = arr.map(item => this._encodeValue(item));
		return `[${items.join(',')}]`;
	}

	private _encodeObject(obj: Record<string, any>): string {
		const entries = Object.entries(obj).map(([key, value]) => {
			const encodedKey = this._encodeString(key);
			const encodedValue = this._encodeValue(value);
			return `${encodedKey}:${encodedValue}`;
		});
		return `{${entries.join(',')}}`;
	}
}
