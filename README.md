# Chat LLM

**Chat LLM** is a Swiss Army Knife for LLM-powered tasks. It's a simple, zero-dependency tool to chat with an LLM (large language model) that provides advanced features like agent orchestration, context management, memory systems, and task automation.

It works seamlessly with both cloud-based LLM services (e.g., [OpenAI GPT](https://platform.openai.com/docs), [Groq](https://groq.com), [OpenRouter](https://openrouter.ai)) and locally hosted LLMs (e.g. [llama.cpp](https://github.com/ggerganov/llama.cpp), [LM Studio](https://lmstudio.ai), [Ollama](https://ollama.com)).

Chat LLM is accessible via the terminal or through its minimalist web interface.

<img src="chat-llm.png" alt="Chat LLM" width="50%" height="50%"/>

## Quick Start

To run Chat LLM, ensure that [Node.js](https://nodejs.org) (v18 or higher) or [Bun](https://bun.sh) is installed.

```bash
./chat-llm.js
```

To obtain quick responses, pipe a question directly:
```bash
echo "Top travel destinations in Indonesia?" | ./chat-llm.js
```

For specific tasks:
```bash
echo "Translate 'thank you' into German" | ./chat-llm.js
```

Chat LLM also includes a minimalist front-end web interface. To launch it, specify the environment variable `HTTP_PORT`, for example:

```bash
HTTP_PORT=5000 ./chat-llm.js
```

Then, open a web browser and go to `localhost:5000`.

## v2 Features - Swiss Army Knife for AI

Chat LLM v2 introduces powerful multi-purpose agent capabilities:

### Agent Orchestration
Specialized agents for different tasks:
- **Researcher** - Information gathering and synthesis
- **Coder** - Programming and debugging
- **Writer** - Content creation and editing
- **Analyst** - Data analysis and insights
- **Tutor** - Educational explanations
- **Solver** - Problem-solving methodology
- **Support** - Customer service

```bash
./chat-llm.js agent-list              # View all agents
./chat-llm.js agent-activate coder    # Activate agent
./chat-llm.js agent-stats             # View statistics
```

### Context Management
Work with custom data and knowledge bases:

```bash
./chat-llm.js context-create research      # Create context
./chat-llm.js context-list                 # List contexts
./chat-llm.js context-activate research    # Activate context
```

### Advanced Prompt Templates
Pre-built templates for common tasks with variable substitution and conditionals:

```bash
./chat-llm.js prompt-list      # View templates
./chat-llm.js prompt-render analysis  # Display template
```

### Intelligent Memory
Persistent conversation memory with automatic summarization:

```bash
./chat-llm.js memory-list      # List conversations
./chat-llm.js memory-stats     # Memory usage
```

### Task & Workflow Management
Queue tasks, manage workflows, and batch process:

```bash
./chat-llm.js task-list        # View tasks
./chat-llm.js task-stats       # Queue statistics
```

### Analysis & Logging
Built-in sentiment analysis, request logging, and statistics:

```bash
./chat-llm.js sentiment "text"  # Analyze sentiment
./chat-llm.js stats             # Request statistics
./chat-llm.js export json       # Export logs
```

For detailed v2 features and examples, see [QUICK_START.md](QUICK_START.md) and [DEVELOPMENT.md](DEVELOPMENT.md).

## Response Caching & Configuration

Chat LLM automatically caches responses for 24 hours to avoid repeated calls to your LLM API. Cached results live in `./cache` and are reused instantly in the terminal and web UI. This keeps latency low and saves API credits when you revisit the same prompt during a debugging or evaluation session.

```bash
./chat-llm.js cache-stats         # Inspect memory/disk cache usage
./chat-llm.js cache-clear         # Purge all cached responses
./chat-llm.js config-get caching.enabled
./chat-llm.js config-set caching.enabled false   # Disable caching
./chat-llm.js config-set caching.enabled true    # Re-enable caching
```

When caching is disabled via the config command, Chat LLM immediately falls back to live responses without touching the cache. Re-enabling restores the 24-hour TTL without restarting the app.

## Agent, Context, and Memory Orchestration

Activating an agent (`./chat-llm.js agent-activate coder`) now feeds that persona’s system prompt straight into every chat request, so the CLI/web UI instantly adopts the tone and capabilities of the selected specialist. The active context (`context-create`, `context-activate`) is summarized and injected as another system message, giving the LLM a compact view of your tagged data and uploaded documents before it answers.

```bash
./chat-llm.js agent-list
./chat-llm.js agent-activate researcher
./chat-llm.js context-create customer-success
./chat-llm.js context-activate customer-success
./chat-llm.js memory-list
./chat-llm.js memory-stats
```

Terminal and web sessions persist into the new Memory Manager (`./memory/`), so `memory-list` can replay full transcripts even across restarts. Each cache hit is streamed via the existing delegate, logged with metadata (agent, context, model), and recorded in memory so you can audit automated workflows.

## Prompt Templates

The Prompt Manager ships with battle-tested templates for analysis, coding, research, and more. You can now render them directly from the CLI with inline variables:

```bash
./chat-llm.js prompt-run analysis data="Q4 sales dipped 14%" focus="root-cause, mitigation"
```

Combine this with `prompt-list` and `prompt-render` to inspect or extend the templates before handing the generated instructions to the chat runtime.

## Multi-language Support

Chat LLM is capable of conversing in multiple languages beyond English. It consistently responds in the same language as the question posed. Additionally, it supports seamless language switching between queries, as illustrated in the following example:

```
>> Which planet in our solar system is the largest?
Jupiter is the largest planet in our solar system.

>> ¿Y el más caliente?
Venus es el planeta más caliente, con hasta 475 grados Celsius.
```

The continuous integration workflows for Chat LLM include evaluation tests in English, Spanish, German, French, Italian, and Indonesian. All tests are conducted with LLMs that have at least a 128K context window length.

[![English tests](https://github.com/ariya/chat-llm/actions/workflows/english.yml/badge.svg)](https://github.com/ariya/chat-llm/actions/workflows/english.yml)
[![Spanish tests](https://github.com/ariya/chat-llm/actions/workflows/spanish.yml/badge.svg)](https://github.com/ariya/chat-llm/actions/workflows/spanish.yml)
[![French tests](https://github.com/ariya/chat-llm/actions/workflows/french.yml/badge.svg)](https://github.com/ariya/chat-llm/actions/workflows/french.yml)
[![German tests](https://github.com/ariya/chat-llm/actions/workflows/german.yml/badge.svg)](https://github.com/ariya/chat-llm/actions/workflows/german.yml)
[![Italian tests](https://github.com/ariya/chat-llm/actions/workflows/italian.yml/badge.svg)](https://github.com/ariya/chat-llm/actions/workflows/italian.yml)
[![Indonesian tests](https://github.com/ariya/chat-llm/actions/workflows/indonesian.yml/badge.svg)](https://github.com/ariya/chat-llm/actions/workflows/indonesian.yml)
[![Language switch](https://github.com/ariya/chat-llm/actions/workflows/lang-switch.yml/badge.svg)](https://github.com/ariya/chat-llm/actions/workflows/lang-switch.yml)

## Using Local LLM Servers

Supported local LLM servers include [llama.cpp](https://github.com/ggerganov/llama.cpp), [Jan](https://jan.ai), [Ollama](https://ollama.com), [LocalAI](https://localai.io), [LM Studio](https://lmstudio.ai), and [Msty](https://msty.app).

To utilize [llama.cpp](https://github.com/ggerganov/llama.cpp) locally with its inference engine, load a quantized model like [Llama-3.2 3B](https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF) or [Gemma-3 4B](https://huggingface.co/bartowski/google_gemma-3-4b-it-GGUF). Then set the `LLM_API_BASE_URL` environment variable:
```bash
/path/to/llama-server -m Llama-3.2-3B-Instruct-Q4_K_M.gguf
export LLM_API_BASE_URL=http://127.0.0.1:8080/v1
```

To use [Jan](https://jan.ai) with its local API server, refer to [its documentation](https://jan.ai/docs/local-api). Load a model like [Llama-3.2 3B](https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF) or [Gemma-3 4B](https://huggingface.co/bartowski/google_gemma-3-4b-it-GGUF), and set the following environment variables:
```bash
export LLM_API_BASE_URL=http://127.0.0.1:1337/v1
export LLM_CHAT_MODEL='llama3-8b-instruct'
```

To use [Ollama](https://ollama.com) locally, load a model and configure the environment variable `LLM_API_BASE_URL`:
```bash
ollama pull llama3.2
export LLM_API_BASE_URL=http://127.0.0.1:11434/v1
export LLM_CHAT_MODEL='llama3.2'
```

For [LocalAI](https://localai.io), initiate its container and adjust the environment variable `LLM_API_BASE_URL`:
```bash
docker run -ti -p 8080:8080 localai/localai llama-3.2-3b-instruct:q4_k_m
export LLM_API_BASE_URL=http://localhost:3928/v1
```

For [LM Studio](https://lmstudio.ai), pick a model (e.g., Llama-3.2 3B). Next, go to the Developer tab, select the model to load, and click the Start Server button. Then, set the `LLM_API_BASE_URL` environment variable, noting that the server by default runs on port `1234`:
```bash
export LLM_API_BASE_URL=http://127.0.0.1:1234/v1
```

For [Msty](https://msty.app), choose a model (e.g., Llama-3.2 3B) and ensure the local AI is running. Go to the Settings menu, under Local AI, and note the Service Endpoint (which defaults to port `10002`). Then set the `LLM_API_BASE_URL` environment variable accordingly:
```bash
export LLM_API_BASE_URL=http://127.0.0.1:10002/v1
```

## Using Managed LLM Services

Supported LLM services include [Cerebras](https://cloud.cerebras.ai), [Deep Infra](https://deepinfra.com), [DeepSeek](https://platform.deepseek.com/), [Fireworks](https://fireworks.ai), [Groq](https://groq.com), [Hyperbolic](https://www.hyperbolic.xyz), [Mistral](https://console.mistral.ai), [Nebius](https://studio.nebius.ai), [Novita](https://novita.ai), [OpenAI](https://platform.openai.com), [OpenRouter](https://openrouter.ai), and [Together](https://www.together.ai).

For configuration specifics, refer to the relevant section. The quality of answers can vary based on the model's performance.

* [Cerebras](https://cloud.cerebras.ai)
```bash
export LLM_API_BASE_URL=https://api.cerebras.ai/v1
export LLM_API_KEY="yourownapikey"
export LLM_CHAT_MODEL="llama3.1-8b"
```

* [Deep Infra](https://deepinfra.com)
```bash
export LLM_API_BASE_URL=https://api.deepinfra.com/v1/openai
export LLM_API_KEY="yourownapikey"
export LLM_CHAT_MODEL="meta-llama/Meta-Llama-3.1-8B-Instruct"
```

* [DeepSeek](https://platform.deepseek.com)
```bash
export LLM_API_BASE_URL=https://api.deepseek.com/v1
export LLM_API_KEY="yourownapikey"
export LLM_CHAT_MODEL="deepseek-chat"
```

* [Fireworks](https://fireworks.ai/)
```bash
export LLM_API_BASE_URL=https://api.fireworks.ai/inference/v1
export LLM_API_KEY="yourownapikey"
export LLM_CHAT_MODEL="accounts/fireworks/models/qwen3-30b-a3b"
```

* [Glama](https://glama.ai)
```bash
export LLM_API_BASE_URL=https://glama.ai/api/gateway/openai/v1
export LLM_API_KEY="yourownapikey"
export LLM_CHAT_MODEL='ministral-3b-2410'
```

* [Groq](https://groq.com/)
```bash
export LLM_API_BASE_URL=https://api.groq.com/openai/v1
export LLM_API_KEY="yourownapikey"
export LLM_CHAT_MODEL="llama-3.1-8b-instant"
```

* [Hyperbolic](https://www.hyperbolic.xyz)
```bash
export LLM_API_BASE_URL=https://api.hyperbolic.xyz/v1
export LLM_API_KEY="yourownapikey"
export LLM_CHAT_MODEL="meta-llama/Meta-Llama-3.1-8B-Instruct"
```

* [Mistral](https://console.mistral.ai)
```bash
export LLM_API_BASE_URL=https://api.mistral.ai/v1
export LLM_API_KEY="yourownapikey"
export LLM_CHAT_MODEL="mistral-small-latest"
```

* [Nebius](https://studio.nebius.ai)
```bash
export LLM_API_BASE_URL=https://api.studio.nebius.ai/v1
export LLM_API_KEY="yourownapikey"
export LLM_CHAT_MODEL="meta-llama/Meta-Llama-3.1-8B-Instruct"
```

* [Novita](https://novita.ai)
```bash
export LLM_API_BASE_URL=https://api.novita.ai/v3/openai
export LLM_API_KEY="yourownapikey"
export LLM_CHAT_MODEL="meta-llama/llama-3.1-8b-instruct"
```

* [OpenAI](https://platform.openai.com)
```bash
export LLM_API_BASE_URL=https://api.openai.com/v1
export LLM_API_KEY="yourownapikey"
export LLM_CHAT_MODEL="gpt-5-nano"
```

* [OpenRouter](https://openrouter.ai/)
```bash
export LLM_API_BASE_URL=https://openrouter.ai/api/v1
export LLM_API_KEY="yourownapikey"
export LLM_CHAT_MODEL="meta-llama/llama-3.1-8b-instruct"
```

* [Together](https://www.together.ai/)
```bash
export LLM_API_BASE_URL=https://api.together.xyz/v1
export LLM_API_KEY="yourownapikey"
export LLM_CHAT_MODEL="meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"
```

## Evaluating Questions

If there is a text file containing pairs of `User` and `Assistant` messages, it can be evaluated with Chat LLM:

```
User: Which planet is the largest?
Assistant: The largest planet is /Jupiter/.

User: and the smallest?
Assistant: The smallest planet is /Mercury/.
```

Assuming the above content is in `qa.txt`, executing the following command will initiate a multi-turn conversation with the LLM, asking questions sequentially and verifying answers using regular expressions:
```bash
./chat-llm.js qa.txt
```

For additional examples, please refer to the `tests/` subdirectory.

## v2 Advanced Features

### Configuration Management

Chat LLM v2 includes a comprehensive configuration system for managing application settings and profiles:

```bash
# Get configuration values
./chat-llm.js config-get models.temperature
./chat-llm.js config-get caching.enabled

# Set configuration values
./chat-llm.js config-set models.temperature 0.8
./chat-llm.js config-set caching.ttl 3600000

# List available profiles
./chat-llm.js config-list
```

Default configuration includes:
- Model settings (temperature, max tokens)
- Caching behavior (TTL: 24 hours)
- Logging configuration
- API timeout and retry settings

### Response Caching

Intelligent response caching reduces API calls and improves performance:

```bash
# View cache statistics
./chat-llm.js cache-stats

# Clear cache
./chat-llm.js cache-clear
```

The cache automatically stores responses with a 24-hour TTL and can be enabled/disabled via configuration.

### Request Logging & Analytics

All requests are logged automatically for monitoring and debugging:

```bash
# View statistics
./chat-llm.js stats

# Export logs
./chat-llm.js export json > logs.json
./chat-llm.js export csv > logs.csv
```

Logs include:
- Request timestamps
- Operation types
- Response times
- Request/response content (truncated)

### Sentiment Analysis

Built-in sentiment analysis for understanding user input and conversation tone:

```bash
./chat-llm.js sentiment "This is amazing!"
```

Returns sentiment classification (positive, negative, neutral) with scores.

### Demo Mode

Test the UI and features without API credentials:

```bash
LLM_DEMO_MODE=1 HTTP_PORT=5000 ./chat-llm.js
```

Demo mode simulates intelligent responses for testing and development.

## Architecture

Chat LLM v2 is built with the following components:

- **Core**: Zero-dependency chat interface
- **Cache**: Automatic response caching (memory + disk)
- **Config**: Settings and profile management
- **Logger**: Request tracking and analytics
- **Monitor**: Performance metrics collection
- **Tools**: Sentiment analysis and utilities
- **Agents**: Multi-purpose agent orchestration
- **Context**: Custom data and knowledge management
- **Prompts**: Advanced template system
- **Memory**: Conversation history and persistence
- **Tasks**: Workflow and batch processing

All components are optional and can be disabled via configuration for minimal resource usage.

## Documentation

### Getting Started
- **[README.md](README.md)** - Overview and quick start guide (this file)
- **[QUICK_START.md](QUICK_START.md)** - Quick reference for v2 features
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Development guide and architecture details

### API & Usage
- **[API_REFERENCE.md](API_REFERENCE.md)** - Complete API documentation for all modules
- **[EXAMPLES.md](EXAMPLES.md)** - Practical examples and real-world use cases

### Planning & Roadmap
- **[ROADMAP.md](ROADMAP.md)** - Current development roadmap and enhancements
- **[FUTURE_FEATURES.md](FUTURE_FEATURES.md)** - Future feature proposals and ideas
- **[RELEASE_NOTES_V2.md](RELEASE_NOTES_V2.md)** - Version 2 release notes

### Testing
- **tests/** - Evaluation tests in multiple languages

## Code Quality & Best Practices

Chat LLM v2 includes comprehensive improvements:

### Input Validation
All public APIs validate inputs with descriptive error messages:
```javascript
// Example: Type checking and validation
if (typeof text !== 'string' || text.trim().length === 0) {
  throw new TypeError('Text must be a non-empty string');
}
```

### Memory Management
Automatic limits prevent memory overflow:
- Request Logger: 10,000 in-memory logs
- Response Cache: 1,000 memory entries
- Performance Monitor: Configurable limit (default: 10,000)

### Error Handling
All modules include comprehensive error handling:
```javascript
try {
  const result = await operation();
  logger.logRequest('operation', input, result, duration);
} catch (error) {
  logger.logRequest('operation', input, error.message, duration, { error: true });
  throw error;
}
```

### Performance Monitoring
Built-in metrics tracking:
- P95/P99 latency percentiles
- Cache hit rates
- Memory usage monitoring
- Operation statistics

## Contributing

Contributions are welcome! Please:

1. Read the [DEVELOPMENT.md](DEVELOPMENT.md) guide
2. Review [FUTURE_FEATURES.md](FUTURE_FEATURES.md) for feature ideas
3. Check existing issues and PRs
4. Follow the code quality standards
5. Add tests for new features
6. Update documentation

## Community & Support

- **Issues**: Report bugs or request features on GitHub
- **Discussions**: Share ideas and ask questions
- **Examples**: Check [EXAMPLES.md](EXAMPLES.md) for common patterns
- **API Docs**: See [API_REFERENCE.md](API_REFERENCE.md) for detailed API info

## License

See [LICENSE](LICENSE) file for details.

## Acknowledgments

Chat LLM v2 is built with zero external dependencies, leveraging only Node.js built-in modules for maximum portability and minimal overhead.

---

**Version**: 2.0.0  
**Last Updated**: December 8, 2025  
**Maintainer**: yonikashi432
