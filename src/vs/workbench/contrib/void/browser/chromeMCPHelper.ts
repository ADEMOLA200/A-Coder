/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

/**
 * Chrome DevTools MCP Helper
 *
 * This module provides helper functions for browser automation using Chrome DevTools MCP.
 * When Chrome DevTools MCP is available, it provides superior browser control with:
 * - Session persistence (logged-in sessions preserved)
 * - Better element interaction via accessibility snapshots
 * - Network inspection and performance tracing
 * - Lighthouse audits
 */

import { IMCPService } from '../common/mcpService.js';

// Chrome DevTools MCP server name
const CHROME_MCP_SERVER = 'chrome-devtools';

// Track active browser page for MCP operations
let mcpPageActive = false;

/**
 * Check if Chrome DevTools MCP is available and running
 */
export function isChromeMCPAvailable(mcpService: IMCPService): boolean {
	const mcpTools = mcpService.getMCPTools();
	if (!mcpTools) return false;
	return mcpTools.some(tool => tool.mcpServerName === CHROME_MCP_SERVER);
}

/**
 * Call a Chrome DevTools MCP tool
 */
export async function callChromeMCP(
	mcpService: IMCPService,
	toolName: string,
	params: Record<string, unknown>
): Promise<string> {
	const result = await mcpService.callMCPTool({
		serverName: CHROME_MCP_SERVER,
		toolName,
		params
	});
	return mcpService.stringifyResult(result.result);
}

/**
 * Check if there's an active MCP browser page
 */
export function isMCPPageActive(): boolean {
	return mcpPageActive;
}

/**
 * Set the MCP page active state
 */
export function setMCPPageActive(active: boolean): void {
	mcpPageActive = active;
}

/**
 * Browser tool result types for Chrome MCP
 */
export interface ChromeMCPPageResult {
	webviewId: string;
	title: string;
	isLocal: boolean;
	mcpConnected?: boolean;
	snapshot?: string;
}

/**
 * Navigate to a URL using Chrome DevTools MCP
 */
export async function mcpNavigateToUrl(
	mcpService: IMCPService,
	url: string,
	title?: string
): Promise<ChromeMCPPageResult> {
	await callChromeMCP(mcpService, 'navigate_page', { type: 'url', url, timeout: 30000 });
	setMCPPageActive(true);

	// Take a snapshot to verify the page loaded
	const snapshot = await callChromeMCP(mcpService, 'take_snapshot', {});

	return {
		webviewId: 'mcp-page',
		title: title || url,
		isLocal: false,
		mcpConnected: true,
		snapshot: snapshot.substring(0, 500) + (snapshot.length > 500 ? '...' : '')
	};
}

/**
 * Get page text using Chrome DevTools MCP
 */
export async function mcpGetPageText(
	mcpService: IMCPService,
	selector?: string
): Promise<string> {
	const jsFunc = selector
		? `() => { const el = document.querySelector('${selector.replace(/'/g, "\\'")}'); return el ? el.innerText : null; }`
		: '() => document.body.innerText';

	const textResult = await callChromeMCP(mcpService, 'evaluate_script', { function: jsFunc });

	// Limit text size
	const MAX_TEXT_SIZE = 100 * 1024;
	return textResult.length > MAX_TEXT_SIZE
		? textResult.substring(0, MAX_TEXT_SIZE) + '\n\n... (truncated)'
		: textResult;
}

/**
 * Click element using Chrome DevTools MCP
 */
export async function mcpClickElement(
	mcpService: IMCPService,
	selector: string
): Promise<string> {
	await callChromeMCP(mcpService, 'evaluate_script', {
		function: `() => {
			const el = document.querySelector('${selector.replace(/'/g, "\\'")}');
			if (!el) return { success: false, error: 'Element not found' };
			el.click();
			return { success: true };
		}`
	});
	return `Successfully clicked element: ${selector}`;
}

/**
 * Type text into element using Chrome DevTools MCP
 */
export async function mcpTypeIntoElement(
	mcpService: IMCPService,
	selector: string,
	text: string
): Promise<string> {
	const escapedText = text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');

	await callChromeMCP(mcpService, 'evaluate_script', {
		function: `() => {
			const el = document.querySelector('${selector.replace(/'/g, "\\'")}');
			if (!el) return { success: false, error: 'Element not found' };
			if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
				el.value = '${escapedText}';
				el.dispatchEvent(new Event('input', { bubbles: true }));
				el.dispatchEvent(new Event('change', { bubbles: true }));
			} else if (el.isContentEditable) {
				el.textContent = '${escapedText}';
				el.dispatchEvent(new Event('input', { bubbles: true }));
			} else {
				return { success: false, error: 'Element is not editable' };
			}
			return { success: true };
		}`
	});

	return `Successfully typed into element: ${selector}`;
}

/**
 * Take screenshot using Chrome DevTools MCP
 */
export async function mcpTakeScreenshot(
	mcpService: IMCPService
): Promise<string> {
	const screenshotResult = await callChromeMCP(mcpService, 'take_screenshot', {
		format: 'png'
	});

	// Parse the MCP response to extract base64 image data
	if (screenshotResult.includes('data:image')) {
		return screenshotResult;
	}

	// Assume the result is base64 encoded image
	return `data:image/png;base64,${screenshotResult}`;
}

/**
 * Fetch URL content using Chrome DevTools MCP
 */
export async function mcpFetchUrl(
	mcpService: IMCPService,
	url: string,
	extractText?: boolean
): Promise<{ html: string; text?: string }> {
	// Navigate to the URL
	await callChromeMCP(mcpService, 'navigate_page', { type: 'url', url, timeout: 30000 });

	// Get the page HTML
	const htmlResult = await callChromeMCP(mcpService, 'evaluate_script', {
		function: '() => document.documentElement.outerHTML'
	});

	let text: string | undefined;
	if (extractText) {
		const textResult = await callChromeMCP(mcpService, 'evaluate_script', {
			function: '() => document.body.innerText'
		});
		text = textResult;
	}

	return { html: htmlResult, text };
}