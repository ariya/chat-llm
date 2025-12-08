# Chat LLM Examples

This directory contains practical examples demonstrating the features and capabilities of Chat LLM v2.

## Running Examples

All examples can be run directly from the command line:

```bash
# Make examples executable (first time only)
chmod +x examples/*.js

# Run individual examples
node examples/01-basic-chat.js
node examples/02-agent-orchestration.js
node examples/03-context-management.js
node examples/04-task-management.js
```

## Available Examples

### 1. Basic Chat (`01-basic-chat.js`)

Demonstrates fundamental chat functionality:
- Simple question-answer queries
- Using demo mode (no API key needed)
- Piping questions to the CLI
- Translation queries

**Key Learning:**
- How to make basic queries
- Using demo mode for testing
- Command-line integration

### 2. Agent Orchestration (`02-agent-orchestration.js`)

Shows how to work with the agent system:
- Listing available agents
- Activating specific agents
- Registering custom agents
- Tracking agent usage statistics
- Finding agents by capability

**Key Learning:**
- Agent activation and management
- Custom agent registration
- Agent capability system
- Usage tracking

### 3. Context Management (`03-context-management.js`)

Demonstrates data and knowledge base management:
- Creating contexts
- Adding documents with metadata
- Tagging and organization
- Searching by tags
- Retrieving documents
- Exporting contexts

**Key Learning:**
- Context creation and management
- Document organization
- Tag-based search
- Data export

### 4. Task Management (`04-task-management.js`)

Illustrates task queuing and workflow orchestration:
- Creating individual tasks
- Priority-based queuing
- Task completion and failure handling
- Workflow creation (sequential/parallel)
- Batch task operations
- Queue statistics

**Key Learning:**
- Task lifecycle management
- Priority queues
- Workflow orchestration
- Batch processing

## Example Data

Examples create their own data directories:
- `examples/context-data/` - Context storage for example 3

These directories are automatically cleaned up and can be safely deleted.

## Programmatic Usage

All examples can also be imported and used as modules:

```javascript
const { agentExample } = require('./examples/02-agent-orchestration');

async function main() {
  await agentExample();
}

main().catch(console.error);
```

## Environment Setup

Most examples work without configuration. For real API usage:

```bash
# Set API credentials
export LLM_API_BASE_URL=https://api.openai.com/v1
export LLM_API_KEY=your-api-key
export LLM_CHAT_MODEL=gpt-5-nano

# Run examples with real API
node examples/01-basic-chat.js
```

## Demo Mode

To run examples without an API key:

```bash
LLM_DEMO_MODE=1 node examples/01-basic-chat.js
```

## Common Patterns

### Error Handling

```javascript
try {
  const result = await someOperation();
  console.log('Success:', result);
} catch (error) {
  console.error('Error:', error.message);
}
```

### Async Operations

All examples use async/await for clarity:

```javascript
async function example() {
  const result = await asyncOperation();
  return result;
}
```

### Resource Cleanup

Examples automatically clean up resources, but you can manually clean:

```bash
# Remove example data
rm -rf examples/context-data
```

## Extending Examples

Feel free to modify and extend these examples:

1. Copy an example file
2. Modify the code
3. Add your custom logic
4. Run and test

## Tips

- Start with `01-basic-chat.js` for fundamentals
- Use demo mode for testing without API costs
- Check the main documentation for more details
- Combine patterns from multiple examples

## Troubleshooting

### "Cannot find module" Error

Make sure you're in the repository root:
```bash
cd /path/to/chat-llm
node examples/01-basic-chat.js
```

### API Errors

Use demo mode for testing:
```bash
LLM_DEMO_MODE=1 node examples/01-basic-chat.js
```

### Permission Denied

Make files executable:
```bash
chmod +x examples/*.js
```

## Further Reading

- [API Documentation](../API.md)
- [Features Overview](../FEATURES.md)
- [Quick Start Guide](../QUICK_START.md)
- [README](../README.md)

## Contributing

Have an example idea? See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

---

**Version:** 2.0.0  
**Last Updated:** December 8, 2025
