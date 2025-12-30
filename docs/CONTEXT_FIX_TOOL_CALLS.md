# Context Window Fix: Tool Call Counting & Truncation

## Issue Description
Users reported `400 Bad Request: prompt too long` errors despite the token counter reporting only ~26% usage (e.g., 65k/251k tokens).

## Root Cause Analysis
1. **Token Undercounting**: The `TokenCountingService` was ignoring the content of tool calls (inputs) in messages.
   - OpenAI: `tool_calls` property in assistant messages was ignored.
   - Anthropic: `tool_use` type in content array was ignored.
   - Gemini: `functionCall` arguments were ignored.
   - **Impact**: Large generated content (like `write_file` with code) was not being counted, leading to massive underestimation of context usage (e.g., missing 140k tokens).

2. **Compression Gaps**: The `ContextCompressionService` only truncated tool *results* (outputs), not tool *calls* (inputs).
   - If the assistant generated a huge file write, it would be preserved in full in the history, even if it caused overflow.

## The Fix

### 1. Updated Token Counting
Modified `src/vs/workbench/contrib/void/common/tokenCountingService.ts` to correctly extract and count content from:
- OpenAI `tool_calls` arguments
- Anthropic `tool_use` inputs
- Gemini `functionCall` arguments and `functionResponse` outputs

### 2. Enhanced Compression
Modified `src/vs/workbench/contrib/void/common/contextCompressionService.ts` to:
- Add `truncateJsonString` helper for smart JSON truncation.
- Update `truncateToolResults` to also target `tool_calls` (assistant messages).
- Truncate large strings within tool arguments (e.g., file content) while preserving JSON structure where possible.

## Verification
- **Token Count**: Should now accurately reflect the size of tool calls.
- **Compression Trigger**: Higher reported usage will correctly trigger the rolling window compression.
- **Safety**: Large tool calls in history will be truncated to fit within context, preventing API errors.
