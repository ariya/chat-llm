# Chat LLM

**Chat LLM** is a simple, zero-dependency tool to chat with an LLM (large language model). It works seamlessly with both cloud-based LLM services (e.g., [OpenAI GPT](https://platform.openai.com/docs), [Groq](https://groq.com), [OpenRouter](https://openrouter.ai)) and locally hosted LLMs (e.g. [llama.cpp](https://github.com/ggerganov/llama.cpp), [LM Studio](https://lmstudio.ai), [Ollama](https://ollama.com)).

Chat LLM is accessible via the terminal or through its minimalist web interface.

<img src="chat-llm.png" alt="Chat LLM" width="50%" height="50%"/>

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

## Multi-language Support

Chat LLM is capable of conversing in multiple languages beyond English. It consistently responds in the same language as the question posed. Additionally, it supports seamless language switching between queries, as illustrated in the following example:

```
>> Which planet in our solar system is the largest?
Jupiter is the largest planet in our solar system.

>> ¿Y el más caliente?
Venus es el planeta más caliente, con hasta 475 grados Celsius.
```

The continuous integration workflows for Chat LLM include evaluation tests in English, Spanish, German, French, Italian, and Indonesian.

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
export LLM_CHAT_MODEL="gpt-4.1-nano"
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
