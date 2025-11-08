# Ollama Cloud Tool Calling Bug Analysis

## The Issue

**Error:** `500 Internal Server Error: unmarshal: invalid character 'I' looking for beginning of value`

This error occurs when using **native OpenAI-style tool calling** with Ollama Cloud models.

## Root Cause

Based on research of Ollama GitHub issues:

### Issue #11800: gpt-oss Tool Calling Bug
- **Problem:** gpt-oss models return invalid JSON in `toolContent` field
- **Location:** `ollama/server/routes.go` lines 373-375, 428-429
- **Behavior:** Ollama server fails to parse the tool call JSON and returns 500 error
- **Impact:** Client retries indefinitely until max retries reached

### Issue #12799: Cloud Models Broken
- **Problem:** Same unmarshal error with cloud models like `qwen3-vl:235b`
- **Status:** Reported Oct 28, 2025 (recent!)
- **Affected:** Multiple Ollama Cloud models

## Technical Details

### What's Happening:
1. Client sends request with `tools` parameter (OpenAI format)
2. Ollama Cloud model generates tool call response
3. Model returns **malformed JSON** in the tool call
4. Ollama server tries to unmarshal the JSON: `json.Unmarshal([]byte(toolContent), &args)`
5. Unmarshal fails with "invalid character 'I'" error
6. Server returns **500 Internal Server Error**
7. Client has **no feedback** about what went wrong

### Why It's a Server Bug:
From Issue #11800:
> "The LLM's output should not be coupled to Ollama's HTTP status codes. Ollama could take the failed JSON and insert it into the message content. The current implementation provides zero feedback and information for the client to recover partial data from the invalid JSON."

**Other models** that produce invalid tool calls don't cause 500 errors - their bad output is returned in message content. The gpt-oss and cloud models trigger a different code path that throws 500.

## Affected Models

Based on our testing and GitHub issues:
- ✅ **Confirmed Broken:**
  - `kimi-k2:1t-cloud`
  - `kimi-k2-thinking:1t-cloud`
  - `gpt-oss:20b-cloud`
  - `gpt-oss:120b-cloud`
  - `qwen3-vl:235b`
  
- ⚠️ **Likely Affected (all Ollama Cloud models with tools):**
  - `deepseek-v3.1:671b-cloud`
  - `qwen3-coder:480b-cloud`
  - `minimax-m2:cloud`
  - `glm-4.6:cloud`

## Our Workaround

### Current Implementation:
We **disabled native tool calling** for all Ollama Cloud models and use **XML tool calling fallback** instead.

**In `modelCapabilities.ts`:**
```typescript
'kimi-k2:1t-cloud': {
    // specialToolFormat: 'openai-style', // Disabled due to Ollama Cloud API bug
    defaultTemperature: 0.6,
},
'kimi-k2-thinking:1t-cloud': {
    // specialToolFormat: 'openai-style', // Disabled due to Ollama Cloud API bug
    defaultTemperature: 1.0,
},
```

### Why XML Works:
- XML tool calling doesn't use the `tools` parameter
- Models generate XML tags in their text response: `<function_calls><invoke>...`
- We parse the XML ourselves with regex (no server-side JSON parsing)
- Bypasses the buggy Ollama server code path entirely

## Solutions

### Option 1: Wait for Ollama Fix (Recommended)
**Status:** Bug is known and reported
**Timeline:** Unknown
**Action:** Monitor GitHub issues #11800 and #12799

When fixed, uncomment in `modelCapabilities.ts`:
```typescript
'kimi-k2:1t-cloud': {
    specialToolFormat: 'openai-style',  // ✅ Uncomment when fixed
},
```

### Option 2: Use Local Ollama (Not Cloud)
**Status:** Works now
**Limitation:** Requires downloading large models locally
**Models:** Most Ollama models support native tools locally

### Option 3: Use Different Provider
**Status:** Works now
**Options:**
- Use Kimi K2 via OpenRouter (supports native tools)
- Use Kimi K2 via Moonshot AI API directly
- Use other providers (OpenAI, Anthropic, etc.)

### Option 4: Improve XML Tool Calling (Current Approach)
**Status:** Working well
**Improvements Made:**
- ✅ Added Morph-inspired workflow pattern
- ✅ Enhanced error recovery guidance
- ✅ Better context marker instructions
- ✅ Explicit "read before edit" workflow

**Performance:** XML tool calling works reliably, just different format than native.

## Comparison: Native vs XML Tool Calling

| Feature | Native (OpenAI) | XML (Fallback) |
|---------|----------------|----------------|
| **Status** | ❌ Broken on Ollama Cloud | ✅ Working |
| **Format** | JSON in API | XML in text |
| **Parsing** | Server-side | Client-side (regex) |
| **Error Handling** | 500 errors | Graceful degradation |
| **Model Support** | Kimi K2, gpt-oss, etc. | All models |
| **Performance** | Faster (when working) | Reliable |
| **Streaming** | Supported | Supported |

## Recommendations

### For Now:
1. ✅ **Keep XML tool calling** for Ollama Cloud models
2. ✅ **Monitor GitHub issues** for Ollama fix
3. ✅ **Continue improving XML prompts** (Morph-inspired)
4. ✅ **Document the workaround** (this file)

### When Ollama Fixes the Bug:
1. Test with a single model first (e.g., `kimi-k2:1t-cloud`)
2. Uncomment `specialToolFormat: 'openai-style'`
3. Verify no 500 errors
4. Roll out to all cloud models
5. Update documentation

### Long Term:
Consider adding **automatic fallback logic**:
```typescript
// Pseudo-code
if (nativeToolCallFails && error.status === 500) {
    console.warn('Native tools failed, falling back to XML')
    retryWithXMLTools()
}
```

## References

- [Ollama Issue #11800](https://github.com/ollama/ollama/issues/11800) - gpt-oss tool calling bug
- [Ollama Issue #12799](https://github.com/ollama/ollama/issues/12799) - Cloud models broken
- [Ollama Tool Support Blog](https://ollama.com/blog/tool-support) - Official tool calling docs
- [Ollama OpenAI Compatibility](https://docs.ollama.com/api/openai-compatibility) - API docs

## Status

**Last Updated:** Nov 8, 2025
**Bug Status:** Open (Ollama team aware)
**Our Workaround:** XML tool calling (working)
**Impact:** Medium (XML works, but native would be faster)
**Priority:** Monitor for fix, no urgent action needed
