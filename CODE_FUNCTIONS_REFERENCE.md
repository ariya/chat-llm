# Chat LLM v2 - Code Functions & Best Practices Reference

**Date**: December 8, 2025  
**Purpose**: Quick reference for key functions, patterns, and best practices  
**Target**: Developers implementing new features or maintaining existing code

---

## 🔧 Core Functions Reference

### 1. Chat Function (Main LLM Interaction)

```javascript
/**
 * Primary function for LLM communication
 * Handles streaming, retries, and error recovery
 * 
 * @param {Array} messages - Message history with roles
 * @param {Function} handler - Optional streaming handler
 * @param {number} attempt - Current retry attempt
 * @param {string} selectedModel - Override model selection
 * @returns {Promise<string>} LLM response
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Streaming support for real-time response
 * - Timeout handling (30s default)
 * - Model-specific configuration
 */
const chat = async (messages, handler, attempt = 1, selectedModel = null) => {
    // Implementation handles:
    // - Message formatting
    // - API authentication
    // - Response streaming
    // - Error recovery
};

// Usage Examples:
// Basic usage
const response = await chat([
    { role: 'user', content: 'Hello' }
]);

// With streaming
await chat(messages, (chunk) => {
    process.stdout.write(chunk);
});

// With model override
await chat(messages, null, 1, 'gpt-4');
```

### 2. Reply Function (Context-Aware Response)

```javascript
/**
 * Generate context-aware replies
 * Includes conversation history and context
 * 
 * @param {Object} context - Execution context
 * @returns {Promise<Object>} Result with answer
 * 
 * Context properties:
 * - inquiry: User question
 * - history: Previous messages
 * - delegates: Streaming options
 */
const reply = async (context) => {
    // Implementation includes:
    // - Context prompt building
    // - History incorporation
    // - Thinking tag processing
    // - Tool code execution
};

// Usage
const result = await reply({
    inquiry: 'What is the capital of France?',
    history: previousMessages,
    delegates: { stream: true }
});

const { answer } = result;
```

### 3. Evaluate Function (Test File Processing)

```javascript
/**
 * Process test files with expected answers
 * Validates LLM responses against patterns
 * 
 * @param {string} filename - Path to test file
 * 
 * Test file format:
 * Story: <Story title>
 * User: <Question>
 * Assistant: /regex pattern/
 * 
 * Features:
 * - Regular expression matching
 * - Multi-turn conversation
 * - Success/failure reporting
 * - Detailed error output
 */
const evaluate = async (filename) => {
    // Reads test file
    // Executes queries
    // Validates answers
    // Reports results
};

// Usage
await evaluate('tests/en/general-knowledge.txt');
```

---

## 📦 Manager Classes Reference

### AgentManager

```javascript
/**
 * Manages specialized agents for different tasks
 */
const agents = new AgentManager();

// List all agents
const allAgents = agents.list();
// Returns: [
//   { id: 'researcher', name: 'Researcher', skills: [...] },
//   { id: 'coder', name: 'Coder', skills: [...] },
//   // ... 5 more
// ]

// Get specific agent
const agent = agents.get('coder');

// Activate agent
agents.activate('coder');

// Get agent stats
const stats = agents.getStats();
// { active: 'coder', totalRequests: 150, avgDuration: 245 }
```

### ContextManager

```javascript
/**
 * Manages isolated execution contexts
 */
const contextManager = new ContextManager('./context-data');

// Create context
const ctx = contextManager.create({
    name: 'user-123',
    tags: ['customer', 'vip'],
    data: { userId: '123' }
});

// Get context
const existing = contextManager.get('user-123');

// Add data to context
ctx.setData('preference', 'detailed-answers');

// Add document
ctx.addDocument('profile.txt', buffer);

// Activate context
contextManager.activate('user-123');

// List all contexts
const all = contextManager.listAll();
```

### MemoryManager

```javascript
/**
 * Manages conversation history
 */
const memory = new MemoryManager('./memory');

// Add conversation
memory.addConversation({
    contextId: 'user-123',
    messages: [{ role: 'user', content: 'Hi' }],
    sentiment: 'positive',
    duration: 500,
    metadata: { userAgent: 'cli' }
});

// Get conversations
const chats = memory.getConversations('user-123');

// Search conversations
const relevant = memory.search('keyword');

// Get stats
const stats = memory.getStats();
// {
//   total: 150,
//   byContext: { 'user-123': 50, ... },
//   avgDuration: 450,
//   sentimentBreakdown: { positive: 60%, negative: 20%, neutral: 20% }
// }

// Clear old conversations
memory.cleanup(30); // Remove > 30 days old
```

### ConfigManager

```javascript
/**
 * Manages configuration with profiles
 */
const config = new ConfigManager('./config');

// Get value
const temp = config.get('models.temperature');

// Set value
config.set('models.temperature', 0.7);

// List all
const all = config.listAll();

// Switch profile
config.switchProfile('development');

// Save changes
config.save();

// Get with defaults
const value = config.get('key', 'defaultValue');
```

### ResponseCache

```javascript
/**
 * Intelligent caching layer
 */
const cache = new ResponseCache('./cache');

// Get cached response
const cached = cache.get('query-key');

// Set cache
cache.set('query-key', response, 3600); // TTL in seconds

// Check existence
if (cache.has('query-key')) {
    // Use cached
}

// Clear cache
cache.clear();

// Get stats
const stats = cache.getStats();
// {
//   size: 15,
//   memory: 102400,
//   diskPath: './cache',
//   hits: 150,
//   misses: 50
// }
```

### RequestLogger

```javascript
/**
 * Analytics and request logging
 */
const logger = new RequestLogger('./logs');

// Log request
logger.logRequest(
    'sentiment',           // type
    'text to analyze',     // input
    JSON.stringify(result),// output
    45                     // duration (ms)
);

// Get stats
const stats = logger.getStats();
// {
//   total: 150,
//   byType: { sentiment: 50, reply: 100 },
//   avgDuration: 245,
//   minDuration: 10,
//   maxDuration: 2500
// }

// Export logs
const json = logger.exportJSON();
const csv = logger.exportCSV();

// Search logs
const recent = logger.search({ hours: 24 });
```

### PerformanceMonitor

```javascript
/**
 * Real-time performance metrics
 */
const performance = new PerformanceMonitor();

// Record metric
performance.record('request', 245); // duration in ms

// Get metrics
const metrics = performance.getMetrics();
// {
//   requests: { total: 150, avg: 245, min: 50, max: 2000 },
//   memory: { heapUsed: 15MB, heapTotal: 33MB },
//   anomalies: [...]
// }

// Detect anomalies
const anomalies = performance.detectAnomalies();

// Get summary
const summary = performance.getSummary();
```

---

## 🎯 Common Patterns

### Pattern 1: Error Handling with Retry

```javascript
async function executeWithRetry(fn, maxAttempts = 3) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (attempt === maxAttempts) {
                throw error; // Last attempt failed
            }
            
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            await sleep(delay);
        }
    }
}

// Usage
const result = await executeWithRetry(async () => {
    return await chat(messages);
});
```

### Pattern 2: Context Isolation

```javascript
async function executeInContext(contextId, fn) {
    try {
        const ctx = contextManager.activate(contextId);
        const result = await fn(ctx);
        return result;
    } finally {
        contextManager.deactivate(contextId);
    }
}

// Usage
const result = await executeInContext('user-123', async (ctx) => {
    return await reply({ inquiry: 'Hi', context: ctx });
});
```

### Pattern 3: Event-Driven Processing

```javascript
// Subscribe to events
eventBus.on('reply:start', (data) => {
    performance.record('reply-start');
});

eventBus.on('reply:complete', (data) => {
    performance.record('reply-complete', data.duration);
    logger.logRequest('reply', data.query, data.answer, data.duration);
});

// Publish events
eventBus.emit('reply:start', { query });
eventBus.emit('reply:complete', { query, answer, duration });
```

### Pattern 4: Caching with Validation

```javascript
async function getCachedOrFetch(key, fetchFn, ttl = 3600) {
    // Try cache first
    const cached = cache.get(key);
    if (cached) return cached;
    
    // Fetch fresh data
    const fresh = await fetchFn();
    
    // Cache result
    cache.set(key, fresh, ttl);
    
    return fresh;
}

// Usage
const result = await getCachedOrFetch(
    'sentiment:text',
    () => analyzeSentiment('text'),
    7200
);
```

---

## ✅ Best Practices

### 1. Always Use Error Boundaries

```javascript
// Good
try {
    const result = await risky();
    return result;
} catch (error) {
    errorHandler.handle(error);
    return fallback();
}

// Bad
const result = await risky(); // No error handling!
```

### 2. Log Strategically

```javascript
// Good - Log important operations
logger.logRequest('operation', input, output, duration);

// Bad - Log everything
console.log('step 1');
console.log('step 2');
```

### 3. Use Context for Isolation

```javascript
// Good - Isolated execution
const ctx = contextManager.create({ name: 'user-123' });
const result = await executeInContext('user-123', handler);

// Bad - Global state
globalUser = '123'; // Can cause race conditions
```

### 4. Cache Appropriate Data

```javascript
// Good - Cache expensive operations
cache.set('sentiment:' + text, result, 3600);

// Bad - Cache everything
cache.set('random:' + Math.random(), value); // Useless!
```

### 5. Monitor Performance

```javascript
// Good - Track important metrics
const start = Date.now();
const result = await operation();
performance.record('operation', Date.now() - start);

// Bad - Ignore performance
const result = await operation(); // No visibility!
```

---

## 🔐 Security Best Practices

### Input Validation

```javascript
function validateQuery(query) {
    // Check type
    if (typeof query !== 'string') {
        throw new Error('Query must be string');
    }
    
    // Check length
    if (query.length > 5000) {
        throw new Error('Query too long');
    }
    
    // Check content
    const maliciousPatterns = [
        /DROP TABLE/i,
        /<script>/i
    ];
    
    if (maliciousPatterns.some(p => p.test(query))) {
        throw new Error('Malicious content detected');
    }
    
    return query.trim();
}
```

### Rate Limiting

```javascript
const limiter = new Map(); // userId -> requests

function checkRateLimit(userId, limit = 60) {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Clean old requests
    const requests = limiter.get(userId) || [];
    const recent = requests.filter(t => t > oneMinuteAgo);
    
    if (recent.length >= limit) {
        throw new Error('Rate limit exceeded');
    }
    
    recent.push(now);
    limiter.set(userId, recent);
}
```

---

## 📊 Debugging Tips

### Enable Debug Mode

```bash
LLM_DEBUG=1 ./chat-llm.js
```

### Check Logs

```bash
# View recent requests
tail -f logs/requests.jsonl

# Export for analysis
./chat-llm.js export json > analysis.json
```

### Monitor Performance

```bash
# Get statistics
./chat-llm.js stats

# Monitor in real-time
watch './chat-llm.js stats'
```

### Test Configuration

```bash
# Get specific config value
./chat-llm.js config-get models.temperature

# List all config
./chat-llm.js config-get
```

---

## 🎓 Code Organization

### Directory Structure

```
tools/
├── *-manager.js      # State management
├── *-analyzer.js     # Data analysis
├── error-handler.js  # Error recovery
├── event-bus.js      # Messaging
└── README.md         # Documentation

config/
├── default.json      # Default settings
├── development.json  # Dev overrides
└── production.json   # Production settings

logs/
├── requests.jsonl    # Request logs
└── errors.jsonl      # Error logs

memory/
└── contexts/         # Conversation data
    ├── user-123.json
    └── user-456.json
```

---

## 📝 Code Review Checklist

Before committing code:

- [ ] Error handling for all paths
- [ ] Proper logging of important operations
- [ ] Performance impact considered
- [ ] Security implications reviewed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] Code follows existing patterns
- [ ] No console.log left in production code

---

## 🚀 Performance Tips

### 1. Use Caching Effectively
```javascript
// Cache frequently accessed data
cache.set('user:' + userId, userData, 3600);
```

### 2. Async/Await Properly
```javascript
// Parallel operations
const [result1, result2] = await Promise.all([
    operation1(),
    operation2()
]);
```

### 3. Stream Large Responses
```javascript
// Don't load everything in memory
await chat(messages, (chunk) => {
    process.stdout.write(chunk);
});
```

### 4. Monitor Memory Usage
```javascript
// Clear old data periodically
memory.cleanup(30); // Remove old conversations
cache.clear();     // Clear cache
```

---

## 📞 Getting Help

1. **Check Documentation**: Review `docs/` folder
2. **Read Similar Code**: Look for similar patterns
3. **Debug Output**: Use `LLM_DEBUG=1`
4. **Check Logs**: Review log files
5. **Test in Isolation**: Use demo mode

---

**Last Updated**: December 8, 2025  
**Maintained By**: Development Team  
**Version**: v2.1.0

---

For more information, see:
- `FEATURE_DEVELOPMENT_GUIDE.md` - Building new features
- `V2_CODE_ENHANCEMENTS.md` - Enhancement roadmap
- `docs/V2_ARCHITECTURE.md` - System design
