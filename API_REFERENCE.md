# Chat LLM v2 - API Reference

Complete API documentation for Chat LLM v2 modules and components.

## Table of Contents

- [Core Modules](#core-modules)
  - [Sentiment Analyzer](#sentiment-analyzer)
  - [Request Logger](#request-logger)
  - [Response Cache](#response-cache)
  - [Config Manager](#config-manager)
  - [Performance Monitor](#performance-monitor)
- [Agent System](#agent-system)
  - [Agent Manager](#agent-manager)
- [Context System](#context-system)
  - [Context Manager](#context-manager)
- [Prompt System](#prompt-system)
  - [Prompt Manager](#prompt-manager)
- [Memory System](#memory-system)
  - [Memory Manager](#memory-manager)
- [Task System](#task-system)
  - [Task Manager](#task-manager)

---

## Core Modules

### Sentiment Analyzer

Analyzes text sentiment using keyword matching.

#### Usage

```javascript
const { analyzeSentiment } = require('./tools/sentiment_analyzer');

const result = analyzeSentiment("This is amazing!");
console.log(result);
// Output: { 
//   sentiment: 'positive', 
//   score: 1,
//   positiveMatches: 1,
//   negativeMatches: 0 
// }
```

#### API

##### `analyzeSentiment(text)`

Analyzes the sentiment of given text.

**Parameters:**
- `text` (string) - Text to analyze (required, non-empty)

**Returns:**
- Object with properties:
  - `sentiment` (string) - 'positive', 'negative', or 'neutral'
  - `score` (number) - Magnitude of sentiment
  - `positiveMatches` (number) - Count of positive keywords
  - `negativeMatches` (number) - Count of negative keywords

**Throws:**
- `TypeError` - If text is not a string
- `Error` - If text is empty

---

### Request Logger

Tracks and logs all API requests with comprehensive analytics.

#### Usage

```javascript
const { RequestLogger } = require('./tools/request-logger');

const logger = new RequestLogger('./logs');
logger.logRequest('chat', 'Hello', 'Hi there!', 150);

const stats = logger.getStats();
console.log(stats);
```

#### API

##### `new RequestLogger(logDir)`

Creates a new request logger instance.

**Parameters:**
- `logDir` (string) - Directory for log storage (default: './logs')

**Throws:**
- `Error` - If log directory cannot be created

##### `logRequest(type, input, output, duration, metadata)`

Logs a request with metadata.

**Parameters:**
- `type` (string) - Request type (e.g., 'chat', 'sentiment')
- `input` (string) - Input text/query
- `output` (string) - Response/output
- `duration` (number) - Duration in milliseconds
- `metadata` (Object) - Additional metadata (optional)

**Throws:**
- `TypeError` - If parameters are invalid

##### `getStats()`

Returns comprehensive statistics.

**Returns:**
- Object with properties:
  - `totalRequests` (number) - Total logged requests
  - `averageDuration` (number) - Average duration in ms
  - `maxDuration` (number) - Maximum duration
  - `minDuration` (number) - Minimum duration
  - `p95Duration` (number) - 95th percentile
  - `byType` (Object) - Counts by request type
  - `cachedRequests` (number) - Number of cached responses
  - `cacheHitRate` (string) - Cache hit rate percentage

##### `exportJSON()`

Exports logs as JSON string.

**Returns:**
- (string) - JSON formatted logs

##### `exportCSV()`

Exports logs as CSV string.

**Returns:**
- (string) - CSV formatted logs

##### `clearMemory()`

Clears in-memory logs.

##### `getLogCount()`

Returns number of in-memory log entries.

**Returns:**
- (number) - Count of logs

##### `isAtCapacity()`

Checks if at maximum in-memory capacity.

**Returns:**
- (boolean) - True if at capacity

---

### Response Cache

Dual-layer (memory + disk) caching for LLM responses.

#### Usage

```javascript
const { ResponseCache } = require('./tools/response-cache');

const cache = new ResponseCache('./cache');

// Store response
cache.set('What is AI?', 'AI is artificial intelligence...');

// Retrieve response
const response = cache.get('What is AI?');
console.log(response); // Returns cached response

// Get statistics
const stats = cache.getStats();
console.log(stats);
```

#### API

##### `new ResponseCache(cacheDir, ttl)`

Creates a new response cache.

**Parameters:**
- `cacheDir` (string) - Cache directory (default: './cache')
- `ttl` (number) - Time-to-live in ms (default: 24 hours)

**Throws:**
- `Error` - If cache directory cannot be created
- `Error` - If TTL is not positive

##### `get(input)`

Retrieves cached response.

**Parameters:**
- `input` (string) - Input text to look up

**Returns:**
- (string|null) - Cached response or null if not found/expired

##### `set(input, response)`

Stores response in cache.

**Parameters:**
- `input` (string) - Input text (cache key)
- `response` (string) - Response to cache

**Throws:**
- `TypeError` - If parameters are not strings

##### `clear()`

Clears all cached responses.

##### `getStats()`

Returns cache statistics.

**Returns:**
- Object with properties:
  - `memoryCacheSize` (number) - Items in memory
  - `maxMemoryCacheSize` (number) - Maximum memory size
  - `diskCacheFiles` (number) - Files on disk
  - `diskCacheSize` (number) - Total size in bytes
  - `diskCacheSizeFormatted` (string) - Human-readable size
  - `diskCachePath` (string) - Cache directory path
  - `hits` (number) - Cache hits
  - `misses` (number) - Cache misses
  - `hitRate` (string) - Hit rate percentage
  - `ttl` (number) - TTL in milliseconds
  - `ttlFormatted` (string) - Human-readable TTL

##### `cleanup()`

Removes expired cache entries.

**Returns:**
- (number) - Number of entries removed

##### `setTTL(ms)`

Sets cache TTL.

**Parameters:**
- `ms` (number) - TTL in milliseconds

**Throws:**
- `TypeError` - If ms is not positive number

---

### Config Manager

Manages application configuration with profile support.

#### Usage

```javascript
const { ConfigManager } = require('./tools/config-manager');

const config = new ConfigManager('./config');

// Get configuration
const temperature = config.get('models.temperature', 0.7);

// Set configuration
config.set('models.temperature', 0.9);

// Save profile
config.saveProfile('production', { models: { temperature: 0.5 } });

// Load profile
const prodConfig = config.loadProfile('production');
```

#### API

##### `new ConfigManager(configDir)`

Creates configuration manager.

**Parameters:**
- `configDir` (string) - Config directory (default: './config')

**Throws:**
- `Error` - If config directory cannot be created

##### `get(key, defaultValue)`

Gets configuration value using dot notation.

**Parameters:**
- `key` (string) - Config key (e.g., 'models.temperature')
- `defaultValue` (*) - Default value if not found (default: null)

**Returns:**
- (*) - Configuration value or default

**Throws:**
- `TypeError` - If key is not a string

##### `set(key, value)`

Sets configuration value.

**Parameters:**
- `key` (string) - Config key (dot notation)
- `value` (*) - Value to set

**Throws:**
- `TypeError` - If key is not a valid string

##### `saveProfile(name, settings)`

Saves named configuration profile.

**Parameters:**
- `name` (string) - Profile name
- `settings` (Object) - Configuration settings

**Throws:**
- `TypeError` - If parameters are invalid

##### `loadProfile(name)`

Loads configuration profile.

**Parameters:**
- `name` (string) - Profile name

**Returns:**
- (Object|null) - Profile config or null if not found

##### `listProfiles()`

Lists all available profiles.

**Returns:**
- (Array<string>) - Profile names

##### `export()`

Exports current configuration as JSON.

**Returns:**
- (string) - JSON configuration

##### `reset()`

Resets to default configuration.

##### `getAll()`

Gets entire configuration object.

**Returns:**
- (Object) - Complete configuration

##### `applyProfile(name)`

Applies profile to current config.

**Parameters:**
- `name` (string) - Profile name

**Returns:**
- (boolean) - True if successful

---

### Performance Monitor

Tracks application performance metrics.

#### Usage

```javascript
const { PerformanceMonitor } = require('./tools/performance-monitor');

const monitor = new PerformanceMonitor();

// Record metric
const start = Date.now();
// ... perform operation ...
monitor.record('api_call', Date.now() - start, { endpoint: '/chat' });

// Get statistics
const stats = monitor.getStats('api_call');
console.log(`P95 latency: ${stats.p95Time}ms`);

// Get overall stats
const overall = monitor.getOverallStats();
console.log(overall);
```

#### API

##### `new PerformanceMonitor(options)`

Creates performance monitor.

**Parameters:**
- `options` (Object) - Configuration options
  - `maxMetrics` (number) - Maximum metrics to store (default: 10000)

##### `record(operation, duration, metadata)`

Records a performance metric.

**Parameters:**
- `operation` (string) - Operation name
- `duration` (number) - Duration in milliseconds
- `metadata` (Object) - Additional metadata (optional)

**Throws:**
- `TypeError` - If parameters are invalid

##### `getMetricsFor(operation)`

Gets all metrics for an operation.

**Parameters:**
- `operation` (string) - Operation name

**Returns:**
- (Array<Object>) - Metrics array

##### `getStats(operation)`

Calculates statistics for an operation.

**Parameters:**
- `operation` (string) - Operation name

**Returns:**
- (Object|null) - Statistics or null if no metrics

Statistics object includes:
- `count` (number) - Number of operations
- `totalTime` (number) - Total time in ms
- `avgTime` (number) - Average duration
- `minTime` (number) - Minimum duration
- `maxTime` (number) - Maximum duration
- `medianTime` (number) - Median duration
- `p95Time` (number) - 95th percentile
- `p99Time` (number) - 99th percentile

##### `getOverallStats()`

Gets comprehensive application statistics.

**Returns:**
- (Object) - Overall statistics

##### `clear()`

Clears all metrics.

##### `export(includeMetrics)`

Exports metrics as JSON.

**Parameters:**
- `includeMetrics` (boolean) - Include individual metrics (default: true)

**Returns:**
- (string) - JSON export

##### `getMetricsInRange(startTime, endTime)`

Gets metrics within time range.

**Parameters:**
- `startTime` (number) - Start timestamp
- `endTime` (number) - End timestamp

**Returns:**
- (Array<Object>) - Metrics in range

##### `getOperations()`

Gets list of tracked operations.

**Returns:**
- (Array<string>) - Operation names

##### `getSlowestOperations(limit)`

Gets slowest operations.

**Parameters:**
- `limit` (number) - Number of results (default: 10)

**Returns:**
- (Array<Object>) - Slowest metrics

---

## Best Practices

### Error Handling

All modules throw descriptive errors. Always wrap calls in try-catch:

```javascript
try {
  const result = analyzeSentiment(userInput);
  console.log(result);
} catch (error) {
  console.error('Sentiment analysis failed:', error.message);
}
```

### Memory Management

- Request Logger: Automatically limits in-memory logs to 10,000 entries
- Response Cache: Limits memory cache to 1,000 entries
- Performance Monitor: Configurable max metrics (default: 10,000)

### Performance Tips

1. **Caching**: Enable caching for frequently repeated queries
2. **Cleanup**: Periodically run `cache.cleanup()` to remove expired entries
3. **Monitoring**: Use Performance Monitor to identify bottlenecks
4. **Logging**: Export and archive old logs regularly

### Configuration

Store sensitive configuration in environment variables:

```bash
export LLM_API_KEY="your-api-key"
export LLM_CHAT_MODEL="gpt-4"
```

Use config manager for application settings:

```javascript
config.set('caching.enabled', true);
config.set('caching.ttl', 12 * 60 * 60 * 1000); // 12 hours
```

---

## Integration Examples

### Complete Workflow

```javascript
const { analyzeSentiment } = require('./tools/sentiment_analyzer');
const { RequestLogger } = require('./tools/request-logger');
const { ResponseCache } = require('./tools/response-cache');
const { ConfigManager } = require('./tools/config-manager');
const { PerformanceMonitor } = require('./tools/performance-monitor');

// Initialize components
const config = new ConfigManager('./config');
const cache = new ResponseCache('./cache');
const logger = new RequestLogger('./logs');
const monitor = new PerformanceMonitor();

// Process request
async function handleRequest(input) {
  const start = Date.now();
  
  // Check cache
  let response = cache.get(input);
  let cached = !!response;
  
  if (!response) {
    // Simulate API call
    response = await callLLM(input);
    cache.set(input, response);
  }
  
  const duration = Date.now() - start;
  
  // Log request
  logger.logRequest('chat', input, response, duration, { cached });
  
  // Record performance
  monitor.record('chat', duration, { cached });
  
  // Analyze sentiment
  const sentiment = analyzeSentiment(response);
  
  return { response, sentiment, duration, cached };
}
```

### Export and Analysis

```javascript
// Export logs for analysis
const logsJSON = logger.exportJSON();
fs.writeFileSync('logs.json', logsJSON);

const logsCSV = logger.exportCSV();
fs.writeFileSync('logs.csv', logsCSV);

// Export performance metrics
const perfMetrics = monitor.export();
fs.writeFileSync('performance.json', perfMetrics);

// Get cache statistics
const cacheStats = cache.getStats();
console.log(`Cache hit rate: ${cacheStats.hitRate}`);
console.log(`Disk usage: ${cacheStats.diskCacheSizeFormatted}`);
```

---

## Version

**API Version:** 2.0.0  
**Last Updated:** December 8, 2025

For more information, see:
- [README.md](README.md) - General overview
- [DEVELOPMENT.md](DEVELOPMENT.md) - Development guide
- [ROADMAP.md](ROADMAP.md) - Future features
