# Welcome to A-Coder.

<div align="center">
	<img
		src="./a-coder-transparent-512.png"
	 	alt="A-Coder Logo"
		width="300"
	 	height="300"
	/>
</div>

A-Coder is an open-source AI-powered code editor, forked from Void.

Use AI agents on your codebase, checkpoint and visualize changes, and bring any model or host locally. A-Coder sends messages directly to providers without retaining your data.

This repo contains the full sourcecode for A-Coder. If you're new, welcome!

- 🧭 Original Void: [voideditor.com](https://voideditor.com)

- 📖 [Development Guide](./DEVELOPMENT_GUIDE.md)
- 🛠️ [Latest Models Tool Calling Analysis](./LATEST_MODELS_TOOL_CALLING_ANALYSIS.md)
- ⚠️ [Ollama Cloud Tool Calling Bug](./OLLAMA_CLOUD_TOOL_CALLING_BUG.md)


## Known Issues

### Ollama Cloud Tool Calling
**Issue:** Ollama Cloud models return `500 unmarshal` errors when using native OpenAI-style tool calling.

**Affected Models:** All Ollama Cloud models (kimi-k2, gpt-oss, qwen3-coder, deepseek-v3.1, etc.)

**Workaround:** We automatically use XML tool calling fallback for Ollama Cloud models. This works reliably and provides the same functionality.

**Status:** This is a known Ollama API bug (see [GitHub #11800](https://github.com/ollama/ollama/issues/11800), [#12799](https://github.com/ollama/ollama/issues/12799)). When Ollama fixes it, we'll enable native tool calling.

**Details:** See [OLLAMA_CLOUD_TOOL_CALLING_BUG.md](./OLLAMA_CLOUD_TOOL_CALLING_BUG.md)


## Development

To get started developing A-Coder, see [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) for complete instructions on:
- Running in development mode
- Building for production
- Creating DMG installers


## Reference

A-Coder is a fork of [Void](https://github.com/voideditor/void), which itself is a fork of [VS Code](https://github.com/microsoft/vscode). For a guide to the codebase, see [VOID_CODEBASE_GUIDE.md](./VOID_CODEBASE_GUIDE.md).
