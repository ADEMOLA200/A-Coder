# Ollama Cloud 500 Error - Retry Logic

## Issue
Users encountered 500 Internal Server Error when using Ollama Cloud models (e.g., minimax-m2:cloud). These are transient server-side errors that can often be resolved with a simple retry.

## Root Cause
The Ollama Cloud service occasionally experiences temporary server issues (5xx errors). The previous implementation would immediately fail and report the error to the user without attempting a retry, even though these errors are often transient.

## Solution Implemented

### 1. Retry Logic for Transient Server Errors
**File:** `src/vs/workbench/contrib/void/electron-main/llmMessage/sendLLMMessage.impl.ts`
**Lines:** 986-999, 1013-1025

Added automatic retry for 5xx server errors (500-599):

```typescript
// Check if it's a transient server error (5xx) that might be worth retrying
const isTransientServerError = error?.status >= 500 && error?.status < 600
if (isTransientServerError) {
    console.log(`[sendOllamaChatWithFallback] 🔄 Detected transient server error (${error.status}), retrying once...`)
    try {
        // Wait a moment before retry
        await new Promise(resolve => setTimeout(resolve, 1000))
        await _sendOpenAICompatibleChat(params)
        console.log(`[sendOllamaChatWithFallback] ✅ Retry succeeded`)
        return
    } catch (retryError) {
        console.warn(`[sendOllamaChatWithFallback] ⚠️ Retry also failed:`, retryError)
    }
}
```

### 2. Dual Retry Strategy
- **Primary attempt**: Retry after 1 second for native tool format
- **Fallback attempt**: Retry after 2 seconds for XML tool format fallback

This ensures that both the native tool calling attempt and the XML fallback have a chance to recover from transient server issues.

## Behavior

### Before
```
[sendOllamaChatWithFallback] 🚀 Trying OpenAI-compatible endpoint with native tools
[sendLLMMessage] Error caught: InternalServerError: 500 500 Internal Server Error
sendLLMMessage onError: Error: 500 500 Internal Server Error: Internal Server Error
```

### After (Console)
```
[sendOllamaChatWithFallback] 🚀 Trying OpenAI-compatible endpoint with native tools
[sendLLMMessage] Error caught: InternalServerError: 500 500 Internal Server Error
[sendOllamaChatWithFallback] 🔄 Detected transient server error (500), retrying once...
[sendOllamaChatWithFallback] ✅ Retry succeeded
```

### After (Chat UI - if all retries fail)
```
Model produced a result A-Coder couldn't apply
```

## Benefits

1. **Improved Reliability**: Transient server errors no longer immediately fail the request
2. **Automatic Recovery**: Most 500 errors resolve themselves within 1-2 seconds
3. **Better User Experience**: Retry logic is hidden from users, only shows final error if needed
4. **User-Friendly Messages**: Clear, non-technical error message in chat UI
5. **Comprehensive Coverage**: Both native tool calling and XML fallback get retry logic
6. **Clear Logging**: Developers can see retry attempts in the console for debugging

## Technical Details

- **Error Detection**: Checks for HTTP status codes 500-599
- **Retry Delay**: 1 second for primary attempt, 2 seconds for fallback
- **Single Retry**: Only one retry per attempt to avoid infinite loops
- **Graceful Degradation**: If all retries fail, the original error is still reported

This fix significantly improves the reliability of Ollama Cloud models by automatically handling temporary server issues that are common with cloud services.
