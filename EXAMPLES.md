# Chat LLM v2 - Practical Examples & Use Cases

This document provides practical examples and real-world use cases for Chat LLM v2.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Agent System Examples](#agent-system-examples)
- [Context Management Examples](#context-management-examples)
- [Caching Strategies](#caching-strategies)
- [Performance Monitoring](#performance-monitoring)
- [Advanced Workflows](#advanced-workflows)
- [Integration Patterns](#integration-patterns)
- [Production Use Cases](#production-use-cases)

---

## Basic Usage

### Simple Chat Interaction

```bash
# Interactive mode
./chat-llm.js

# Single query
echo "What are the benefits of renewable energy?" | ./chat-llm.js

# Web interface
HTTP_PORT=3000 ./chat-llm.js
# Navigate to http://localhost:3000
```

### Using Environment Variables

```bash
# OpenAI
export LLM_API_BASE_URL=https://api.openai.com/v1
export LLM_API_KEY=sk-...
export LLM_CHAT_MODEL=gpt-4

# Groq (Fast)
export LLM_API_BASE_URL=https://api.groq.com/openai/v1
export LLM_API_KEY=gsk_...
export LLM_CHAT_MODEL=llama-3.1-8b-instant

# Local (llama.cpp)
export LLM_API_BASE_URL=http://127.0.0.1:8080/v1
export LLM_CHAT_MODEL=llama3.2

./chat-llm.js
```

---

## Agent System Examples

### Research Task

```bash
# Activate research agent for comprehensive analysis
./chat-llm.js agent-activate researcher

# Ask complex research question
echo "What are the latest developments in quantum computing?" | ./chat-llm.js
```

### Code Review

```bash
# Activate coder agent
./chat-llm.js agent-activate coder

# Review code
cat myfile.js | ./chat-llm.js
```

### Content Writing

```bash
# Activate writer agent
./chat-llm.js agent-activate writer

# Generate blog post
echo "Write a blog post about sustainable agriculture" | ./chat-llm.js
```

### Programmatic Agent Usage

```javascript
const { AgentManager } = require('./tools/agent-manager');

const agents = new AgentManager();

// Activate agent
agents.activateAgent('analyst');

// Get system prompt
const prompt = agents.getSystemPrompt('analyst');

// Use in chat
const messages = [
  { role: 'system', content: prompt },
  { role: 'user', content: 'Analyze this data...' }
];

// Track usage
agents.updateAgentStats('analyst', 500);

// View statistics
const stats = agents.getStats('analyst');
console.log(stats);
```

---

## Context Management Examples

### Knowledge Base for Customer Support

```javascript
const { ContextManager } = require('./tools/context-manager');

const context = new ContextManager('./kb');

// Create knowledge base context
context.createContext('customer-support', {}, { category: 'support' });

// Add FAQ documents
context.addDocument('customer-support', 'refund-policy.txt', 
  `Refund Policy: We offer 30-day money-back guarantee...`
);

context.addDocument('customer-support', 'shipping-info.txt',
  `Shipping: We ship worldwide within 3-5 business days...`
);

// Tag for organization
context.addTags('customer-support', ['faq', 'policies', 'support']);

// Retrieve for LLM context
const docs = context.getAllDocuments('customer-support');
const contextText = docs.map(d => d.content).join('\n\n');

// Use in prompt
const systemPrompt = `You are a customer support agent. Use this knowledge base:

${contextText}

Answer customer questions based on the information above.`;
```

### Project Documentation Context

```bash
# Create context for project
./chat-llm.js context-create my-project

# Programmatically add docs
```

```javascript
const fs = require('fs');
const context = new ContextManager('./context-data');

// Add all markdown files from docs directory
const docs = fs.readdirSync('./docs')
  .filter(f => f.endsWith('.md'));

docs.forEach(file => {
  const content = fs.readFileSync(`./docs/${file}`, 'utf-8');
  context.addDocument('my-project', file, content);
});

context.addTags('my-project', ['documentation', 'internal']);

// Export for sharing
const exported = context.exportContext('my-project', 'json');
fs.writeFileSync('project-context.json', exported);
```

---

## Caching Strategies

### Development Mode (Short TTL)

```javascript
const { ResponseCache } = require('./tools/response-cache');

// 5-minute cache for development
const cache = new ResponseCache('./cache', 5 * 60 * 1000);

cache.set('test query', 'test response');

// Check stats frequently
setInterval(() => {
  const stats = cache.getStats();
  console.log(`Hit rate: ${stats.hitRate}`);
}, 60000);
```

### Production Mode (Long TTL with Cleanup)

```javascript
// 24-hour cache for production
const cache = new ResponseCache('./cache', 24 * 60 * 60 * 1000);

// Cleanup expired entries daily
setInterval(() => {
  const removed = cache.cleanup();
  console.log(`Cleaned up ${removed} expired cache entries`);
}, 24 * 60 * 60 * 1000);

// Monitor cache size
const stats = cache.getStats();
if (stats.diskCacheSize > 1024 * 1024 * 100) { // 100 MB
  console.warn('Cache size exceeding 100MB');
  cache.clear(); // Reset cache
}
```

### Selective Caching

```javascript
const cache = new ResponseCache('./cache');

async function chat(query, options = {}) {
  // Don't cache if explicitly disabled
  if (options.noCache) {
    return await callLLM(query);
  }
  
  // Check cache
  let response = cache.get(query);
  
  if (!response) {
    response = await callLLM(query);
    
    // Only cache successful responses
    if (response && !response.error) {
      cache.set(query, response);
    }
  }
  
  return response;
}
```

---

## Performance Monitoring

### Real-Time Performance Dashboard

```javascript
const { PerformanceMonitor } = require('./tools/performance-monitor');
const monitor = new PerformanceMonitor();

// Middleware for all operations
async function timedOperation(name, fn) {
  const start = Date.now();
  try {
    const result = await fn();
    monitor.record(name, Date.now() - start, { success: true });
    return result;
  } catch (error) {
    monitor.record(name, Date.now() - start, { 
      success: false, 
      error: error.message 
    });
    throw error;
  }
}

// Usage
await timedOperation('llm_call', () => callLLM(query));
await timedOperation('cache_lookup', () => cache.get(query));
await timedOperation('db_query', () => db.query(sql));

// Display stats every minute
setInterval(() => {
  const stats = monitor.getOverallStats();
  console.clear();
  console.log('=== Performance Dashboard ===');
  console.log(`Uptime: ${stats.uptimeFormatted}`);
  console.log(`Total Operations: ${stats.totalMetrics}`);
  console.log('');
  
  Object.entries(stats.operations).forEach(([op, data]) => {
    console.log(`${op}:`);
    console.log(`  Count: ${data.count}`);
    console.log(`  Avg: ${data.avgTime}ms`);
    console.log(`  P95: ${data.p95Time}ms`);
  });
}, 60000);
```

### SLA Monitoring

```javascript
// Monitor and alert on SLA violations
function checkSLA(monitor) {
  const stats = monitor.getStats('api_call');
  
  if (!stats) return;
  
  // SLA: P95 latency < 2000ms
  if (stats.p95Time > 2000) {
    console.error(`⚠️  SLA VIOLATION: P95 latency ${stats.p95Time}ms > 2000ms`);
    // Send alert (email, Slack, etc.)
  }
  
  // SLA: Error rate < 1%
  const errorRate = stats.errors / stats.count;
  if (errorRate > 0.01) {
    console.error(`⚠️  SLA VIOLATION: Error rate ${(errorRate * 100).toFixed(2)}%`);
  }
}

setInterval(() => checkSLA(monitor), 5 * 60 * 1000);
```

---

## Advanced Workflows

### Multi-Step Research Pipeline

```javascript
const { AgentManager } = require('./tools/agent-manager');
const { ContextManager } = require('./tools/context-manager');
const { TaskManager } = require('./tools/task-manager');

async function researchPipeline(topic) {
  const agents = new AgentManager();
  const context = new ContextManager('./research');
  const tasks = new TaskManager();
  
  // Step 1: Research agent gathers information
  const researchTask = tasks.createTask({
    name: `Research: ${topic}`,
    type: 'research',
    input: { topic },
    priority: 'high'
  });
  
  tasks.queueTask(researchTask.id);
  const researchResult = await executeTask(researchTask, 'researcher');
  
  // Store research in context
  context.createContext(`research-${Date.now()}`);
  context.addDocument(`research-${Date.now()}`, 'findings.txt', researchResult);
  
  // Step 2: Analyst reviews findings
  const analysisTask = tasks.createTask({
    name: `Analyze: ${topic}`,
    type: 'analysis',
    input: { research: researchResult }
  });
  
  tasks.queueTask(analysisTask.id);
  const analysisResult = await executeTask(analysisTask, 'analyst');
  
  // Step 3: Writer creates report
  const writeTask = tasks.createTask({
    name: `Write report: ${topic}`,
    type: 'writing',
    input: { 
      research: researchResult,
      analysis: analysisResult
    }
  });
  
  tasks.queueTask(writeTask.id);
  const reportResult = await executeTask(writeTask, 'writer');
  
  return {
    research: researchResult,
    analysis: analysisResult,
    report: reportResult
  };
}

// Execute
async function executeTask(task, agentId) {
  const agents = new AgentManager();
  agents.activateAgent(agentId);
  const prompt = agents.getSystemPrompt(agentId);
  
  // Call LLM with agent prompt
  const result = await chat([
    { role: 'system', content: prompt },
    { role: 'user', content: JSON.stringify(task.input) }
  ]);
  
  return result;
}

// Run pipeline
researchPipeline('Impact of AI on healthcare')
  .then(results => {
    console.log('Research Pipeline Complete!');
    console.log('Report:', results.report);
  });
```

### Batch Processing with Progress Tracking

```javascript
const { TaskManager } = require('./tools/task-manager');
const { PerformanceMonitor } = require('./tools/performance-monitor');

async function batchProcess(items) {
  const tasks = new TaskManager();
  const monitor = new PerformanceMonitor();
  
  // Create tasks for all items
  const taskConfigs = items.map((item, index) => ({
    name: `Process item ${index + 1}`,
    type: 'processing',
    input: { item }
  }));
  
  const created = tasks.batchCreateTasks(taskConfigs);
  const taskIds = created.map(t => t.id);
  
  // Queue all tasks
  tasks.batchQueueTasks(taskIds);
  
  console.log(`Processing ${items.length} items...`);
  
  const results = [];
  let completed = 0;
  
  // Process with progress tracking
  while (completed < items.length) {
    const task = tasks.getNextTask();
    if (!task) break;
    
    const start = Date.now();
    try {
      const result = await processItem(task.input.item);
      results.push(result);
      tasks.completeTask(task.id, result);
      completed++;
      
      monitor.record('batch_process', Date.now() - start, { 
        success: true 
      });
      
      // Progress update
      const percent = ((completed / items.length) * 100).toFixed(1);
      console.log(`Progress: ${completed}/${items.length} (${percent}%)`);
      
    } catch (error) {
      tasks.failTask(task.id, error.message);
      monitor.record('batch_process', Date.now() - start, { 
        success: false,
        error: error.message
      });
    }
  }
  
  // Final stats
  const stats = monitor.getStats('batch_process');
  console.log('\nBatch Processing Complete!');
  console.log(`Total time: ${stats.totalTime}ms`);
  console.log(`Avg time per item: ${stats.avgTime}ms`);
  console.log(`Success rate: ${(completed / items.length * 100).toFixed(1)}%`);
  
  return results;
}
```

---

## Integration Patterns

### Express.js API Server

```javascript
const express = require('express');
const { ResponseCache } = require('./tools/response-cache');
const { RequestLogger } = require('./tools/request-logger');
const { PerformanceMonitor } = require('./tools/performance-monitor');

const app = express();
const cache = new ResponseCache('./cache');
const logger = new RequestLogger('./logs');
const monitor = new PerformanceMonitor();

app.use(express.json());

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const start = Date.now();
  const { message } = req.body;
  
  try {
    // Check cache
    let response = cache.get(message);
    let cached = !!response;
    
    if (!response) {
      response = await callLLM(message);
      cache.set(message, response);
    }
    
    const duration = Date.now() - start;
    
    // Log and monitor
    logger.logRequest('chat', message, response, duration, { cached });
    monitor.record('api_chat', duration, { cached });
    
    res.json({ response, cached, duration });
    
  } catch (error) {
    const duration = Date.now() - start;
    logger.logRequest('chat', message, error.message, duration, { 
      error: true 
    });
    monitor.record('api_chat', duration, { error: true });
    
    res.status(500).json({ error: error.message });
  }
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
  const logStats = logger.getStats();
  const cacheStats = cache.getStats();
  const perfStats = monitor.getOverallStats();
  
  res.json({
    logging: logStats,
    cache: cacheStats,
    performance: perfStats
  });
});

app.listen(3000, () => {
  console.log('API server running on port 3000');
});
```

### Slack Bot Integration

```javascript
const { App } = require('@slack/bolt');
const { ResponseCache } = require('./tools/response-cache');

const cache = new ResponseCache('./cache');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

// Listen for mentions
app.event('app_mention', async ({ event, client }) => {
  const query = event.text.replace(/<@.*?>/g, '').trim();
  
  // Check cache
  let response = cache.get(query);
  
  if (!response) {
    response = await callLLM(query);
    cache.set(query, response);
  }
  
  await client.chat.postMessage({
    channel: event.channel,
    text: response,
    thread_ts: event.ts
  });
});

app.start(3000);
```

---

## Production Use Cases

### Customer Support Chatbot

```javascript
// Complete customer support system
const { AgentManager } = require('./tools/agent-manager');
const { ContextManager } = require('./tools/context-manager');
const { analyzeSentiment } = require('./tools/sentiment_analyzer');

class SupportBot {
  constructor() {
    this.agents = new AgentManager();
    this.context = new ContextManager('./kb');
    this.setupKnowledgeBase();
  }
  
  setupKnowledgeBase() {
    this.context.createContext('support-kb');
    // Add FAQs, policies, etc.
  }
  
  async handleQuery(userQuery, userId) {
    // Analyze sentiment
    const sentiment = analyzeSentiment(userQuery);
    
    // Escalate if negative
    if (sentiment.sentiment === 'negative' && sentiment.score > 2) {
      return this.escalateToHuman(userQuery, userId);
    }
    
    // Get KB context
    const kb = this.context.getAllDocuments('support-kb')
      .map(d => d.content)
      .join('\n');
    
    // Use support agent
    this.agents.activateAgent('support');
    const prompt = this.agents.getSystemPrompt('support');
    
    // Generate response
    const response = await chat([
      { role: 'system', content: `${prompt}\n\nKnowledge Base:\n${kb}` },
      { role: 'user', content: userQuery }
    ]);
    
    return response;
  }
  
  escalateToHuman(query, userId) {
    // Notify support team
    console.log(`Escalating to human support: ${userId}`);
    return "I've escalated your query to our support team. Someone will assist you shortly.";
  }
}
```

### Content Moderation System

```javascript
const { analyzeSentiment } = require('./tools/sentiment_analyzer');
const { RequestLogger } = require('./tools/request-logger');

class ContentModerator {
  constructor() {
    this.logger = new RequestLogger('./moderation-logs');
  }
  
  async moderate(content, userId) {
    const start = Date.now();
    
    // Sentiment analysis
    const sentiment = analyzeSentiment(content);
    
    // Check for toxic content
    const toxicKeywords = ['spam', 'scam', 'hate', 'abuse'];
    const hasToxic = toxicKeywords.some(word => 
      content.toLowerCase().includes(word)
    );
    
    // LLM-based moderation
    const llmCheck = await this.llmModerate(content);
    
    const result = {
      approved: !hasToxic && llmCheck.safe && sentiment.sentiment !== 'negative',
      sentiment: sentiment,
      toxicity: llmCheck.toxicity,
      reasons: []
    };
    
    if (hasToxic) result.reasons.push('Contains toxic keywords');
    if (!llmCheck.safe) result.reasons.push('Failed LLM safety check');
    if (sentiment.sentiment === 'negative') result.reasons.push('Negative sentiment');
    
    // Log moderation decision
    this.logger.logRequest(
      'moderation',
      content.substring(0, 100),
      JSON.stringify(result),
      Date.now() - start,
      { userId, approved: result.approved }
    );
    
    return result;
  }
  
  async llmModerate(content) {
    // Use LLM for advanced moderation
    const response = await chat([
      { 
        role: 'system', 
        content: 'You are a content moderator. Classify content as safe or unsafe.'
      },
      { role: 'user', content: `Classify: ${content}` }
    ]);
    
    return {
      safe: !response.toLowerCase().includes('unsafe'),
      toxicity: response.includes('toxic') ? 0.8 : 0.2
    };
  }
}
```

---

## Conclusion

These examples demonstrate the flexibility and power of Chat LLM v2 for various use cases. Mix and match components to build sophisticated LLM-powered applications tailored to your needs.

For more information:
- [API Reference](API_REFERENCE.md)
- [Development Guide](DEVELOPMENT.md)
- [Future Features](FUTURE_FEATURES.md)
