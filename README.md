# Welcome to A-Coder.

<div align="center">
	<img
		src="./resources/a-coder-transparent-512.png"
	 	alt="A-Coder Logo"
		width="300"
	 	height="300"
	/>
</div>

A-Coder is an open-source AI-powered code editor, forked from Void.

Use AI agents on your codebase, checkpoint and visualize changes, and bring any model or host locally. A-Coder sends messages directly to providers without retaining your data.

This repo contains the full sourcecode for A-Coder. If you're new, welcome!

- 🧭 Original Void: [voideditor.com](https://voideditor.com)

- 📖 [Development Guide](./docs/DEVELOPMENT_GUIDE.md)
- 🛠️ [Latest Models Tool Calling Analysis](./docs/LATEST_MODELS_TOOL_CALLING_ANALYSIS.md)
- ⚠️ [Ollama Cloud Tool Calling Bug](./docs/OLLAMA_CLOUD_TOOL_CALLING_BUG.md)


## Recent Features & Fixes

### 🎛️ Chat Modes: Chat, Plan & Code (NEW!)
**Feature:** Three distinct chat modes that control AI behavior and tool access for focused, efficient interactions.

**Modes:**
- **💬 Chat** - Pure conversation mode, no tool access. For quick questions and discussions.
- **📋 Plan** - Research and planning mode with read-only tools. AI can search, read files, and create implementation plans.
- **⚡ Code** - Full execution mode with all tools. AI can edit files, run commands, and execute tasks.

**Implementation Plan Workflow:**
1. Switch to **Plan** mode
2. Describe what you want to build
3. AI researches codebase and creates an implementation plan
4. Review the plan with the **Open** button to see full details
5. Click **Approve Plan** to switch to Code mode and begin execution
6. Or click **Request Changes** to revise the plan

**API Support:**
- `GET /api/v1/settings/mode` - Get current mode with display names
- `PUT /api/v1/settings/mode` - Set mode (`normal`, `gather`, `agent`)
- Mobile apps can switch modes and monitor AI behavior

**Benefits:**
- ✅ Focused AI behavior per task type
- ✅ Reduced token usage in Chat mode (no tool definitions)
- ✅ Safe planning phase before code changes
- ✅ Clear approval workflow for implementation plans

---

### 📋 Implementation Planning Tools (NEW!)
**Feature:** A suite of AI tools for structured project planning before code execution.

**Available Tools:**
- **`create_implementation_plan`** - Create a detailed implementation plan with steps, file changes, and dependencies
- **`preview_implementation_plan`** - Preview and refine the plan before execution
- **`execute_implementation_plan`** - Execute plan steps one at a time
- **`update_implementation_step`** - Update step status (pending, in_progress, completed)
- **`get_implementation_status`** - Check overall plan progress

**Plan Structure:**
```
Implementation Plan: Add User Authentication
├── Step 1: Create auth service (pending)
│   └── Files: src/services/auth.ts
├── Step 2: Add login component (pending)
│   └── Files: src/components/Login.tsx
├── Step 3: Update routes (pending)
│   └── Files: src/App.tsx
└── Step 4: Add tests (pending)
    └── Files: src/__tests__/auth.test.ts
```

**UI Features:**
- Collapsible plan preview in chat
- **Open** button to view full plan in dedicated preview panel
- **Approve Plan** button to begin execution
- **Request Changes** button to revise the plan
- Real-time step status updates

**Benefits:**
- ✅ Structured approach to complex tasks
- ✅ Review before any code changes
- ✅ Track progress through multi-step implementations
- ✅ Easy to pause, modify, or restart plans

---

### 🎯 MCP Server Modal (NEW!)
**Feature:** Custom React modal for managing MCP (Model Context Protocol) servers, replacing the native VS Code QuickPick.

**UI Improvements:**
- Modern popout modal positioned at top-right corner (near server icon)
- Lists all connected MCP servers with status indicators
- Shows tool count for each server
- "MCP Marketplace" footer button for easy settings access
- Click outside or press Escape to close

**User Experience:**
- Click the server icon in sidebar toolbar to open modal
- Visual status indicators (green = connected)
- Quick access to MCP server management
- Seamless integration with existing settings

**Implementation:** Modal uses service-based communication between VS Code actions and React components for clean separation of concerns.

---

### 📱 Mobile API (NEW!)
**Feature:** REST/WebSocket API for building mobile companion apps to control A-Coder remotely.

**What It Does:**
- Exposes A-Coder's coding agent and workspace features via HTTP API
- Enables mobile apps to interact with chat threads, files, and planning
- Real-time updates via WebSocket connections
- Secure token-based authentication

**API Endpoints:**
- **Chat/Threads:** Create threads, send messages, get status, cancel agent
- **Workspace:** List files, read files, search, get diagnostics
- **Planning:** Get current plan, create plans, update task status
- **Settings:** Get/set current model, get/set chat mode, list available models

**Security:**
- API disabled by default (must be enabled in settings)
- Localhost-only binding (no direct internet exposure)
- Token-based authentication (Bearer tokens)
- Optional Cloudflare Tunnel for secure remote access

**Setup:**
1. Go to Settings → Mobile API
2. Toggle "Enable Mobile API"
3. Generate an API token (click "Generate New Token")
4. (Optional) Configure Cloudflare Tunnel URL for remote access
5. Test with: `curl http://localhost:3737/api/v1/health`

**WebSocket Support:**
```javascript
const ws = new WebSocket('ws://localhost:3737?token=YOUR_TOKEN');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data);
};
```

**Use Cases:**
- Control A-Coder from mobile device
- Monitor agent progress remotely
- Send messages to chat threads
- Browse and edit workspace files
- Track planning and task status

**Details:** API runs on port 3737 by default. All endpoints require authentication via Bearer token in `Authorization` header.

---

### 🚀 Morph Fast Apply Integration (NEW!)
**Feature:** Intelligent code application using Morph's Fast Apply API to enhance the Apply functionality.

**What is Morph Fast Apply?**
- Uses Morph's AI to intelligently apply code changes
- Better at handling ambiguous or incomplete code snippets
- Preserves existing code style and formatting
- Graceful fallback to standard apply if Morph fails

**How It Works:**
1. LLM suggests code changes in chat
2. Click the play button (▶) to apply
3. If Morph is enabled, changes are processed through Morph API
4. Code is intelligently applied to your file
5. Visual diff shows changes with accept/reject options

**Setup:**
1. Go to Settings → Feature Options → Morph Fast Apply
2. Toggle "Enable Morph Fast Apply"
3. Enter your API key from [morphllm.com/dashboard](https://morphllm.com/dashboard)
4. Choose model: `morph-v3-fast`, `morph-v3-large`, or `auto`

**Integration Points:**
- Works with code blocks in chat (play button)
- Works with Apply tool calls from LLM
- Uses official `@morphllm/morphsdk` package
- IPC channel to electron-main for SDK execution

**Details:** See [MORPH_FAST_APPLY_INTEGRATION.md](./docs/MORPH_FAST_APPLY_INTEGRATION.md)

---

### 🤖 Enhanced Agent Auto-Continue (IMPROVED!)
**Feature:** Smarter detection of when LLM has finished vs. when it's waiting for user input.

**Improvements:**
- **Analysis Completion Detection**: Stops auto-continue when LLM presents findings (e.g., "Based on my analysis...", "Here's what I found...")
- **Completion Question Detection**: Stops when LLM asks follow-up questions (e.g., "Would you like me to explain any specific part?")
- **Multi-Indicator Logic**: Uses multiple patterns to detect completion states

**Problem Solved:**
- Before: Agent would continue after complete analysis, causing empty response errors
- After: Agent correctly stops when LLM finishes explaining or asks questions

**Result:** More reliable agent execution with fewer unnecessary continuations and no more empty response errors.

---

### 🗜️ TOON Tool Result Compression (NEW!)
**Feature:** Reduce LLM token usage by 30-70% with TOON (Token-Oriented Object Notation) compression for tool outputs.

**What is TOON?**
- Compact JSON-like format that removes unnecessary whitespace and quotes
- Preserves structure while drastically reducing token count
- Especially beneficial for local AI models with limited context windows

**Example:**
```
JSON:  {"files": ["a.ts", "b.ts"], "count": 2}  (45 chars)
TOON:  {files:[a.ts,b.ts],count:2}              (27 chars, 40% savings)
```

**Benefits:**
- ✅ 30-70% token reduction for directory listings, lint errors, and structured outputs
- ✅ More context available for your code
- ✅ Faster responses with local models
- ✅ Intelligent compression (only applies when beneficial)

**Usage:**
1. Open A-Coder Settings → Feature Options → Tools
2. Enable "Use TOON format for tool results"
3. Tool outputs automatically compressed when it saves ≥10% tokens

**Details:** See [TOON_IMPLEMENTATION.md](./TOON_IMPLEMENTATION.md)

---

### 🖼️ Vision Support (NEW!)
**Feature:** Upload images to chat via drag & drop or copy/paste. Images are processed by a dedicated vision model to generate descriptions that work with ANY LLM.

**Architecture:**
- Vision is a separate feature with its own model selection
- Images processed by vision model (GPT-4V, Claude 3, Gemini, etc.)
- Descriptions appended to user message
- Main chat LLM receives text-only message (works with non-vision models!)

**Benefits:**
- ✅ Works with ANY chat model (GPT-3.5, Llama, Mistral, etc.)
- ✅ User controls which vision model processes images
- ✅ Cost optimization (use cheaper vision models)
- ✅ Universal compatibility

**Usage:**
1. Enable "Vision Support" in Settings → Feature Options
2. Select your preferred vision model
3. Drag & drop or paste images into chat
4. Images are analyzed and descriptions added to your message

**Details:** See [VISION_SUPPORT_IMPLEMENTATION.md](./docs/VISION_SUPPORT_IMPLEMENTATION.md)

---

### 📬 Message Queue Visual Indicator (NEW!)
**Feature:** Clear visual feedback when messages are queued while LLM is running.

**UI Improvements:**
- Shows banner: "X message(s) queued"
- Displays hint: "Enter to send queued message (⏎)"
- Updates input placeholder dynamically
- Real-time count updates

**User Experience:**
- Before: Silent queuing, user confusion
- After: Clear visual feedback, user knows exactly what's happening

---

### 🚫 Empty Message Filter (FIXED)
**Issue:** LLMs sometimes returned empty responses showing as "(empty message)" in chat.

**Fix:** Filter out empty assistant messages before rendering in UI.

**Result:** Clean chat history without "(empty message)" clutter.

---

### ✅ Ollama Cloud Tool Calling (FIXED)
**Issue:** Ollama Cloud models were returning `500 unmarshal` errors when using native tool calling.

**Root Cause:** Our tool schemas were missing `type` fields, causing llama.cpp's JSON schema parser to fail.

**Fix:** Updated `sendLLMMessage.impl.ts` to include `type: 'string'` in all tool parameter schemas.

**Status:** ✅ Fixed! All Ollama Cloud models now use native OpenAI-style tool calling.

**Details:** See [OLLAMA_CLOUD_TOOL_CALLING_BUG.md](./docs/OLLAMA_CLOUD_TOOL_CALLING_BUG.md)

---

### 🔧 Ollama Tool Calling Improvements (NEW!)
**Comprehensive fixes for all Ollama tool calling issues based on extensive research and testing.**

#### Issues Fixed:
1. **Multiple Tool Call Concatenation** - Ollama sometimes returns multiple tool calls in one response
   - **Problem:** Arguments were concatenated into invalid JSON: `{"uri":"file1"}{"uri":"file2"}`
   - **Fix:** Only process the first tool call to prevent concatenation errors
   - **Result:** Tool calls now work reliably without JSON parsing failures

2. **Empty Response Detection** - Tool calls with empty content were incorrectly treated as errors
   - **Problem:** `{"hasToolCall":true,"fullText":"","reasoning":""}` was seen as an error
   - **Reality:** This is expected behavior for Ollama native tool calls
   - **Fix:** Modified empty response check to accept tool calls with empty content
   - **Result:** No more unnecessary retries and failures

3. **Agent Mode Completion Detection** - Agent stopped too early when LLM described plans
   - **Problem:** "This is...complete overview" incorrectly matched completion patterns
   - **Fix:** Made completion signal patterns more precise with end-of-text requirements
   - **Result:** Agent continues appropriately when LLM is planning, stops when actually complete

#### Enhanced Logging:
- Shows when multiple tool calls are detected and skipped
- Detailed error logging for tool parameter parsing
- Clear indication of successful tool call processing

#### Status:
- ✅ All Ollama models (local and cloud) now work reliably with tools
- ✅ Agent mode properly handles Ollama's response format
- ✅ No more "empty response" retries for valid tool calls

**Details:** See [OLLAMA_TOOL_CALLING_IMPROVEMENTS.md](./OLLAMA_TOOL_CALLING_IMPROVEMENTS.md)

---
## Development

To get started developing A-Coder, see [DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md) for complete instructions on:
- Running in development mode
- Building for production
- Creating DMG installers


## Reference

A-Coder is a fork of [Void](https://github.com/voideditor/void), which itself is a fork of [VS Code](https://github.com/microsoft/vscode). For a guide to the codebase, see [VOID_CODEBASE_GUIDE.md](./docs/VOID_CODEBASE_GUIDE.md).
