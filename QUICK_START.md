# Chat LLM v2 - Quick Reference Guide

## Overview

Chat LLM v2 is a Swiss Army Knife for LLM tasks, providing a comprehensive platform for agent delegation, context management, memory handling, and workflow orchestration.

## Quick Start

```bash
# Interactive mode
./chat-llm.js

# Web interface
HTTP_PORT=5000 ./chat-llm.js

# View help
./chat-llm.js --help
```

## Agent System

### List and Activate Agents

```bash
# View all agents
./chat-llm.js agent-list

# Activate an agent
./chat-llm.js agent-activate coder

# View agent statistics
./chat-llm.js agent-stats
```

### Available Agents

| ID | Name | Best For |
|---|---|---|
| `researcher` | Research Agent | Information gathering, synthesis, analysis |
| `coder` | Code Agent | Programming, debugging, optimization |
| `writer` | Content Agent | Writing, editing, storytelling |
| `analyst` | Analysis Agent | Data analysis, patterns, insights |
| `tutor` | Tutor Agent | Teaching, explanations, exercises |
| `solver` | Problem Solver | Structured problem-solving |
| `support` | Support Agent | Customer service, empathy |

## Context Management

### Create and Manage Contexts

```bash
# Create new context
./chat-llm.js context-create my-project

# List all contexts
./chat-llm.js context-list

# Activate a context
./chat-llm.js context-activate my-project

# View context statistics
./chat-llm.js context-stats
```

### Programmatic Usage

```javascript
const { ContextManager } = require('./tools/context-manager');
const context = new ContextManager('./context-data');

// Create context
context.createContext('research', {}, { topic: 'AI' });

// Add documents
context.addDocument('research', 'paper1.txt', paperContent);

// Add tags
context.addTags('research', ['ai', 'ml', 'research']);

// Search contexts
const results = context.searchByTags(['ai']);

// Export context
const json = context.exportContext('research', 'json');
```

## Prompt Management

### Using Prompt Templates

```bash
# List all templates
./chat-llm.js prompt-list

# View template
./chat-llm.js prompt-render analysis

# Render template with variables
./chat-llm.js prompt-run analysis data="Revenue dropped 10%" focus="root-cause" recommendations="yes"
```

### Programmatic Usage

```javascript
const { PromptManager } = require('./tools/prompt-manager');
const prompts = new PromptManager();

// Render template with variables
const prompt = prompts.render('code-review', {
  language: 'javascript',
  code: 'const x = 1;',
  context: 'API module'
});

// Set global variables
prompts.setVariable('team_name', 'Platform');

// Create custom template
prompts.createTemplate('custom-analysis', 'Custom Analysis', 
  'Analyze {data} focusing on {focus}',
  ['data', 'focus'],
  ['analysis']
);
```

### Built-in Templates

1. **analysis** - Data analysis and pattern identification
2. **code-review** - Code evaluation and suggestions
3. **writing** - Content creation across formats
4. **problem-solving** - Structured problem resolution
5. **translation** - Multi-language translation
6. **research** - Comprehensive research summaries
7. **brainstorm** - Creative ideation sessions

## Memory Management

### Manage Conversations

```bash
# List conversations
./chat-llm.js memory-list

# View memory statistics
./chat-llm.js memory-stats
```

Interactive CLI sessions and the minimalist web UI automatically persist into the Memory Manager, so running `memory-list` after a chat will show the transcript even after restarting the process. Cache hits are also written to memory so you can audit an entire workflow run.

### Programmatic Usage

```javascript
const { MemoryManager } = require('./tools/memory-manager');
const memory = new MemoryManager('./memory');

// Create conversation
memory.createConversation('chat-1', { user: 'alice' });

// Add messages
memory.addMessage('chat-1', 'user', 'Hello!');
memory.addMessage('chat-1', 'assistant', 'Hi there!');

// Get history
const history = memory.getHistory('chat-1', 50);

// Export conversation
const text = memory.exportConversation('chat-1', 'text');

// Add to long-term memory
memory.addToLongTermMemory('fact-1', 'Important information');
memory.retrieveFromLongTermMemory('fact-1');
```

## Task Management

### Manage Tasks and Workflows

```bash
# List all tasks
./chat-llm.js task-list

# View task statistics
./chat-llm.js task-stats
```

### Programmatic Usage

```javascript
const { TaskManager } = require('./tools/task-manager');
const tasks = new TaskManager();

// Create task
const task = tasks.createTask({
  name: 'Analyze Data',
  type: 'analysis',
  input: { file: 'data.json' },
  priority: 'high'
});

// Queue task
tasks.queueTask(task.id);

// Get next task
const nextTask = tasks.getNextTask();

// Complete task
tasks.completeTask(nextTask.id, { result: 'data analysis' });

// Create workflow
const workflow = tasks.createWorkflow({
  name: 'Analysis Pipeline',
  parallel: false,
  steps: [
    { taskId: task1.id },
    { taskId: task2.id }
  ]
});

// Execute workflow
tasks.executeWorkflow(workflow.id);
```

## Analysis & Logging

### Sentiment Analysis

```bash
# Analyze sentiment
./chat-llm.js sentiment "This is amazing!"
```

Output:
```json
{
  "sentiment": "positive",
  "score": 1
}
```

### View Statistics

```bash
# Request statistics
./chat-llm.js stats

# Export logs
./chat-llm.js export json > logs.json
./chat-llm.js export csv > logs.csv
```

## Cache Management

### Manage Response Cache

```bash
# View cache statistics
./chat-llm.js cache-stats

# Clear cache
./chat-llm.js cache-clear
```

## Configuration

### Manage Configuration

```bash
# Get configuration value
./chat-llm.js config-get caching.enabled

# Set configuration value
./chat-llm.js config-set caching.enabled true

# List profiles
./chat-llm.js config-list
```

## Environment Variables

```bash
# LLM Configuration
LLM_API_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-...
LLM_CHAT_MODEL=gpt-5-nano

# Behavior
LLM_STREAMING=yes               # Enable streaming
LLM_FORCE_REASONING=no          # Force reasoning mode
LLM_DEMO_MODE=no                # Demo mode (no API calls)
LLM_DEBUG=no                    # Debug output

# Server
HTTP_PORT=5000                  # Enable web server
```

## Advanced Workflows

### Complete Analysis Pipeline

```javascript
// Setup agents and context
agents.activateAgent('analyst');
context.createContext('analysis');
context.addDocument('analysis', 'data.json', dataContent);

// Create analysis task
const task = tasks.createTask({
  name: 'Full Analysis',
  type: 'analysis',
  input: { context: 'analysis' },
  priority: 'high'
});

// Queue and execute
tasks.queueTask(task.id);
const nextTask = tasks.getNextTask();
const result = await performAnalysis(nextTask);
tasks.completeTask(nextTask.id, result);

// Store in memory
memory.createConversation('analysis-session');
memory.addMessage('analysis-session', 'assistant', JSON.stringify(result));

// Log and export
logger.logRequest('analysis', dataContent, JSON.stringify(result), duration);
```

### Multi-Agent Collaboration

```javascript
// Route to specialized agents
const researcher = agents.getAgent('researcher');
const coder = agents.getAgent('coder');
const writer = agents.getAgent('writer');

// Use agent-specific prompts
const researchPrompt = prompts.render('research', { topic: 'AI' });
const codePrompt = prompts.render('code-review', { code: sourceCode });
const writePrompt = prompts.render('writing', { content_type: 'article' });

// Create workflow
const workflow = tasks.createWorkflow({
  name: 'Research to Article',
  parallel: false,
  steps: [
    { taskId: createResearchTask(researchPrompt) },
    { taskId: createCodeReviewTask(codePrompt) },
    { taskId: createWriteTask(writePrompt) }
  ]
});

tasks.executeWorkflow(workflow.id);
```

### Batch Processing with Memory

```javascript
// Create batch of tasks
const batchConfigs = documents.map(doc => ({
  name: `Process ${doc.name}`,
  type: 'processing',
  input: { document: doc }
}));

const batchTasks = tasks.batchCreateTasks(batchConfigs);
const taskIds = batchTasks.map(t => t.id);

// Queue all tasks
tasks.batchQueueTasks(taskIds);

// Process with memory persistence
const convId = `batch-${Date.now()}`;
memory.createConversation(convId);

for (const taskId of taskIds) {
  const task = tasks.getTask(taskId);
  const result = await processTask(task);
  tasks.completeTask(taskId, result);
  
  // Store progress in memory
  memory.addMessage(convId, 'system', `Processed ${task.name}`);
}

// Export results
memory.exportConversation(convId, 'json');
```

## Best Practices

### 1. Context Organization
- Use descriptive context names
- Tag contexts for easy discovery
- Keep related documents in same context
- Use metadata for filtering

### 2. Agent Selection
- Match agent to task type
- Check agent capabilities
- Monitor agent performance
- Use custom agents for specialized tasks

### 3. Prompt Engineering
- Use templates for consistency
- Test variables and conditionals
- Leverage conditional blocks
- Create custom templates for workflows

### 4. Memory Management
- Create separate conversations per session
- Export important conversations
- Use long-term memory for knowledge
- Clean up completed conversations

### 5. Task Management
- Set appropriate priorities
- Use meaningful task names
- Monitor queue statistics
- Handle task failures gracefully

### 6. Performance
- Monitor cache hit rates
- Clean cache periodically
- Export old logs regularly
- Archive completed conversations

## Troubleshooting

### Agent Not Found
```bash
./chat-llm.js agent-list  # Check available agents
./chat-llm.js agent-activate correct-id
```

### Context Issues
```bash
./chat-llm.js context-list     # List contexts
./chat-llm.js context-stats    # Check storage
```

### Task Queue Problems
```bash
./chat-llm.js task-stats       # Check queue status
./chat-llm.js task-list        # List all tasks
```

### Memory Issues
```bash
./chat-llm.js memory-stats     # Memory usage
# Review ./memory/*.json files manually
```

## Integration with External Systems

### With Node.js Applications

```javascript
const ChatLLM = require('./chat-llm');
const agents = require('./tools/agent-manager');
const context = require('./tools/context-manager');

// Use managers directly
const agent = agents.activateAgent('researcher');
const ctx = context.createContext('integration-test');
```

### With REST APIs

```bash
# Future: HTTP API endpoint
HTTP_PORT=3000 ./chat-llm.js

# Will expose:
# POST /api/chat - Chat endpoint
# GET /api/agents - List agents
# GET /api/tasks - Task management
# etc.
```

## Support and Updates

For issues, feature requests, or contributions:
- Check DEVELOPMENT.md for architecture details
- Review existing agents and templates
- Create custom modules as needed
- Report bugs on GitHub

---

**Version:** 2.0.0  
**Last Updated:** December 8, 2025  
**Maintainer:** yonikashi432
