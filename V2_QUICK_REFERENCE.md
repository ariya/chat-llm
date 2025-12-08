# Chat LLM v2.1 - Quick Reference Guide

## All Available Commands

### Workflow Management
```bash
# List all available workflows
./chat-llm.js workflow-list

# Execute a workflow
./chat-llm.js workflow-execute <workflow-id> [json-context]

# Get workflow statistics
./chat-llm.js workflow-stats <workflow-id>

# View execution history
./chat-llm.js workflow-history <workflow-id> [limit]
```

### Agent Management
```bash
# List all agents
./chat-llm.js agent-list

# Activate a specific agent
./chat-llm.js agent-activate <agent-id>

# Get agent statistics
./chat-llm.js agent-stats
```

### Context Management
```bash
# Create new context
./chat-llm.js context-create <context-name>

# List all contexts
./chat-llm.js context-list

# Activate a context
./chat-llm.js context-activate <context-name>

# Get context statistics
./chat-llm.js context-stats
```

### Prompt Management
```bash
# List all prompt templates
./chat-llm.js prompt-list

# Render a template
./chat-llm.js prompt-render <template-id>
```

### Task Management
```bash
# List all tasks
./chat-llm.js task-list

# Get task statistics
./chat-llm.js task-stats
```

### Memory Management
```bash
# List all conversations
./chat-llm.js memory-list

# Get memory statistics
./chat-llm.js memory-stats
```

### Error & Recovery Management
```bash
# View error statistics
./chat-llm.js error-stats

# View error log
./chat-llm.js error-log [limit]

# Check circuit breaker status
./chat-llm.js circuit-status

# Get specific strategy stats
./chat-llm.js error-strategy <strategy-name>
```

### Plugin Management
```bash
# List all plugins
./chat-llm.js plugin-list

# Enable a plugin
./chat-llm.js plugin-enable <plugin-name> [config-json]

# Disable a plugin
./chat-llm.js plugin-disable <plugin-name>

# Get plugin statistics
./chat-llm.js plugin-stats
```

### Event Bus Management
```bash
# View event history
./chat-llm.js event-history [event-type-pattern] [limit]

# View event bus statistics
./chat-llm.js event-stats

# View dead letter queue
./chat-llm.js event-dlq [limit]

# Clear dead letter queue
./chat-llm.js event-dlq-clear
```

### Cache & Performance
```bash
# View cache statistics
./chat-llm.js cache-stats

# Clear all cache
./chat-llm.js cache-clear

# Get performance metrics
./chat-llm.js performance-stats
```

### Configuration
```bash
# Get configuration value
./chat-llm.js config-get <key>

# Set configuration value
./chat-llm.js config-set <key> <value>

# List all profiles
./chat-llm.js config-list
```

### Logging & Analytics
```bash
# Run sentiment analysis
./chat-llm.js sentiment "<text>"

# View request statistics
./chat-llm.js stats

# Export logs
./chat-llm.js export json > logs.json
./chat-llm.js export csv > logs.csv
```

### UI & Server
```bash
# Start web UI (default port 3000)
HTTP_PORT=5000 ./chat-llm.js

# Interactive mode
./chat-llm.js

# Help
./chat-llm.js --help
```

---

## Built-in Workflows

### 1. research-report
Gather research, analyze findings, and generate comprehensive report.
```bash
./chat-llm.js workflow-execute research-report '{"topic":"AI Safety","depth":"comprehensive"}'
```

### 2. code-development
Design, implement, test, and document code.
```bash
./chat-llm.js workflow-execute code-development '{"task":"Build user API","language":"JavaScript"}'
```

### 3. support-escalation
Handle customer issues with escalation path.
```bash
./chat-llm.js workflow-execute support-escalation '{"issue":"Login failed","severity":"high"}'
```

---

## Built-in Agents

- **researcher** - Information gathering and synthesis
- **coder** - Programming and debugging
- **writer** - Content creation and editing
- **analyst** - Data analysis and insights
- **tutor** - Educational content
- **solver** - Problem-solving
- **support** - Customer service

---

## Recovery Strategies

### 1. exponential-backoff
Use for: Network timeouts, temporary failures
```javascript
await errorHandler.executeWithStrategy(fn, 'exponential-backoff', {
  maxRetries: 3,
  initialDelay: 100  // ms
});
```

### 2. linear-backoff
Use for: Resource locks, queued operations
```javascript
await errorHandler.executeWithStrategy(fn, 'linear-backoff', {
  maxRetries: 3,
  delayMs: 1000
});
```

### 3. fallback
Use for: Non-critical operations
```javascript
await errorHandler.executeWithStrategy(fn, 'fallback', {
  fallback: () => defaultValue
});
```

### 4. timeout
Use for: Long-running operations
```javascript
await errorHandler.executeWithStrategy(fn, 'timeout', {
  timeoutMs: 5000
});
```

---

## Event Patterns

### Subscribe to Events
```javascript
// Exact match
eventBus.subscribe('task:complete', handler);

// Wildcard patterns
eventBus.subscribe('task:*', handler);        // All task events
eventBus.subscribe('*:error', handler);       // All errors
eventBus.subscribe('*', handler);             // Everything
```

### Publish Events
```javascript
// Single event
await eventBus.publish('task:complete', { taskId: '123' });

// Batch events
await eventBus.emitBatch([
  { type: 'process:start', data: { id: 1 } },
  { type: 'process:progress', data: { id: 1, percent: 50 } },
  { type: 'process:complete', data: { id: 1 } }
]);
```

### Wait for Events
```javascript
const { data } = await eventBus.waitFor('task:done', 5000);
```

---

## Common Workflows

### Workflow: Analyze Multiple Documents
```javascript
workflows.registerWorkflow('batch-analysis', {
  name: 'Batch Analysis',
  steps: [
    { id: 'prep', agent: 'analyst', task: 'Prepare documents' },
    { id: 'analyze', agent: 'analyst', task: 'Analyze each', dependsOn: ['prep'] },
    { id: 'compile', agent: 'writer', task: 'Compile results', dependsOn: ['analyze'] }
  ]
});
```

### Error Handling: Resilient API Calls
```javascript
const breaker = errorHandler.createCircuitBreaker('api-service', {
  failureThreshold: 5,
  timeout: 60000
});

const data = await breaker.execute(() => callAPI());
```

### Plugin: Custom Data Processor
```javascript
plugins.registerPlugin('data-processor', {
  version: '1.0.0',
  description: 'Custom data processing',
  init: (api) => {
    api.registerHook('data:process', async (data) => {
      return processCustomData(data);
    });
  }
});
```

---

## Debugging Commands

```bash
# View what went wrong
./chat-llm.js error-log 20

# Check service health
./chat-llm.js circuit-status

# Trace events
./chat-llm.js event-history "*" 50

# Monitor plugins
./chat-llm.js plugin-stats

# Workflow execution tracking
./chat-llm.js workflow-history research-report 10
```

---

## Environment Variables

```bash
# API Configuration
LLM_API_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=your-key-here
LLM_CHAT_MODEL=gpt-4

# Server Configuration
HTTP_PORT=3000

# Feature Flags
LLM_STREAMING=yes
LLM_DEBUG=false

# Demo Mode (no API key needed)
LLM_DEMO_MODE=1
```

---

## Tips & Tricks

1. **Monitor workflows in real-time**
   ```bash
   while true; do
     ./chat-llm.js workflow-stats research-report
     sleep 5
   done
   ```

2. **Stream events to file**
   ```bash
   ./chat-llm.js event-history "*" 1000 > events.log
   ```

3. **Setup error alerts**
   ```bash
   ./chat-llm.js error-log 10 | grep ERROR
   ```

4. **Export all metrics**
   ```bash
   ./chat-llm.js export json > metrics.json
   ./chat-llm.js config-list >> config_backup.txt
   ./chat-llm.js stats >> usage_stats.txt
   ```

5. **Health check script**
   ```bash
   #!/bin/bash
   ./chat-llm.js circuit-status
   ./chat-llm.js error-log 5
   ./chat-llm.js event-stats
   ```

---

## Status Codes

### Workflow Execution
- `running` - In progress
- `completed` - Successful
- `failed` - Error occurred
- `cancelled` - User cancelled

### Circuit Breaker
- `closed` - Normal operation
- `open` - Service down
- `half-open` - Testing recovery

### Plugin State
- `enabled` - Running
- `disabled` - Not active

---

## Getting Started in 5 Minutes

```bash
# 1. Start the server
HTTP_PORT=5000 ./chat-llm.js

# 2. Check available workflows
./chat-llm.js workflow-list

# 3. Execute a workflow
./chat-llm.js workflow-execute research-report '{"topic":"AI"}'

# 4. Monitor execution
./chat-llm.js workflow-history research-report 1

# 5. View statistics
./chat-llm.js workflow-stats research-report
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Workflow timeout | Increase timeout in workflow definition |
| Circuit breaker open | Check service health, wait for reset |
| Plugin not executing | Verify plugin is enabled with `plugin-list` |
| Events not being processed | Check event pattern matches actual event type |
| Memory leak in long-running | Monitor with `memory-stats` and enable auto-cleanup |

---

Generated for v2.1 • December 8, 2025
