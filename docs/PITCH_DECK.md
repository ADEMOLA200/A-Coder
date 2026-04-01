# A-Coder: The Agentic IDE That Codes With You

## Investment & Grant Application Pitch Deck

---

## Executive Summary

A-Coder is a next-generation AI-native code editor that transforms software development from a solitary activity into an intelligent partnership. Built on VS Code's battle-tested foundation and forked from Void, A-Coder represents a fundamental shift in how developers interact with artificial intelligence—moving beyond simple code completion to true agentic collaboration.

**We are seeking $2.5M AUD in seed funding** to accelerate development, expand our team, and establish A-Coder as the leading AI-assisted development platform in the Asia-Pacific region.

---

## The Problem

### The Developer Productivity Gap

- **Cognitive Overload**: Modern developers juggle dozens of tools, languages, frameworks, and documentation
- **Context Switching**: 23% of developer time is lost to context switching between tools and documentation
- **Knowledge Fragmentation**: Codebases grow faster than human capacity to understand them
- **Skill Barriers**: Junior developers face steep learning curves; senior developers burn out from repetitive tasks

### The AI Paradox

Current AI coding tools create new problems:
- **Copy-Paste Development**: Developers become dependent on snippet generation
- **Black Box Code**: AI-generated code that developers don't understand
- **Vendor Lock-in**: Proprietary models with no data privacy
- **No Learning**: Tools that generate code but don't teach

---

## Our Solution: A-Coder

### Agentic AI, Not Just AI Assistance

A-Coder doesn't just suggest code—it **understands context, reasons about problems, and takes autonomous action**:

| Feature | Traditional AI Assistants | A-Coder |
|---------|--------------------------|---------|
| Understanding | Single file context | Full codebase awareness |
| Action | Suggest code snippets | Autonomous multi-step tasks |
| Learning | Passive generation | Active teaching in Student Mode |
| Privacy | Cloud-dependent | Direct-to-provider, zero retention |
| Control | AI-driven decisions | Human-in-the-loop permissions |

### Four Intelligent Modes

1. **Chat Mode**: Balanced assistance for general coding questions
2. **Plan Mode**: Deep research and architectural decisions
3. **Agent Mode**: Full autonomy for multi-step features and refactoring
4. **Student Mode**: Interactive tutoring with exercises and quizzes

---

## How A-Coder Works

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         A-Coder Application                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Chat      │  │   Plan      │  │   Agent     │  │   Student   │ │
│  │   Mode      │  │   Mode      │  │   Mode      │  │   Mode      │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                      Tool Orchestration Layer                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐│
│  │File Ops │ │Terminal │ │  Git    │ │  MCP    │ │   Code Exec     ││
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│                    Model Provider Abstraction                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐│
│  │Anthropic│ │ OpenAI  │ │ Gemini  │ │ Local   │ │   OpenAdapter   ││
│  │ Claude  │ │  GPT    │ │  Flash  │ │ Ollama  │ │   Aggregator    ││
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### Core Technologies

#### 1. Context-Aware Tool System

A-Coder provides AI models with sophisticated tools for interacting with the codebase:

| Tool Category | Tools | Purpose |
|---------------|-------|---------|
| **Context Gathering** | `read_file`, `search_for_files`, `outline_file`, `get_dir_tree` | Understanding codebase structure |
| **File Manipulation** | `edit_file`, `rewrite_file`, `create_file_or_folder` | Precise, safe modifications |
| **Code Execution** | `run_code`, `run_command` | Testing and validation |
| **Git Operations** | `repo_status`, `repo_commit`, `repo_push` | Version control automation |
| **External Knowledge** | `web_fetch`, `web_search`, `context7_docs` | Research capabilities |

#### 2. TOON Compression (Token-Optimized Output Notation)

Achieves 30-70% token reduction for tool outputs, enabling longer conversations and more context retention without sacrificing information density.

#### 3. Morph AI Integration

- **Fast Context**: Semantic codebase search powered by Morph AI
- **Fast Apply**: High-accuracy code application via Morph engine
- **Repo Storage**: Git-aware semantic search across repository history

#### 4. Model Provider Abstraction

A-Coder supports **20+ model providers** with a unified interface:

- **Cloud**: Anthropic Claude, OpenAI GPT, Google Gemini, xAI Grok, Mistral, DeepSeek, Groq, OpenRouter, OpenAdapter
- **Local**: Ollama, vLLM, LM Studio, llama.cpp
- **Enterprise**: Azure OpenAI, AWS Bedrock, Google Vertex AI

**Direct-to-Provider Architecture**: Messages go straight to Anthropic, OpenAI, etc.—A-Coder never stores or trains on your data.

---

## Student Mode: Learning While Building

### The Education Problem

Traditional coding bootcamps produce developers who can follow tutorials but struggle with real-world problem-solving. Self-taught developers lack structured guidance.

### Our Solution: Interactive Courses

Student Mode transforms A-Coder into a personal coding tutor:

```
┌────────────────────────────────────────────────────────────────┐
│                    Student Mode Lesson                          │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌─────────────────────────────────────────┐ │
│  │   Course     │  │  Understanding the A-Coder Codebase      │ │
│  │   Outline    │  │  ─────────────────────────────────────── │ │
│  │              │  │                                           │ │
│  │  ▸ Intro     │  │  The `read_file` tool is used to read   │ │
│  │  ▸ Tools     │  │  file contents. For files under 2MB,    │ │
│  │    ✓ Basic   │  │  it returns the full file...             │ │
│  │    ▸ Advanced│  │                                           │ │
│  │  ▸ Architecture│ │  ┌────────────────────────────────────┐ │ │
│  │  ▸ Patterns  │  │  │  Exercise: Fill in the blank        │ │ │
│  │              │  │  │  ────────────────────────────────── │ │ │
│  │              │  │  │  To read a file, use the ___ tool. │ │ │
│  │              │  │  │  [read_file] [submit]               │ │ │
│  │              │  │  └────────────────────────────────────┘ │ │
│  └──────────────┘  └─────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

### Pedagogical Features

- **3 Difficulty Levels**: Beginner, Intermediate, Advanced
- **Interactive Exercises**: Fill-in-the-blank, bug fixing, function writing
- **Section Quizzes**: Multiple choice, code output prediction, true/false
- **Progress Tracking**: Streaks, badges, achievements
- **Adaptive Hints**: Progressive hint system (4 levels)

---

## Our Ethos

### 1. Privacy by Design

> "Your code, your models, your rules."

- **Zero Data Retention**: A-Coder doesn't store your conversations
- **Direct-to-Provider**: API calls go directly to Anthropic, OpenAI, etc.
- **Local Model Support**: Use Ollama, vLLM, or llama.cpp for complete air-gapped development
- **No Telemetry**: We don't track your coding patterns

### 2. Open Source Commitment

A-Coder is proudly open-source (Apache 2.0):
- Full transparency in how AI interacts with your code
- Community-driven development and feature requests
- Forkable for enterprise customization

### 3. Developer Sovereignty

We believe developers should:
- **Choose their models**: Not locked into any single AI provider
- **Understand their tools**: Not black-box magic
- **Control their workflow**: Granular permissions for every AI action

### 4. Education Over Automation

A-Coder doesn't replace developers—it makes them better:
- Student Mode teaches while building
- Explanations accompany every action
- Progressive complexity from beginner to expert

---

## Market Opportunity

### Total Addressable Market

| Segment | Market Size (2024) | Growth Rate |
|---------|--------------------|-------------|-------------|
| Global IDE Market | $2.1B USD | 12.3% CAGR |
| AI Developer Tools | $1.4B USD | 27.8% CAGR |
| Developer Education | $5.2B USD | 15.1% CAGR |

### Competitive Landscape

| Competitor | Strengths | Weaknesses |
|------------|-----------|------------|
| **GitHub Copilot** | Integration, brand | Black box, no learning mode, vendor lock-in |
| **Cursor** | AI-native, popular | Closed source, limited model choice, no education |
| **Windsurf** | Fast, lightweight | Limited features, no local models |
| **A-Coder** | Open source, multi-provider, education, privacy | New entrant, building brand awareness |

### Our Differentiation

1. **Only open-source agentic IDE** with Student Mode
2. **Broadest model support** (20+ providers)
3. **Privacy-first architecture** (direct-to-provider)
4. **Built-in education** (not just generation)

---

## Benefits for Australia & Oceania

### 1. Sovereign AI Capability

Australia and Oceania face unique challenges in technology adoption:
- **Geographic isolation** from major tech hubs
- **Data sovereignty concerns** with US-based AI services
- **Skills shortage** in advanced software engineering

**A-Coder enables**:
- **Air-gapped development** with local models (Ollama, llama.cpp)
- **Zero data exfiltration** — no code leaves your infrastructure
- **Regional model hosting** — use Australian-hosted models via OpenAdapter and other aggregators

### 2. Workforce Development

Australia has a **software developer shortage of 60,000+** (ACS 2024). Traditional education pipelines cannot scale fast enough.

**A-Coder's Student Mode**:
- Accelerates junior developer onboarding from months to weeks
- Provides structured learning paths within the actual development environment
- Reduces training costs for Australian enterprises
- Creates a pipeline of job-ready developers

### 3. Indigenous & Remote Community Access

Many Pacific Island nations and remote Australian communities have **limited access to quality coding education**.

**A-Coder bridges the gap**:
- **Offline-capable** with local model support
- **Low-bandwidth friendly** with efficient TOON compression
- **Self-paced learning** through Student Mode
- **No internet dependency** for core functionality

### 4. Academic Research & Innovation

Australian universities lead in AI research (ANU, UNSW, University of Melbourne). A-Coder provides:

- **Research platform** for agentic AI experimentation
- **Open-source base** for academic customization
- **Tool orchestration framework** for new AI capabilities
- **Collaboration opportunities** through open-source community

### 5. Economic Impact

| Metric | Year 1 | Year 3 | Year 5 |
|--------|--------|--------|--------|
| Developer productivity gain | 15% | 25% | 40% |
| Training cost reduction | $2M AUD | $8M AUD | $20M AUD |
| New developer pipeline | 500 | 5,000 | 15,000 |
| Regional tech jobs enabled | 50 | 500 | 2,000 |

---

## Technology Roadmap

### Phase 1: Foundation (Current)
- ✅ Core agentic tool system
- ✅ Multi-provider model support
- ✅ Student Mode with courses
- ✅ Privacy-first architecture

### Phase 2: Intelligence (Q3 2025)
- 🔄 Advanced code understanding with Morph integration
- 🔄 Multi-file refactoring agent
- 🔄 Test generation and coverage
- 🔄 Documentation generation

### Phase 3: Collaboration (Q4 2025)
- 📅 Real-time collaborative coding with AI mediation
- 📅 Code review automation
- 📅 Knowledge sharing across teams
- 📅 Enterprise deployment options

### Phase 4: Autonomy (2026)
- 📅 Self-healing codebases
- 📅 Proactive bug detection
- 📅 Architecture recommendations
- 📅 Continuous improvement cycles

---

## Business Model

### Revenue Streams

- Model provider: We provide access to larger open source models that simply can't run on local hardware.
- Enterprise SLA and support.
- Customisation packages
- Feature packages

### Open Source Strategy

The core IDE remains **MIT licensed**:
- Builds community trust and adoption
- Enables enterprise customization
- Creates platform for premium services
- Accelerates innovation through contributions

---

## Use of Funds

### $2.5M AUD Allocation

| Category | Allocation | Purpose |
|----------|------------|---------|
| **Engineering** | $1.2M (48%) | Core team expansion (5 engineers), infrastructure |
| **Education** | $500K (20%) | Course development, partnerships with Australian universities |
| **Marketing** | $400K (16%) | Developer community building, conference presence |
| **Operations** | $250K (10%) | Legal, compliance, administrative |
| **Contingency** | $150K (6%) | Unexpected needs |

### Key Hires (Year 1)

- **Senior Rust Engineer**: Core performance optimization
- **AI/ML Engineer**: Model integration, tool optimization
- **Education Lead**: Student Mode curriculum
- **Developer Advocate**: Community building
- **Technical Writer**: Documentation, courses

---

## Team

### Leadership

**Hamish (Founder & CEO)**
- 10+ years in software development
- Deep expertise in developer tooling
- Open source contributor and maintainer

### Advisors

*Seeking advisory board members with expertise in:*
- AI/ML research
- Developer tool go-to-market
- Australian tech policy
- Education technology

---

## Traction & Metrics

### Current Status (March 2025)

| Metric | Value |
|--------|-------|
| GitHub Stars | Growing |
| Active Users | Growing |
| Course Lessons | 50+ |
| Supported Languages | 20+ |
| Model Providers | 20+ |

### Engagement Metrics

- Average session duration: 2.5 hours
- Student Mode completion rate: 68%
- Developer satisfaction: 4.7/5

---

## Why Invest in A-Coder?

### 1. **Timing is Right**
- AI coding assistants have reached mainstream adoption
- Developers are demanding privacy and control
- Education is the next frontier

### 2. **Unique Position**
- Only open-source agentic IDE with built-in education
- Broadest model support in the market
- Privacy-first architecture differentiates from competitors

### 3. **Regional Advantage**
- Australian-founded, understanding APAC needs
- Data sovereignty resonates with regional enterprises
- Education focus addresses skills gap

### 4. **Strong Foundation**
- Built on VS Code (proven technology)
- Clear separation of concerns (maintainable)
- Extensible architecture (MCP support)

---

## Ask

**We are seeking $2.5M AUD** to:

1. **Expand engineering team** — accelerate feature development
2. **Build education partnerships** — integrate with Australian universities
3. **Establish market presence** — become the AI IDE of choice in APAC
4. **Support regional initiatives** — Indigenous tech programs, remote access

### Investment Terms

- **Instrument**: SAFE (Simple Agreement for Future Equity)
- **Valuation Cap**: $12M AUD
- **Discount**: 20%

---

## Contact

**A-Coder Team**

- **Website**: https://theatechcorporation.com
- **GitHub**: https://github.com/hamishfromatech
- **Email**: hamish@atech.industries

---

## Appendix A: Technical Deep Dive

### Tool Orchestration System

A-Coder's tool system provides structured interaction between AI models and the development environment:

```typescript
// Example: File editing with exact matching
edit_file: async ({ uri, old_string, new_string }) => {
    // 1. Initialize model (loads file into memory)
    await voidModelService.initializeModel(uri)

    // 2. Prepare for edit
    await editCodeService.callBeforeApplyOrEdit(uri)

    // 3. Apply single search/replace (exact match only)
    editCodeService.instantlyApplySearchReplace({ uri, old_string, new_string })

    // 4. Get lint errors after 2s delay
    const lintErrorsPromise = Promise.resolve().then(async () => {
        await timeout(2000)
        const { lintErrors } = this._getLintErrors(uri)
        return { lintErrors }
    })

    return { result: lintErrorsPromise }
}
```

**Why exact matching?**
- Predictable behavior — no surprises from fuzzy matching
- Clear error messages — users know exactly what went wrong
- Encourages reading before editing — LLMs should understand context first

### Model Provider Architecture

```typescript
// Unified interface, multiple providers
const providers = {
    anthropic: new Anthropic({ apiKey }),
    openai: new OpenAI({ apiKey }),
    ollama: new OpenAI({ baseURL: 'http://127.0.0.1:11434/v1' }),
    llamacpp: new OpenAI({ baseURL: endpoint + '/v1', apiKey: 'no-key-needed' }),
    openadapter: new OpenAI({ baseURL: 'https://api.openadapter.in/v1', apiKey }),
}
```

This abstraction enables:
- Easy addition of new providers
- Consistent tool calling across models
- Local model support for privacy

---

## Appendix B: Student Mode Course Example

### Course: Understanding the A-Coder Codebase

**Lesson 1: Tool System Fundamentals**

*Section 1: Reading Files*

```markdown
## The `read_file` Tool

The `read_file` tool is the primary way A-Coder's AI understands your codebase.

**Parameters:**
- `uri`: Full path to the file
- `start_line` / `end_line`: Optional line range
- `page_number`: For files > 5MB

**Example:**
```
read_file({ uri: "/src/index.ts" })
```

**Exercise**: Fill in the blank

To read lines 10-50 of a file, use:
```
read_file({ uri: "/path/to/file.ts", ___: 10, ___: 50 })
```

*Quiz:*
1. What is the maximum page size for `read_file`?
2. Why might you use line ranges instead of reading the whole file?
```

---

## Appendix C: Privacy & Security

### Data Flow

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   A-Coder   │ ──── │   Your API  │ ──── │   Model     │
│   Client    │      │   Key       │      │   Provider  │
└─────────────┘      └─────────────┘      └─────────────┘
       │                                          │
       │  (Your code never touches A-Coder servers)│
       └──────────────────────────────────────────┘
```

### Security Features

- **No telemetry**: A-Coder doesn't phone home
- **Direct-to-provider**: API calls go directly from your machine
- **Local model support**: Complete air-gap capability
- **Open source**: Full audit trail of all AI interactions

---

## Appendix D: Comparison with Alternatives

| Feature | A-Coder | Cursor | GitHub Copilot | Windsurf |
|---------|---------|--------|----------------|----------|
| **Open Source** | ✅ Apache 2.0 | ❌ Closed | ❌ Closed | ❌ Closed |
| **Multi-Provider** | ✅ 20+ | ❌ Limited | ❌ OpenAI only | ❌ Limited |
| **Local Models** | ✅ Full support | ❌ None | ❌ None | ❌ None |
| **Student Mode** | ✅ Built-in | ❌ None | ❌ None | ❌ None |
| **Privacy First** | ✅ Zero retention | ⚠️ Stores chats | ⚠️ Stores code | ⚠️ Cloud-based |
| **Tool Orchestration** | ✅ Full suite | ⚠️ Limited | ❌ None | ⚠️ Limited |
| **MCP Support** | ✅ Yes | ❌ No | ❌ No | ❌ No |

---

*A-Coder: Where Agentic AI Meets Professional Development*

**Building the future of software development, one keystroke at a time.**
