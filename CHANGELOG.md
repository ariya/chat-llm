# Changelog

All notable changes to Chat LLM will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-12-08

### Added - Major v2 Release

#### Agent System
- **Agent Manager** - Complete multi-purpose agent orchestration system
  - 7 built-in specialized agents (Researcher, Coder, Writer, Analyst, Tutor, Solver, Support)
  - Custom agent registration with capabilities
  - Agent activation and switching
  - Usage statistics tracking
  - System prompts optimized for each role

#### Context Management
- **Context Manager** - Data and knowledge base management
  - Create and manage multiple independent contexts
  - Document management with metadata
  - Tag-based organization and search
  - Context merging and combination
  - Multi-format export (JSON, CSV, text)
  - Persistent storage

#### Prompt System
- **Prompt Manager** - Advanced prompt templating
  - 7 built-in templates (Analysis, Code Review, Writing, Problem Solving, Translation, Research, Brainstorming)
  - Variable substitution with {variable} syntax
  - Conditional blocks with {#if condition}...{/if}
  - Global and local variable management
  - Template chaining for complex workflows
  - Usage statistics

#### Memory Management
- **Memory Manager** - Intelligent conversation persistence
  - Short-term memory (recent items)
  - Long-term memory (knowledge retention)
  - Automatic message summarization
  - Token tracking and counting
  - Multi-conversation support
  - Export functionality (JSON, CSV, text)

#### Task & Workflow System
- **Task Manager** - Comprehensive task orchestration
  - Task creation with type, input, and metadata
  - Priority-based queuing (high/normal/low)
  - Automatic retry with exponential backoff
  - Workflow creation (sequential/parallel)
  - Batch operations
  - Task lifecycle tracking

#### Performance & Monitoring
- **Response Cache** - Two-tier caching system
  - Memory cache for instant retrieval
  - Disk cache for persistence
  - Configurable TTL (default: 24 hours)
  - Cache statistics (hit rate, size)
  - Cache clear functionality

- **Request Logger** - Comprehensive logging
  - JSONL format for efficient storage
  - Request/response logging with truncation
  - Performance metrics
  - Export to JSON/CSV
  - Statistics dashboard

- **Performance Monitor** - System metrics
  - Operation tracking
  - Memory usage monitoring
  - P95 latency calculations
  - Performance statistics

#### Configuration System
- **Config Manager** - Centralized settings
  - JSON-based configuration
  - Dotted notation for nested keys
  - Profile support
  - Runtime configuration updates
  - Default settings with overrides

#### Analysis Tools
- **Sentiment Analyzer** - Text sentiment analysis
  - Three-class classification (positive/negative/neutral)
  - Sentiment scoring
  - Keyword-based detection
  - Multi-language support

#### CLI Enhancements
- New commands for all v2 systems:
  - `agent-list`, `agent-activate`, `agent-stats`
  - `context-create`, `context-list`, `context-activate`, `context-stats`
  - `prompt-list`, `prompt-render`
  - `task-list`, `task-stats`
  - `memory-list`, `memory-stats`
  - `cache-stats`, `cache-clear`
  - `config-get`, `config-set`, `config-list`
  - `sentiment <text>`
  - `stats`, `export <format>`

#### Documentation
- Created comprehensive documentation suite:
  - **API.md** - Complete API reference
  - **FEATURES.md** - Detailed feature overview
  - **CONTRIBUTING.md** - Contribution guidelines
  - **CHANGELOG.md** - Version history
  - Updated **README.md** with v2 features
  - Updated **QUICK_START.md** with examples
  - Updated **ROADMAP.md** with future plans
  - Updated **DEVELOPMENT.md** with architecture details
  - Created **RELEASE_NOTES_V2.md**

#### Code Quality
- Added comprehensive JSDoc comments to all functions
- Improved error handling throughout
- Better input validation
- Consistent code style
- Modular architecture

### Changed

#### Architecture
- Reorganized into modular components
- Each tool is now self-contained
- Clear separation of concerns
- Independent module testing

#### Core Functionality
- Enhanced `chat()` function with better error handling
- Improved retry logic with exponential backoff
- Better rate limit handling (HTTP 429)
- Enhanced demo mode responses

### Fixed

#### Reliability
- Fixed potential memory leaks in caching
- Improved error recovery
- Better timeout handling
- Enhanced retry mechanisms

#### Performance
- Optimized cache lookups
- Reduced memory footprint
- Faster file I/O operations
- Better streaming performance

### Deprecated

None - v2 is fully backward compatible with v1

### Removed

None - All v1 features retained

### Security

- Input validation on all user inputs
- Path traversal prevention
- Safe file operations
- Metadata sanitization

---

## [1.0.0] - 2024-XX-XX

### Added

#### Core Features
- Basic chat functionality with LLM API
- Streaming responses
- Multi-model support (OpenAI-compatible APIs)
- Web interface with minimalist UI
- CLI interface with interactive mode
- Multi-language support (English, Spanish, French, German, Italian, Indonesian)
- Language switching in conversations
- Pipe support for quick queries
- Demo mode for testing without API

#### LLM Integration
- Support for cloud services:
  - OpenAI
  - Groq
  - OpenRouter
  - Cerebras
  - DeepSeek
  - Fireworks
  - Mistral
  - Together AI
  - Hyperbolic
  - Nebius
  - Novita
  - Glama

- Support for local servers:
  - llama.cpp
  - Ollama
  - LM Studio
  - Jan
  - LocalAI
  - Msty

#### Evaluation System
- QA file evaluation
- Regular expression matching for answers
- Multi-turn conversation testing
- CI/CD workflows for language testing

#### Documentation
- README.md with setup instructions
- Configuration examples
- Usage examples
- Language-specific test workflows

### Features

#### Zero Dependencies
- Built using only Node.js standard library
- No npm packages required
- Fast installation and startup

#### Error Handling
- Automatic retry on failures
- Timeout handling
- Rate limit management
- Graceful error messages

#### Environment Configuration
- Configurable API endpoints
- API key management
- Model selection
- Streaming control
- Debug mode

---

## Version History Summary

- **v2.0.0** (2025-12-08) - Major release with agent orchestration, context management, prompts, memory, tasks, caching, logging, and analytics
- **v1.0.0** (2024-XX-XX) - Initial release with basic chat, multi-model support, and web interface

---

## Upgrade Guide

### From v1 to v2

v2 is fully backward compatible. All v1 features continue to work:

**No Breaking Changes:**
- ✓ All environment variables work the same
- ✓ CLI commands remain compatible
- ✓ Web interface unchanged
- ✓ API endpoints unchanged

**New Optional Features:**
- Agent system (opt-in)
- Context management (opt-in)
- Prompt templates (opt-in)
- Memory system (opt-in)
- Task queues (opt-in)
- Caching (enabled by default, configurable)
- Logging (enabled by default, configurable)

**Migration Steps:**
1. Update to v2 branch: `git pull origin v2`
2. Run application: `./chat-llm.js`
3. Explore new features: `./chat-llm.js --help`

**New Directories (Auto-created):**
- `./cache/` - Response cache
- `./config/` - Configuration files
- `./logs/` - Request logs
- `./memory/` - Conversation storage
- `./context-data/` - Context storage

**Disabling New Features:**
```bash
# Disable caching
./chat-llm.js config-set caching.enabled false

# Disable logging
./chat-llm.js config-set logging.enabled false
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to contribute to this project.

---

## License

See [LICENSE](LICENSE) file for details.

---

**Maintained by:** yonikashi432  
**Repository:** https://github.com/yonikashi432/chat-llm
