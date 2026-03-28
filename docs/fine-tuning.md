# A-Coder Tool Calling Fine-tuning Guide

This document provides the detailed specifications for A-Coder's toolset, intended for fine-tuning Large Language Models to interact with the A-Coder IDE environment.

## General Principles

1.  **Proactivity**: Use tools automatically to gather information (search, read, list) before making changes or answering complex questions.
2.  **Verification**: Always verify changes by reading the file again or checking for lint errors (`read_lint_errors`).
3.  **Context First**: Read a file (`read_file`) before attempting to edit it (`edit_file`) to ensure the `ORIGINAL` blocks match exactly.
4.  **Planning**: For multi-step tasks, use the planning tools (`create_plan` or `create_implementation_plan`) to structure the workflow.
5.  **Schema Adherence**: All tool calls must strictly follow the JSON schema provided.

---

## 1. Context Gathering Tools

### read_file
Reads the contents of a file. Supports line range reading and pagination for large files.

**JSON Schema:**
```json
{
  "name": "read_file",
  "description": "Reads the contents of a file at the specified path. Returns the file content with line numbers prefixed.",
  "parameters": {
    "type": "object",
    "properties": {
      "uri": { "type": "string", "description": "The FULL path to the file." },
      "start_line": { "type": "number", "description": "Optional. The starting line number to read from (1-based)." },
      "end_line": { "type": "number", "description": "Optional. The ending line number to read to (1-based, inclusive)." },
      "page_number": { "type": "number", "description": "Optional. Page number for very large files (default: 1)." },
      "explanation": { "type": "string", "description": "Optional. One sentence explanation of why this tool is being used." }
    },
    "required": ["uri"]
  }
}
```

### outline_file
Gets a high-level outline of a file's structure (classes, functions, imports) without reading the implementation.

**JSON Schema:**
```json
{
  "name": "outline_file",
  "description": "Gets a high-level outline of a file's structure (imports, classes, functions) with line numbers.",
  "parameters": {
    "type": "object",
    "properties": {
      "uri": { "type": "string", "description": "The FULL path to the file." }
    },
    "required": ["uri"]
  }
}
```

### ls_dir
Lists all files and folders in a directory.

**JSON Schema:**
```json
{
  "name": "ls_dir",
  "description": "Lists all files and folders in a directory.",
  "parameters": {
    "type": "object",
    "properties": {
      "uri": { "type": "string", "description": "Optional. The FULL path to the folder. Empty for root." },
      "page_number": { "type": "number", "description": "Optional. The page number of the result." }
    }
  }
}
```

### get_dir_tree
Gets a recursive tree diagram of all files and folders in a directory.

**JSON Schema:**
```json
{
  "name": "get_dir_tree",
  "description": "Gets a complete tree diagram of all files and folders in a directory (recursive).",
  "parameters": {
    "type": "object",
    "properties": {
      "uri": { "type": "string", "description": "The FULL path to the folder." }
    },
    "required": ["uri"]
  }
}
```

### search_pathnames_only
Searches for files by their filename/pathname.

**JSON Schema:**
```json
{
  "name": "search_pathnames_only",
  "description": "Searches for files by their pathname/filename (does NOT search file contents).",
  "parameters": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Your query for the search." },
      "include_pattern": { "type": "string", "description": "Optional glob pattern to limit search." },
      "page_number": { "type": "number", "description": "Optional page number." }
    },
    "required": ["query"]
  }
}
```

### search_for_files
Searches for files by their content (full-text search).

**JSON Schema:**
```json
{
  "name": "search_for_files",
  "description": "Searches for files by their CONTENT (searches inside files, not filenames).",
  "parameters": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Your query for the search." },
      "search_in_folder": { "type": "string", "description": "Optional. Searches descendants of this folder only." },
      "is_regex": { "type": "boolean", "description": "Optional. Whether the query is a regex." },
      "page_number": { "type": "number", "description": "Optional page number." }
    },
    "required": ["query"]
  }
}
```

### search_in_file
Searches within a specific file and returns line numbers.

**JSON Schema:**
```json
{
  "name": "search_in_file",
  "description": "Searches within a specific file and returns line numbers where matches are found.",
  "parameters": {
    "type": "object",
    "properties": {
      "uri": { "type": "string", "description": "The FULL path to the file." },
      "query": { "type": "string", "description": "The string or regex to search for." },
      "is_regex": { "type": "boolean", "description": "Optional. Whether the query is a regex." }
    },
    "required": ["uri", "query"]
  }
}
```

### fast_context
Gather intelligent context from across the repository using semantic search.

**JSON Schema:**
```json
{
  "name": "fast_context",
  "description": "Gather intelligent context using semantic meaning (warpGrep).",
  "parameters": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Semantic query or concept." }
    },
    "required": ["query"]
  }
}
```

---

## 2. File Manipulation & Execution Tools

### run_code
Execute TypeScript/JavaScript code in a sandboxed environment with access to all tools.

**JSON Schema:**
```json
{
  "name": "run_code",
  "description": "Execute TypeScript/JavaScript code in a sandboxed environment with access to all tools.",
  "parameters": {
    "type": "object",
    "properties": {
      "code": { "type": "string", "description": "TS/JS code to execute. Use `return` for results." },
      "timeout": { "type": "number", "description": "Optional timeout in ms." }
    },
    "required": ["code"]
  }
}
```

### edit_file
Applies targeted changes by replacing exact text matches. This tool has robust validation and error handling.

**Parameters:**
- `uri`: The full file path to edit
- `old_string`: The exact text to find and replace (must match exactly)
- `new_string`: The new text to replace it with

**JSON Schema:**
```json
{
  "name": "edit_file",
  "description": "Edit specific sections of a file by replacing exact text matches.",
  "parameters": {
    "type": "object",
    "properties": {
      "uri": { "type": "string", "description": "The FULL file path to edit." },
      "old_string": { "type": "string", "description": "The exact text to find and replace. Must match exactly including whitespace." },
      "new_string": { "type": "string", "description": "The new text to replace it with." }
    },
    "required": ["uri", "old_string", "new_string"]
  }
}
```

**Validation & Error Handling:**

The `edit_file` tool performs extensive validation before applying changes. Fine-tuned models should understand these error conditions and how to recover:

| Error Condition | Cause | Recovery Action |
|----------------|-------|-----------------|
| **Empty old_string** | Search string is empty | Use `rewrite_file` instead for new content |
| **Same strings** | old_string === new_string | No action needed (no-op) |
| **String too large** | old_string > 100KB | Use `rewrite_file` instead |
| **Binary file** | File contains null bytes | Cannot edit binary files |
| **Not found** | old_string not in file | Read file again with `read_file`, copy exact text |
| **Not unique** | Multiple matches found | Include more surrounding context (2-3 lines before/after) |
| **Concurrent edit** | Another edit in progress | Wait and retry |
| **Stale content** | File changed during edit | Read file again and retry |

**Best Practices for edit_file:**

1. **Always read first**: Use `read_file` before `edit_file` to get exact text
2. **Include context**: Add 2-3 lines before and after the target code
3. **Make it unique**: Ensure the old_string appears only once in the file
4. **Match exactly**: Copy text exactly including whitespace, indentation, comments
5. **Prefer rewrite_file**: For large changes or when uniqueness is uncertain

**Error Recovery Example:**

If you receive:
```
❌ EDIT FAILED: The old_string was not found in the file.

🔎 Did you mean one of these similar blocks from the file?

Option 1:
```
const foo = "bar"
```
```

Recovery: Copy the similar block exactly, or use `read_file` to get the current file content.

### rewrite_file
Replaces the entire contents of a file.

**JSON Schema:**
```json
{
  "name": "rewrite_file",
  "description": "Replace the entire contents of a file with new content.",
  "parameters": {
    "type": "object",
    "properties": {
      "uri": { "type": "string", "description": "The FULL file path to edit." },
      "new_content": { "type": "string", "description": "The complete new contents of the file." }
    },
    "required": ["uri", "new_content"]
  }
}
```

**When to use rewrite_file vs edit_file:**

| Scenario | Recommended Tool |
|----------|-----------------|
| Small targeted changes | `edit_file` |
| Large refactors | `rewrite_file` |
| Creating new files | `rewrite_file` |
| Multiple similar patterns | `rewrite_file` |
| Complex structural changes | `rewrite_file` |
| Exact text match uncertain | `rewrite_file` |

---

## 3. Terminal & Command Tools

### run_command
Runs a terminal command.

**JSON Schema:**
```json
{
  "name": "run_command",
  "description": "Runs a terminal command in a temporary or persistent terminal.",
  "parameters": {
    "type": "object",
    "properties": {
      "command": { "type": "string", "description": "The terminal command to run." },
      "cwd": { "type": "string", "description": "Optional. Directory to run command in." },
      "is_background": { "type": "boolean", "description": "Optional. If true, runs in a new persistent terminal." },
      "terminal_id": { "type": "string", "description": "Optional. ID of an existing persistent terminal." }
    },
    "required": ["command"]
  }
}
```

---

## 4. Planning & Task Management

### create_plan
Creates a structured task plan.

**JSON Schema:**
```json
{
  "name": "create_plan",
  "description": "Creates a structured plan for complex, multi-step tasks.",
  "parameters": {
    "type": "object",
    "properties": {
      "goal": { "type": "string", "description": "Overall goal (e.g., 'Redesign authentication')." },
      "tasks": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "description": { "type": "string" },
            "dependencies": { "type": "array", "items": { "type": "string" } }
          },
          "required": ["id", "description", "dependencies"]
        }
      }
    },
    "required": ["goal", "tasks"]
  }
}
```

### create_implementation_plan
Creates a high-level implementation plan for user approval.

**JSON Schema:**
```json
{
  "name": "create_implementation_plan",
  "description": "Creates a detailed implementation plan for review and approval.",
  "parameters": {
    "type": "object",
    "properties": {
      "goal": { "type": "string" },
      "steps": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "title": { "type": "string" },
            "description": { "type": "string" },
            "complexity": { "enum": ["simple", "medium", "complex"] },
            "files": { "type": "array", "items": { "type": "string" } },
            "dependencies": { "type": "array", "items": { "type": "string" } }
          }
        }
      }
    },
    "required": ["goal", "steps"]
  }
}
```

---

## 5. Teaching & Learning (Student Mode)

### teach_concept
Introduces a programming concept.

**JSON Schema:**
```json
{
  "name": "teach_concept",
  "description": "Teaches a programming concept from scratch with examples.",
  "parameters": {
    "type": "object",
    "properties": {
      "concept": { "type": "string" },
      "level": { "enum": ["beginner", "intermediate", "advanced"] },
      "language": { "type": "string" },
      "context": { "type": "string" }
    },
    "required": ["concept", "level"]
  }
}
```

### explain_code
Explains code snippets line-by-line.

**JSON Schema:**
```json
{
  "name": "explain_code",
  "description": "Explains code line-by-line at the student's learning level.",
  "parameters": {
    "type": "object",
    "properties": {
      "code": { "type": "string" },
      "language": { "type": "string" },
      "level": { "enum": ["beginner", "intermediate", "advanced"] },
      "focus": { "type": "string" }
    },
    "required": ["code", "language", "level"]
  }
}
```

---

## 6. Morph Repo Storage (Semantic & Git-like Tools)

### codebase_search
Semantic search over indexed code using natural language.

**JSON Schema:**
```json
{
  "name": "codebase_search",
  "description": "Semantic search over Morph Repo Storage (indexed code).",
  "parameters": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Semantic query (e.g., 'How does JWT work?')." },
      "target_directories": { "type": "array", "items": { "type": "string" } },
      "limit": { "type": "number", "default": 10 }
    },
    "required": ["query"]
  }
}
```

### repo_status
Gets the status of a specific file in the Morph repository.

**JSON Schema:**
```json
{
  "name": "repo_status",
  "description": "Get status of a specific file in the repository.",
  "parameters": {
    "type": "object",
    "properties": {
      "dir": { "type": "string", "description": "Repository directory." },
      "filepath": { "type": "string" }
    },
    "required": ["filepath"]
  }
}
```

---

## 7. Skills & Walkthroughs

### load_skill
Loads a specialized skill (e.g., 'pdf-processing') to enhance capabilities.

**JSON Schema:**
```json
{
  "name": "load_skill",
  "description": "Loads a specialized skill to enhance your capabilities.",
  "parameters": {
    "type": "object",
    "properties": {
      "skill_name": { "type": "string" }
    },
    "required": ["skill_name"]
  }
}
```

### update_walkthrough
Updates the `walkthrough.md` file to document progress.

**JSON Schema:**
```json
{
  "name": "update_walkthrough",
  "description": "Creates or updates a walkthrough.md file to document progress.",
  "parameters": {
    "type": "object",
    "properties": {
      "content": { "type": "string", "description": "Markdown content." },
      "mode": { "enum": ["create", "append", "replace"] },
      "title": { "type": "string" },
      "include_plan_status": { "type": "boolean" }
    },
    "required": ["content", "mode"]
  }
}
```

---

## 8. Summary of All Tools

| Category | Tools |
| :--- | :--- |
| **Context** | `read_file`, `outline_file`, `ls_dir`, `get_dir_tree`, `search_pathnames_only`, `search_for_files`, `search_in_file`, `read_lint_errors`, `fast_context`, `codebase_search` |
| **Editing & Exec** | `create_file_or_folder`, `delete_file_or_folder`, `edit_file`, `rewrite_file`, `run_code` |
| **Terminal** | `run_command`, `open_persistent_terminal`, `kill_persistent_terminal`, `wait`, `check_terminal_status` |
| **Planning** | `create_plan`, `update_task_status`, `get_plan_status`, `add_tasks_to_plan`, `create_implementation_plan`, `preview_implementation_plan`, `execute_implementation_plan`, `update_implementation_step`, `get_implementation_status` |
| **Teaching** | `explain_code`, `teach_concept`, `create_exercise`, `check_answer`, `give_hint`, `create_lesson_plan` |
| **Morph Repo** | `repo_init`, `repo_clone`, `repo_add`, `repo_commit`, `repo_push`, `repo_pull`, `repo_status`, `repo_status_matrix`, `repo_log`, `repo_checkout`, `repo_branch`, `repo_list_branches`, `repo_current_branch`, `repo_resolve_ref` |
| **Utilities** | `load_skill`, `list_skills`, `update_walkthrough`, `open_walkthrough_preview` |

---

## 9. Fine-Tuning a Tool Orchestrator Model

### Overview

A **Tool Orchestrator** is a small language model (1-3B parameters) that analyzes user requests and suggests which tools a larger model should use. This dramatically reduces token usage and latency for local development.

**Architecture:**
```
User Request ──► [Small Orchestrator Model (1-3B)] ──► Tool Suggestions
                                    │
                                    ▼
                    [Large Main Model (7B+)] ──► Executes suggested tools
```

**Benefits:**
- 10-100x reduction in orchestration tokens (small model only sees user message)
- Faster response time (small model is quick)
- Lower cost for cloud APIs
- Enables complex tool routing on consumer hardware

### Orchestrator Input Format

The orchestrator receives:
```json
{
  "userMessage": "Find all files that use the useState hook",
  "chatMode": "code"
}
```

**Chat Modes:**
- `code`: Full execution capabilities with file editing, terminal, task planning
- `plan`: Research and implementation planning without execution
- `learn`: Teaching and interactive lessons
- `chat`: Conversational assistance

### Orchestrator Output Format

The orchestrator must return valid JSON:

```json
{
  "reasoning": "Brief explanation of your analysis...",
  "summary": "One-sentence summary of what the user wants",
  "skipOrchestration": false,
  "suggestions": [
    {
      "toolName": "tool_name_here",
      "toolParams": { "param": "value" },
      "reasoning": "Why this tool is needed",
      "confidence": "high|medium|low"
    }
  ]
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `reasoning` | string | Brief analysis of the request |
| `summary` | string | One-sentence summary of user intent |
| `skipOrchestration` | boolean | If true, main LLM handles with all tools |
| `suggestions` | array | List of tool suggestions (can be empty) |

**Suggestion Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `toolName` | string | Exact tool name from available tools |
| `toolParams` | object | Optional partial parameters |
| `reasoning` | string | Why this tool is relevant |
| `confidence` | string | "high", "medium", or "low" |

### Available Tools for Orchestration

**READ TOOLS:**
- `read_file`: Read contents of a specific file
- `outline_file`: Get file structure/outline
- `ls_dir`: List directory contents
- `get_dir_tree`: Get directory tree
- `search_for_files`: Search for files by name
- `search_in_file`: Search for text within files
- `read_lint_errors`: Read lint errors
- `fast_context`: Fast context gathering

**EDIT TOOLS:**
- `edit_file`: Edit specific sections of a file
- `rewrite_file`: Replace entire file content
- `create_file_or_folder`: Create new files or folders

**EXECUTION TOOLS:**
- `run_code`: Execute Python code (for data processing, file operations)
- `run_terminal_command`: Run shell commands

**PLAN TOOLS:**
- `create_implementation_plan`: Create a step-by-step implementation plan
- `update_implementation_step`: Update a plan step
- `get_implementation_status`: Get plan status

**OTHER TOOLS:**
- `render_form`: Display interactive forms for user input
- `create_quiz`: Create interactive quizzes to test knowledge
- `generate_image`: Generate images from text

### Training Data Format

Create training examples in this format:

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a Tool Orchestration Agent for A-Coder. Your job is to analyze user requests and suggest which tools the main LLM should use..."
    },
    {
      "role": "user",
      "content": "{\"userMessage\": \"Find all files that use the useState hook\", \"chatMode\": \"code\"}"
    },
    {
      "role": "assistant",
      "content": "{\"reasoning\": \"User wants to find files using a specific React hook. Need to search within files.\", \"summary\": \"Search for files using the useState hook\", \"skipOrchestration\": false, \"suggestions\": [{\"toolName\": \"search_in_file\", \"toolParams\": {\"query\": \"useState\"}, \"reasoning\": \"Search for useState in all files\", \"confidence\": \"high\"}]}"
    }
  ]
}
```

### Decision Logic for Training

**When to skip orchestration (`skipOrchestration: true`):**
- Simple questions or explanations
- Clarifications about previous responses
- Conceptual questions without file operations
- Requests too complex to pre-determine approach
- When the main LLM should handle reasoning itself

**When to suggest tools:**
- Clear intent to read, edit, or create files
- Search operations (by name or content)
- Terminal commands to run
- Plans to create
- Multi-step workflows with clear first steps

**Confidence levels:**
- `high`: Clear intent, obvious tools needed
- `medium`: Reasonable inference, some ambiguity
- `low`: Uncertain, multiple possible approaches

### Training Example Categories

#### Category 1: File Reading
```json
// User wants to read a file
{"userMessage": "Show me the contents of app.ts", "chatMode": "code"}
// Expected: suggest read_file with uri parameter

// User wants to understand project structure
{"userMessage": "What's the structure of this project?", "chatMode": "code"}
// Expected: suggest ls_dir or get_dir_tree
```

#### Category 2: Searching
```json
// User wants to find files by content
{"userMessage": "Where is the authentication logic?", "chatMode": "code"}
// Expected: suggest search_in_file or fast_context

// User wants to find files by name
{"userMessage": "Find all test files", "chatMode": "code"}
// Expected: suggest search_for_files with pattern
```

#### Category 3: File Editing
```json
// User wants to modify code
{"userMessage": "Change the button color to blue in Header.tsx", "chatMode": "code"}
// Expected: suggest read_file (to get exact content) then edit_file

// User wants to create new file
{"userMessage": "Create a new component called UserProfile", "chatMode": "code"}
// Expected: suggest create_file_or_folder or rewrite_file
```

#### Category 4: Execution
```json
// User wants to run code
{"userMessage": "Run the tests", "chatMode": "code"}
// Expected: suggest run_terminal_command with "npm test" or similar

// User wants to install dependencies
{"userMessage": "Install the lodash package", "chatMode": "code"}
// Expected: suggest run_terminal_command with "npm install lodash"
```

#### Category 5: Planning
```json
// User wants implementation plan
{"userMessage": "Plan how to add user authentication", "chatMode": "plan"}
// Expected: suggest create_implementation_plan

// User wants to check progress
{"userMessage": "What's the status of the current plan?", "chatMode": "code"}
// Expected: suggest get_implementation_status
```

#### Category 6: Skip Orchestration
```json
// Conceptual question
{"userMessage": "Explain how React hooks work", "chatMode": "code"}
// Expected: skipOrchestration: true

// Clarification
{"userMessage": "Can you explain that in more detail?", "chatMode": "code"}
// Expected: skipOrchestration: true

// Too complex
{"userMessage": "Refactor the entire codebase to use TypeScript", "chatMode": "code"}
// Expected: skipOrchestration: true (main LLM needs to explore first)
```

### Recommended Model Sizes

| Use Case | Model Size | Notes |
|----------|------------|-------|
| Edge/Local | 1B-1.5B | Works for simple routing, may struggle with complex requests |
| Balanced | 3B | Good balance of speed and accuracy |
| High Accuracy | 7B | Near-perfect routing for most cases |

### Fine-Tuning Recommendations

**Data Requirements:**
- Minimum: 1,000 examples per tool category
- Recommended: 5,000-10,000 diverse examples
- Include edge cases and multi-tool scenarios

**Training Parameters:**
- Use instruction-tuning format (chat template)
- Low learning rate (1e-5 to 5e-5)
- 2-3 epochs typically sufficient
- Include system prompt in every example

**Evaluation Metrics:**
- Tool selection accuracy (correct tool chosen)
- Parameter extraction accuracy (correct params)
- Skip decision accuracy (knowing when to skip)
- Latency (should be < 100ms for 3B model)

### Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    A-Coder IDE                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User Message                                               │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────────────────────┐                           │
│  │ ToolOrchestrationService     │                          │
│  │ (toolOrchestrationService.ts)│                          │
│  │                             │                           │
│  │  - Calls small model        │                           │
│  │  - Parses JSON response     │                           │
│  │  - Returns suggestions      │                           │
│  └─────────────────────────────┘                           │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────────────────────┐                           │
│  │ convertToLLMMessageService   │                          │
│  │                             │                           │
│  │  - Injects suggestions      │                           │
│  │    into system message      │                           │
│  └─────────────────────────────┘                           │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────────────────────┐                           │
│  │ Main LLM (7B+)              │                           │
│  │                             │                           │
│  │  - Uses suggestions as      │                           │
│  │    guidance                 │                           │
│  │  - Makes actual tool calls  │                           │
│  └─────────────────────────────┘                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Sample System Prompt for Orchestrator

```
You are a Tool Orchestration Agent for A-Coder. Your job is to analyze user requests and suggest which tools the main LLM should use.

Your goal is to reduce token usage by pre-selecting the most relevant tools. The main LLM will then use your suggestions to execute the task efficiently.

<instructions>
Analyze the user's request and determine:

1. **Is orchestration needed?**
   - Skip orchestration for simple questions, clarifications, or explanations
   - Skip if the request is too complex to pre-determine the approach
   - Skip if the main LLM should handle the reasoning itself

2. **Which tools are relevant?**
   - Read/search tools: read_file, search_for_files, search_in_file, ls_dir
   - Editing tools: edit_file, rewrite_file, create_file_or_folder
   - Execution tools: run_code, run_terminal_command
   - Context tools: fast_context, outline_file
   - Plan tools: create_implementation_plan, update_implementation_step
   - Other: render_form, generate_image

3. **What parameters are needed?**
   - Identify file paths, search terms, command inputs, etc.
   - Use placeholders if values aren't known

4. **How confident are you?**
   - high: Clear intent, obvious tools needed
   - medium: Reasonable inference, some ambiguity
   - low: Uncertain, multiple possible approaches
</instructions>

Return valid JSON with reasoning, summary, skipOrchestration flag, and suggestions array.
```

### Performance Optimization Tips

1. **Quantization**: Use 4-bit or 8-bit quantization for faster inference
2. **Caching**: Cache orchestration results for repeated queries
3. **Batching**: Process multiple requests in parallel when possible
4. **Fallback**: If orchestrator fails, default to main LLM with all tools
5. **Streaming**: Stream orchestrator output for perceived speed

---

## 10. Fine-Tuning Dataset Construction

### Dataset Schema

```json
{
  "id": "unique-example-id",
  "category": "read|edit|search|execute|plan|skip",
  "input": {
    "userMessage": "...",
    "chatMode": "code|plan|learn|chat"
  },
  "output": {
    "reasoning": "...",
    "summary": "...",
    "skipOrchestration": false,
    "suggestions": [...]
  },
  "metadata": {
    "difficulty": "easy|medium|hard",
    "tools_involved": ["tool1", "tool2"],
    "requires_context": true
  }
}
```

### Data Augmentation Strategies

1. **Paraphrasing**: Same intent, different wording
2. **Parameter variations**: Same tool, different params
3. **Multi-tool scenarios**: Chained tool operations
4. **Error recovery**: How to handle failed tool calls
5. **Context-dependent**: Different suggestions based on chat mode

### Quality Checklist

- [ ] Tool names are exactly as specified (case-sensitive)
- [ ] Parameters use correct keys (uri, not path or file)
- [ ] JSON is valid and parseable
- [ ] Confidence levels are accurate
- [ ] Skip decisions are appropriate
- [ ] Reasoning is concise but informative