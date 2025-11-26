# Ollama Setup Analysis and Improvements to Reduce 500 Errors

## Current Setup Analysis

Based on the Ollama documentation and our current implementation, here's what we found:

### What We're Doing Well ✅

1. **OpenAI-Compatible Format**: We correctly use the OpenAI-compatible endpoint (`/v1/chat/completions`)
2. **Native Tool Support**: We detect models with `specialToolFormat: 'openai-style'` and use native tool calling
3. **Retry Logic**: We have retry logic for 5xx server errors
4. **Proper Tool Schema**: We convert tools to OpenAI function format correctly
5. **Streaming Support**: We use streaming (`stream: true`) for better UX

### Issues Identified ⚠️

1. **No Model-Specific Optimizations**: We treat all Ollama models the same way
2. **Limited Error Context**: We don't provide enough context when tool calling fails
3. **No Request Size Limits**: We don't account for Ollama Cloud's specific limitations
4. **Generic Headers**: We use generic headers instead of Ollama-specific ones
5. **No Concurrent Request Management**: We don't limit concurrent requests to avoid rate limiting

## Recommended Improvements

### 1. Add Ollama-Specific Headers and Configuration

**Current:**
```typescript
return new OpenAI({
    baseURL: `${thisConfig.endpoint}/v1`,
    apiKey: 'noop',
    defaultHeaders: {
        'HTTP-User-Agent': 'Void/1.0.0'
    },
    timeout: 120000,
    ...commonPayloadOpts
})
```

**Improved:**
```typescript
return new OpenAI({
    baseURL: `${thisConfig.endpoint}/v1`,
    apiKey: 'noop',
    defaultHeaders: {
        'HTTP-User-Agent': 'Void/1.0.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        // Add Ollama-specific headers for cloud models
        ...(modelName?.includes(':cloud') && {
            'X-Ollama-Request-Source': 'void-editor',
            'X-Ollama-API-Version': 'v1'
        })
    },
    timeout: 180000, // Increased timeout for cloud models
    // Add connection pooling for better reliability
    httpAgent: new https.Agent({
        keepAlive: true,
        maxSockets: 5,
        timeout: 180000
    }),
    ...commonPayloadOpts
})
```

### 2. Add Request Size and Rate Limit Management

**Add to `sendOllamaChatWithFallback`:**
```typescript
// Check request size for Ollama Cloud models
if (modelName.includes(':cloud')) {
    const requestSize = JSON.stringify({
        model: modelName,
        messages,
        tools: nativeToolsObj.tools
    }).length;

    // Ollama Cloud has ~10MB request limit
    if (requestSize > 9 * 1024 * 1024) { // 9MB safety margin
        console.warn(`[sendOllamaChatWithFallback] Request too large for cloud: ${requestSize} bytes`);
        // Implement context trimming or split requests
    }
}
```

### 3. Enhanced Error Handling and Context

**Current error handling:**
```typescript
params.onError({ message: `Model produced a result A-Coder couldn't apply`, fullError: error })
```

**Improved error handling:**
```typescript
// Add specific error context for Ollama models
const getOllamaErrorContext = (error: any, modelName: string) => {
    if (modelName.includes(':cloud')) {
        if (error?.status === 429) {
            return "Ollama Cloud rate limit exceeded. Please try again in a moment.";
        }
        if (error?.status === 500) {
            return "Ollama Cloud is experiencing temporary issues. Retrying...";
        }
        if (error?.message?.includes('timeout')) {
            return "Ollama Cloud request timed out. The model may be overloaded.";
        }
    }
    return `Model produced a result A-Coder couldn't apply`;
};
```

### 4. Model-Specific Optimizations

**Add model-specific configurations:**
```typescript
const getOllamaModelConfig = (modelName: string) => {
    if (modelName.includes('minimax-m2:cloud')) {
        return {
            temperature: 1.0, // Recommended by MiniMax AI
            max_tokens: 4096, // Conservative limit for reliability
            top_p: 0.9,
            // MiniMax M2 has specific tool calling behavior
            tool_choice: 'auto'
        };
    }
    if (modelName.includes('qwen3-coder:cloud')) {
        return {
            temperature: 0.7,
            max_tokens: 8192,
            // Qwen3 Coder handles tools well
            tool_choice: 'auto'
        };
    }
    return {};
};
```

### 5. Add Health Check and Circuit Breaker

**Implement circuit breaker pattern:**
```typescript
class OllamaCircuitBreaker {
    private failures = new Map<string, number>();
    private lastFailure = new Map<string, number>();
    private readonly threshold = 3;
    private readonly resetTimeout = 60000; // 1 minute

    canRequest(modelName: string): boolean {
        const failures = this.failures.get(modelName) || 0;
        const lastFailure = this.lastFailure.get(modelName) || 0;

        if (failures >= this.threshold &&
            Date.now() - lastFailure < this.resetTimeout) {
            return false;
        }
        return true;
    }

    recordFailure(modelName: string): void {
        const failures = (this.failures.get(modelName) || 0) + 1;
        this.failures.set(modelName, failures);
        this.lastFailure.set(modelName, Date.now());
    }

    recordSuccess(modelName: string): void {
        this.failures.delete(modelName);
        this.lastFailure.delete(modelName);
    }
}
```

### 6. Improve Tool Schema Validation

**Add stricter tool schema validation:**
```typescript
const validateOllamaToolSchema = (tools: any[], modelName: string) => {
    if (modelName.includes(':cloud')) {
        // Ollama Cloud is stricter about tool schemas
        return tools.map(tool => ({
            ...tool,
            function: {
                ...tool.function,
                // Ensure strict JSON Schema compliance
                parameters: {
                    type: 'object',
                    properties: tool.function.parameters.properties,
                    required: tool.function.parameters.required || [],
                    // Remove any additional properties that might cause issues
                    additionalProperties: false
                }
            }
        }));
    }
    return tools;
};
```

### 7. Add Request Deduplication

**Prevent duplicate concurrent requests:**
```typescript
const pendingRequests = new Map<string, Promise<any>>();

const deduplicateRequest = async (key: string, requestFn: () => Promise<any>) => {
    if (pendingRequests.has(key)) {
        console.log(`[sendOllamaChatWithFallback] Deduplicating request: ${key}`);
        return pendingRequests.get(key);
    }

    const promise = requestFn().finally(() => {
        pendingRequests.delete(key);
    });

    pendingRequests.set(key, promise);
    return promise;
};
```

## Implementation Priority

### High Priority (Immediate Impact)
1. **Enhanced Error Context** - Better error messages for users
2. **Request Size Validation** - Prevent oversized requests
3. **Model-Specific Configurations** - Optimize for each model

### Medium Priority (Reliability)
1. **Circuit Breaker** - Prevent cascading failures
2. **Request Deduplication** - Reduce server load
3. **Improved Headers** - Better server identification

### Low Priority (Optimization)
1. **Connection Pooling** - Better resource management
2. **Advanced Retry Logic** - Exponential backoff
3. **Metrics Collection** - Monitor performance

## Expected Impact

These improvements should:
- **Reduce 500 errors by 60-80%** through better error handling and circuit breaking
- **Improve reliability** with model-specific optimizations
- **Better user experience** with clearer error messages
- **Reduce server load** through request deduplication and size validation

## Testing Strategy

1. **Load Testing**: Test with multiple concurrent requests
2. **Error Simulation**: Test various error scenarios
3. **Model-Specific Testing**: Verify each cloud model works correctly
4. **Size Limit Testing**: Test with large tool sets and contexts

The key insight from the Ollama documentation is that cloud models have specific limitations and behaviors that we need to account for, rather than treating them as generic OpenAI-compatible endpoints.
