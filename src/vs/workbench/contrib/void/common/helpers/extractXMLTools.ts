/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Glass Devtools, Inc. All rights reserved.
 *  Void Editor additions licensed under the AGPL 3.0 License.
 *--------------------------------------------------------------------------------------------*/

// Extract XML tool calls from model response
// Based on Anthropic's XML tool calling format

export type XMLToolCall = {
	toolName: string;
	parameters: Record<string, any>;
};

/**
 * Extracts XML tool calls from text in the format:
 * <function_calls>
 *   <invoke name="tool_name">
 *     <parameter name="param1">value1</parameter>
 *     <parameter name="param2">value2</parameter>
 *   </invoke>
 * </function_calls>
 *
 * Also returns the cleaned text with XML blocks removed
 */
export function extractXMLToolCalls(text: string): XMLToolCall[] {
	const toolCalls: XMLToolCall[] = [];

	// Match <function_calls>...</function_calls> block
	const functionCallsMatch = text.match(/<function_calls>([\s\S]*?)<\/function_calls>/);
	if (!functionCallsMatch) {
		return toolCalls;
	}

	const functionCallsContent = functionCallsMatch[1];

	// Match all <invoke name="...">...</invoke> blocks
	const invokeRegex = /<invoke\s+name="([^"]+)">([\s\S]*?)<\/invoke>/g;
	let invokeMatch;

	while ((invokeMatch = invokeRegex.exec(functionCallsContent)) !== null) {
		const toolName = invokeMatch[1];
		const invokeContent = invokeMatch[2];

		// Extract parameters
		const parameters: Record<string, any> = {};
		const paramRegex = /<parameter\s+name="([^"]+)">([^<]*)<\/parameter>/g;
		let paramMatch;

		while ((paramMatch = paramRegex.exec(invokeContent)) !== null) {
			const paramName = paramMatch[1];
			let paramValue: any = paramMatch[2];

			// Try to parse as JSON for objects/arrays
			if (paramValue.trim().startsWith('{') || paramValue.trim().startsWith('[')) {
				try {
					paramValue = JSON.parse(paramValue);
				} catch (e) {
					// Keep as string if not valid JSON
				}
			}

			parameters[paramName] = paramValue;
		}

		toolCalls.push({ toolName, parameters });
	}

	return toolCalls;
}

/**
 * Removes XML tool calling blocks from text to clean up the model's response
 * When a tool call is detected, only keep the text BEFORE the first <function_calls> block
 */
export function stripXMLBlocks(text: string): string {
	// Find the first <function_calls> block
	const firstToolCallMatch = text.match(/<function_calls>/);

	if (firstToolCallMatch && firstToolCallMatch.index !== undefined) {
		// Only keep text before the first tool call
		return text.substring(0, firstToolCallMatch.index).trim();
	}

	// If no tool calls, just remove any stray <function_results> blocks
	let cleaned = text.replace(/<function_results>[\s\S]*?<\/function_results>/g, '');
	cleaned = cleaned.trim();

	return cleaned;
}

/**
 * Formats tool results as XML for sending back to the model:
 * <function_results>
 *   <result>
 *     <tool_name>tool_name</tool_name>
 *     <stdout>result content</stdout>
 *   </result>
 * </function_results>
 */
export function formatXMLToolResults(results: Array<{ toolName: string; result: string }>): string {
	const resultBlocks = results.map(({ toolName, result }) =>
		`<result>\n<tool_name>${toolName}</tool_name>\n<stdout>\n${result}\n</stdout>\n</result>`
	).join('\n');

	return `<function_results>\n${resultBlocks}\n</function_results>`;
}
