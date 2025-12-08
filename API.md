# Chat LLM v2 - API Documentation

## Table of Contents
- [Core Functions](#core-functions)
- [Agent Manager API](#agent-manager-api)
- [Context Manager API](#context-manager-api)
- [Prompt Manager API](#prompt-manager-api)
- [Memory Manager API](#memory-manager-api)
- [Task Manager API](#task-manager-api)
- [Utility APIs](#utility-apis)

---

## Core Functions

### chat(messages, handler, attempt, modelName)

Generates a chat completion using the configured LLM API.

**Parameters:**
- `messages` (Array<Message>): Array of message objects with `role` and `content`
- `handler` (Function, optional): Callback for streaming responses
- `attempt` (Number, optional): Number of retry attempts (default: 3)
- `modelName` (String, optional): Specific model to use

**Returns:** Promise<String> - The generated completion

**Example:**
```javascript
const messages = [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'What is the capital of France?' }
];
const response = await chat(messages);
```

### reply(context)

High-level reply function with caching, history, and tool support.

**Parameters:**
- `context` (Object):
  - `inquiry` (String): User's question
  - `history` (Array): Previous conversation messages
  - `delegates` (Object, optional): Callbacks including `stream` function

**Returns:** Promise<Object> - Response with answer and updated context

**Example:**
```javascript
const context = {
  inquiry: 'What is machine learning?',
  history: [],
  delegates: { stream: (text) => console.log(text) }
};
const response = await reply(context);
```

---

## Agent Manager API

### Constructor

```javascript
const { AgentManager } = require('./tools/agent-manager');
const agents = new AgentManager();
```

### Methods

#### registerAgent(id, config)

Register a custom agent with specific capabilities.

**Parameters:**
- `id` (String): Unique agent identifier
- `config` (Object):
  - `name` (String): Display name
  - `description` (String): Agent description
  - `systemPrompt` (String): System prompt for the agent
  - `capabilities` (Array<String>): List of capabilities

**Example:**
```javascript
agents.registerAgent('translator', {
  name: 'Translation Agent',
  description: 'Translates text between languages',
  systemPrompt: 'You are a professional translator...',
  capabilities: ['translation', 'localization']
});
```

#### activateAgent(id)

Activate an agent for use.

**Parameters:**
- `id` (String): Agent identifier

**Returns:** Object - Activated agent configuration

**Example:**
```javascript
const agent = agents.activateAgent('researcher');
```

#### listAgents()

Get all registered agents.

**Returns:** Array<Object> - List of all agents with their configurations

#### getSystemPrompt(id)

Get the system prompt for a specific agent.

**Parameters:**
- `id` (String): Agent identifier

**Returns:** String - The agent's system prompt

#### updateAgentStats(id, tokensUsed)

Update usage statistics for an agent.

**Parameters:**
- `id` (String): Agent identifier
- `tokensUsed` (Number): Number of tokens used

---

## Context Manager API

### Constructor

```javascript
const { ContextManager } = require('./tools/context-manager');
const context = new ContextManager('./context-data');
```

### Methods

#### createContext(name, documents, metadata)

Create a new context for data organization.

**Parameters:**
- `name` (String): Context name
- `documents` (Object, optional): Initial documents
- `metadata` (Object, optional): Context metadata

**Returns:** Object - Created context

**Example:**
```javascript
const ctx = context.createContext('research-project', {}, {
  topic: 'AI Research'
});
```

#### addDocument(contextName, docId, content, metadata)

Add a document to a context.

**Parameters:**
- `contextName` (String): Target context name
- `docId` (String): Document identifier
- `content` (String): Document content
- `metadata` (Object, optional): Document metadata

**Example:**
```javascript
context.addDocument('research-project', 'paper1', paperContent, {
  author: 'John Doe',
  year: 2025
});
```

#### getDocument(contextName, docId)

Retrieve a specific document.

**Parameters:**
- `contextName` (String): Context name
- `docId` (String): Document identifier

**Returns:** Object - Document with content and metadata

#### listContexts()

List all available contexts.

**Returns:** Array<Object> - List of contexts with statistics

#### activateContext(name)

Set a context as active for operations.

**Parameters:**
- `name` (String): Context name to activate

**Returns:** Object - Activated context

#### addTags(contextName, tags)

Add tags to a context for organization.

**Parameters:**
- `contextName` (String): Context name
- `tags` (Array<String>): Tags to add

#### searchByTags(tags)

Search contexts by tags.

**Parameters:**
- `tags` (Array<String>): Tags to search for

**Returns:** Array<Object> - Matching contexts

#### exportContext(contextName, format)

Export a context in various formats.

**Parameters:**
- `contextName` (String): Context to export
- `format` (String): Export format ('json', 'csv', 'text')

**Returns:** String - Formatted export data

---

## Prompt Manager API

### Constructor

```javascript
const { PromptManager } = require('./tools/prompt-manager');
const prompts = new PromptManager();
```

### Methods

#### render(templateId, variables)

Render a prompt template with variables.

**Parameters:**
- `templateId` (String): Template identifier
- `variables` (Object): Variables to substitute

**Returns:** String - Rendered prompt

**Example:**
```javascript
const prompt = prompts.render('code-review', {
  language: 'Python',
  code: 'def hello():\n    print("Hi")',
  context: 'Web API'
});
```

#### createTemplate(id, name, template, variables, capabilities)

Create a custom prompt template.

**Parameters:**
- `id` (String): Unique template ID
- `name` (String): Template name
- `template` (String): Template text with {variables}
- `variables` (Array<String>): Required variable names
- `capabilities` (Array<String>): Template capabilities

**Example:**
```javascript
prompts.createTemplate(
  'custom-analysis',
  'Custom Data Analysis',
  'Analyze {data} with focus on {focus_area}',
  ['data', 'focus_area'],
  ['analysis']
);
```

#### listTemplates()

Get all available templates.

**Returns:** Array<Object> - List of templates with metadata

#### getTemplate(id)

Retrieve a specific template.

**Parameters:**
- `id` (String): Template identifier

**Returns:** Object - Template configuration

#### setVariable(key, value)

Set a global variable for all templates.

**Parameters:**
- `key` (String): Variable name
- `value` (String): Variable value

---

## Memory Manager API

### Constructor

```javascript
const { MemoryManager } = require('./tools/memory-manager');
const memory = new MemoryManager('./memory');
```

### Methods

#### createConversation(id, metadata)

Create a new conversation.

**Parameters:**
- `id` (String): Unique conversation ID
- `metadata` (Object, optional): Conversation metadata

**Returns:** Object - Created conversation

**Example:**
```javascript
memory.createConversation('session-123', {
  user: 'alice',
  topic: 'Technical Support'
});
```

#### addMessage(conversationId, role, content)

Add a message to a conversation.

**Parameters:**
- `conversationId` (String): Target conversation
- `role` (String): Message role ('user', 'assistant', 'system')
- `content` (String): Message content

**Example:**
```javascript
memory.addMessage('session-123', 'user', 'How do I reset my password?');
memory.addMessage('session-123', 'assistant', 'To reset your password...');
```

#### getHistory(conversationId, limit)

Retrieve conversation history.

**Parameters:**
- `conversationId` (String): Conversation to retrieve
- `limit` (Number, optional): Maximum messages to return

**Returns:** Array<Object> - Messages with role, content, and timestamp

#### listConversations()

List all conversations.

**Returns:** Array<Object> - Conversations with statistics

#### exportConversation(id, format)

Export a conversation.

**Parameters:**
- `id` (String): Conversation ID
- `format` (String): Export format ('json', 'csv', 'text')

**Returns:** String - Formatted conversation data

#### addToLongTermMemory(key, value, metadata)

Store information in long-term memory.

**Parameters:**
- `key` (String): Memory key
- `value` (String): Content to store
- `metadata` (Object, optional): Additional metadata

#### retrieveFromLongTermMemory(key)

Retrieve from long-term memory.

**Parameters:**
- `key` (String): Memory key

**Returns:** Object - Stored value and metadata

---

## Task Manager API

### Constructor

```javascript
const { TaskManager } = require('./tools/task-manager');
const tasks = new TaskManager();
```

### Methods

#### createTask(config)

Create a new task.

**Parameters:**
- `config` (Object):
  - `name` (String): Task name
  - `type` (String): Task type
  - `input` (Object): Task input data
  - `priority` (String, optional): 'high', 'normal', or 'low'

**Returns:** Object - Created task with ID

**Example:**
```javascript
const task = tasks.createTask({
  name: 'Process Data',
  type: 'processing',
  input: { file: 'data.json' },
  priority: 'high'
});
```

#### queueTask(taskId)

Add a task to the processing queue.

**Parameters:**
- `taskId` (String): Task to queue

#### getNextTask()

Get the next task from the queue (highest priority first).

**Returns:** Object - Next task to process, or null if queue is empty

#### completeTask(taskId, result)

Mark a task as completed.

**Parameters:**
- `taskId` (String): Task to complete
- `result` (Object): Task result data

#### failTask(taskId, error)

Mark a task as failed.

**Parameters:**
- `taskId` (String): Failed task
- `error` (String): Error description

#### createWorkflow(config)

Create a multi-step workflow.

**Parameters:**
- `config` (Object):
  - `name` (String): Workflow name
  - `parallel` (Boolean): Execute steps in parallel
  - `steps` (Array<Object>): Workflow steps with taskIds

**Returns:** Object - Created workflow

**Example:**
```javascript
const workflow = tasks.createWorkflow({
  name: 'Data Pipeline',
  parallel: false,
  steps: [
    { taskId: task1.id },
    { taskId: task2.id },
    { taskId: task3.id }
  ]
});
```

#### executeWorkflow(workflowId)

Execute a workflow.

**Parameters:**
- `workflowId` (String): Workflow to execute

**Returns:** Promise<Object> - Workflow execution result

#### batchCreateTasks(configs)

Create multiple tasks at once.

**Parameters:**
- `configs` (Array<Object>): Array of task configurations

**Returns:** Array<Object> - Created tasks

#### getQueueStats()

Get queue statistics.

**Returns:** Object - Statistics including total, queued, pending, running, completed

---

## Utility APIs

### Sentiment Analyzer

```javascript
const { analyzeSentiment } = require('./tools/sentiment_analyzer');
```

#### analyzeSentiment(text)

Analyze the sentiment of text.

**Parameters:**
- `text` (String): Text to analyze

**Returns:** Object - Sentiment result with `sentiment` ('positive', 'negative', 'neutral') and `score`

**Example:**
```javascript
const result = analyzeSentiment('This is amazing!');
// { sentiment: 'positive', score: 1 }
```

### Request Logger

```javascript
const { RequestLogger } = require('./tools/request-logger');
const logger = new RequestLogger('./logs');
```

#### logRequest(operation, input, output, duration, metadata)

Log an API request.

**Parameters:**
- `operation` (String): Operation type
- `input` (String): Request input
- `output` (String): Response output
- `duration` (Number): Duration in milliseconds
- `metadata` (Object, optional): Additional metadata

#### getStats()

Get logging statistics.

**Returns:** Object - Request counts, average duration, etc.

#### exportLogs(format)

Export logs in various formats.

**Parameters:**
- `format` (String): 'json' or 'csv'

**Returns:** String - Formatted log data

### Response Cache

```javascript
const { ResponseCache } = require('./tools/response-cache');
const cache = new ResponseCache('./cache');
```

#### get(key)

Retrieve cached response.

**Parameters:**
- `key` (String): Cache key

**Returns:** String|null - Cached response or null

#### set(key, value, ttl)

Store a response in cache.

**Parameters:**
- `key` (String): Cache key
- `value` (String): Response to cache
- `ttl` (Number, optional): Time-to-live in milliseconds

#### getStats()

Get cache statistics.

**Returns:** Object - Hit rate, size, entry count

#### clear()

Clear all cached responses.

### Config Manager

```javascript
const { ConfigManager } = require('./tools/config-manager');
const config = new ConfigManager('./config');
```

#### get(key, defaultValue)

Get configuration value.

**Parameters:**
- `key` (String): Configuration key (dotted notation supported)
- `defaultValue` (Any, optional): Default if key not found

**Returns:** Any - Configuration value

**Example:**
```javascript
const cachingEnabled = config.get('caching.enabled', true);
const temperature = config.get('models.temperature', 0.7);
```

#### set(key, value)

Set configuration value.

**Parameters:**
- `key` (String): Configuration key
- `value` (Any): Value to set

**Example:**
```javascript
config.set('caching.ttl', 3600000);
config.set('models.temperature', 0.8);
```

#### listProfiles()

List all configuration profiles.

**Returns:** Array<String> - Available profile names

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LLM_API_BASE_URL` | LLM API base URL | `https://api.openai.com/v1` |
| `LLM_API_KEY` | API authentication key | (none) |
| `LLM_CHAT_MODEL` | Model to use | `gpt-5-nano` |
| `LLM_STREAMING` | Enable streaming responses | `yes` |
| `LLM_FORCE_REASONING` | Use reasoning mode | `no` |
| `LLM_DEMO_MODE` | Demo mode without API | `no` |
| `LLM_DEBUG` | Enable debug output | `no` |
| `HTTP_PORT` | Web server port | (disabled) |

---

## Error Handling

All API methods throw errors for invalid inputs or failed operations. Wrap calls in try-catch blocks:

```javascript
try {
  const agent = agents.activateAgent('unknown');
} catch (error) {
  console.error('Agent activation failed:', error.message);
}
```

Common error types:
- **NotFoundError**: Resource doesn't exist
- **ValidationError**: Invalid input parameters
- **APIError**: LLM API request failed
- **TimeoutError**: Request exceeded timeout

---

## Best Practices

### 1. Resource Management
- Always close/cleanup resources when done
- Use try-finally for guaranteed cleanup
- Monitor memory usage with stats APIs

### 2. Error Recovery
- Implement retry logic for transient failures
- Provide fallback responses in demo mode
- Log errors for debugging

### 3. Performance
- Use caching for repeated queries
- Batch operations when possible
- Monitor response times with logger

### 4. Security
- Never commit API keys to source control
- Validate all user inputs
- Sanitize outputs before display

---

**Version:** 2.0.0  
**Last Updated:** December 8, 2025
