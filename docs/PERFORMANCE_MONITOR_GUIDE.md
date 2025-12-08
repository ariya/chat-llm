# Performance Monitor Module - v2 Documentation

## Overview
The Performance Monitor tracks application metrics including API response times, cache efficiency, error rates, and token usage. It provides real-time insights into system health and performance bottlenecks.

## Features
- ✅ Real-time metrics collection
- ✅ Response time tracking
- ✅ Cache hit/miss analysis
- ✅ Error rate monitoring
- ✅ Token usage tracking
- ✅ Uptime tracking
- ✅ Performance reports (JSON & formatted)

## Metrics Tracked

```javascript
const TRACKED_METRICS = {
    // API Performance
    apiCalls: {
        totalCount: number,
        successCount: number,
        errorCount: number,
        averageTime: number,
        minTime: number,
        maxTime: number,
        p95Time: number,  // 95th percentile
        p99Time: number   // 99th percentile
    },
    
    // Cache Performance
    cache: {
        hits: number,
        misses: number,
        hitRate: percentage,
        averageHitTime: number,
        averageMissTime: number
    },
    
    // Token Usage
    tokens: {
        totalUsed: number,
        prompt: number,
        completion: number,
        averagePerRequest: number
    },
    
    // Error Tracking
    errors: {
        total: number,
        byType: {
            'timeout': number,
            'auth': number,
            'rateLimit': number,
            'other': number
        },
        errorRate: percentage
    },
    
    // System Health
    system: {
        uptime: duration,
        memoryUsage: bytes,
        peakMemory: bytes,
        gcCount: number
    }
};
```

## Code Walkthrough

### Complete Implementation

```javascript
// tools/performance-monitor.js

const fs = require('fs');
const path = require('path');

/**
 * PerformanceMonitor - Track and analyze application metrics
 */
class PerformanceMonitor {
    constructor(metricsDir = './metrics') {
        this.metricsDir = metricsDir;
        this.startTime = Date.now();
        this.startMemory = process.memoryUsage();
        
        // Initialize metric storage
        this.metrics = {
            apiCalls: [],
            cache: {
                hits: 0,
                misses: 0
            },
            tokens: {
                total: 0,
                prompt: 0,
                completion: 0
            },
            errors: [],
            operations: []
        };
        
        this.ensureDirectory();
    }
    
    /**
     * Ensure metrics directory exists
     */
    ensureDirectory() {
        if (!fs.existsSync(this.metricsDir)) {
            fs.mkdirSync(this.metricsDir, { recursive: true });
        }
    }
    
    /**
     * Record API call metrics
     * @param {number} duration - Call duration in milliseconds
     * @param {boolean} success - Whether call succeeded
     * @param {object} metadata - Additional data (model, tokens, etc)
     */
    recordAPICall(duration, success = true, metadata = {}) {
        const entry = {
            timestamp: Date.now(),
            duration,
            success,
            ...metadata
        };
        
        this.metrics.apiCalls.push(entry);
        
        // Track tokens
        if (metadata.tokens) {
            this.metrics.tokens.total += metadata.tokens;
            if (metadata.promptTokens) {
                this.metrics.tokens.prompt += metadata.promptTokens;
            }
            if (metadata.completionTokens) {
                this.metrics.tokens.completion += metadata.completionTokens;
            }
        }
        
        // Track errors
        if (!success) {
            const errorEntry = {
                timestamp: Date.now(),
                duration,
                type: metadata.errorType || 'unknown',
                message: metadata.errorMessage || ''
            };
            this.metrics.errors.push(errorEntry);
        }
    }
    
    /**
     * Record cache hit
     * @param {number} duration - Retrieval time in milliseconds
     */
    recordCacheHit(duration) {
        this.metrics.cache.hits++;
        this.metrics.cache.hitDurations = (this.metrics.cache.hitDurations || []);
        this.metrics.cache.hitDurations.push(duration);
    }
    
    /**
     * Record cache miss
     * @param {number} duration - Subsequent API call duration
     */
    recordCacheMiss(duration) {
        this.metrics.cache.misses++;
        this.metrics.cache.missDurations = (this.metrics.cache.missDurations || []);
        this.metrics.cache.missDurations.push(duration);
    }
    
    /**
     * Record generic operation
     * @param {string} name - Operation name
     * @param {number} duration - Duration in milliseconds
     * @param {object} metadata - Additional data
     */
    recordOperation(name, duration, metadata = {}) {
        const entry = {
            timestamp: Date.now(),
            name,
            duration,
            ...metadata
        };
        
        this.metrics.operations.push(entry);
    }
    
    /**
     * Get aggregated metrics
     */
    getMetrics() {
        const apiCalls = this.metrics.apiCalls;
        const errorCount = this.metrics.errors.length;
        const totalRequests = apiCalls.length;
        
        // API performance calculation
        const durations = apiCalls.map(c => c.duration);
        const avgDuration = durations.length > 0
            ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
            : 0;
        
        const sortedDurations = [...durations].sort((a, b) => a - b);
        const p95Index = Math.ceil(sortedDurations.length * 0.95) - 1;
        const p99Index = Math.ceil(sortedDurations.length * 0.99) - 1;
        
        // Cache efficiency
        const cacheTotal = this.metrics.cache.hits + this.metrics.cache.misses;
        const cacheHitRate = cacheTotal > 0
            ? ((this.metrics.cache.hits / cacheTotal) * 100).toFixed(1)
            : 0;
        
        // Error rate
        const errorRate = totalRequests > 0
            ? ((errorCount / totalRequests) * 100).toFixed(1)
            : 0;
        
        // System info
        const uptime = Date.now() - this.startTime;
        const currentMemory = process.memoryUsage();
        const memoryDelta = Math.round(
            (currentMemory.heapUsed - this.startMemory.heapUsed) / 1024 / 1024
        );
        
        return {
            // API Performance
            api: {
                totalCalls: totalRequests,
                successCount: totalRequests - errorCount,
                errorCount: errorCount,
                averageResponseTime: avgDuration + 'ms',
                minResponseTime: Math.min(...durations || [0]) + 'ms',
                maxResponseTime: Math.max(...durations || [0]) + 'ms',
                p95ResponseTime: (sortedDurations[p95Index] || 0) + 'ms',
                p99ResponseTime: (sortedDurations[p99Index] || 0) + 'ms'
            },
            
            // Cache Performance
            cache: {
                hits: this.metrics.cache.hits,
                misses: this.metrics.cache.misses,
                hitRate: cacheHitRate + '%',
                averageHitTime: this.getAverageDuration(
                    this.metrics.cache.hitDurations || []
                ) + 'ms',
                averageMissTime: this.getAverageDuration(
                    this.metrics.cache.missDurations || []
                ) + 'ms'
            },
            
            // Token Usage
            tokens: {
                totalUsed: this.metrics.tokens.total,
                prompt: this.metrics.tokens.prompt,
                completion: this.metrics.tokens.completion,
                averagePerRequest: this.metrics.tokens.total > 0
                    ? Math.round(this.metrics.tokens.total / totalRequests)
                    : 0
            },
            
            // Error Tracking
            errors: {
                totalErrors: errorCount,
                errorRate: errorRate + '%',
                byType: this.countErrorsByType(),
                lastError: this.metrics.errors.length > 0
                    ? this.metrics.errors[this.metrics.errors.length - 1]
                    : null
            },
            
            // System Health
            system: {
                uptime: this.formatUptime(uptime),
                uptimeSeconds: Math.round(uptime / 1000),
                memoryUsageMB: Math.round(currentMemory.heapUsed / 1024 / 1024),
                memoryDeltaMB: memoryDelta,
                memoryLimit: Math.round(currentMemory.heapTotal / 1024 / 1024)
            },
            
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Calculate average from duration array
     */
    getAverageDuration(durations) {
        if (durations.length === 0) return 0;
        const sum = durations.reduce((a, b) => a + b, 0);
        return Math.round(sum / durations.length);
    }
    
    /**
     * Format uptime as human readable
     */
    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }
    
    /**
     * Count errors by type
     */
    countErrorsByType() {
        const counts = {};
        
        this.metrics.errors.forEach(error => {
            const type = error.type || 'unknown';
            counts[type] = (counts[type] || 0) + 1;
        });
        
        return counts;
    }
    
    /**
     * Generate formatted performance report
     */
    generateReport() {
        const metrics = this.getMetrics();
        
        const report = `
╔════════════════════════════════════════════════════════════╗
║              PERFORMANCE METRICS REPORT                    ║
╚════════════════════════════════════════════════════════════╝

📊 API PERFORMANCE
─────────────────────────────────────────────────────────────
  Total Calls:              ${metrics.api.totalCalls}
  Success Rate:             ${(((metrics.api.totalCalls - metrics.api.errorCount) / metrics.api.totalCalls) * 100).toFixed(1)}%
  Average Response Time:    ${metrics.api.averageResponseTime}
  Min Response Time:        ${metrics.api.minResponseTime}
  Max Response Time:        ${metrics.api.maxResponseTime}
  P95 Response Time:        ${metrics.api.p95ResponseTime}
  P99 Response Time:        ${metrics.api.p99ResponseTime}

💾 CACHE EFFICIENCY
─────────────────────────────────────────────────────────────
  Cache Hits:               ${metrics.cache.hits}
  Cache Misses:             ${metrics.cache.misses}
  Hit Rate:                 ${metrics.cache.hitRate}
  Avg Hit Time:             ${metrics.cache.averageHitTime}
  Avg Miss Time:            ${metrics.cache.averageMissTime}
  
📈 TOKEN USAGE
─────────────────────────────────────────────────────────────
  Total Tokens:             ${metrics.tokens.totalUsed}
  Prompt Tokens:            ${metrics.tokens.prompt}
  Completion Tokens:        ${metrics.tokens.completion}
  Avg Per Request:          ${metrics.tokens.averagePerRequest}

⚠️  ERROR TRACKING
─────────────────────────────────────────────────────────────
  Total Errors:             ${metrics.errors.totalErrors}
  Error Rate:               ${metrics.errors.errorRate}
  Errors by Type:           ${JSON.stringify(metrics.errors.byType)}

🖥️  SYSTEM HEALTH
─────────────────────────────────────────────────────────────
  Uptime:                   ${metrics.system.uptime}
  Memory Usage:             ${metrics.system.memoryUsageMB}MB
  Memory Limit:             ${metrics.system.memoryLimit}MB
  Memory Delta:             ${metrics.system.memoryDeltaMB}MB
  
Generated: ${metrics.timestamp}
`;
        
        return report;
    }
    
    /**
     * Export metrics to JSON
     */
    exportJSON(filename = 'metrics.json') {
        const metrics = this.getMetrics();
        const json = JSON.stringify(metrics, null, 2);
        fs.writeFileSync(filename, json, 'utf-8');
        return filename;
    }
    
    /**
     * Export metrics as CSV (for Excel/analysis)
     */
    exportCSV(filename = 'metrics.csv') {
        const apiCalls = this.metrics.apiCalls;
        
        if (apiCalls.length === 0) {
            fs.writeFileSync(filename, 'No API calls recorded\n');
            return filename;
        }
        
        // CSV Header
        const headers = ['timestamp', 'duration', 'success', 'model', 'tokens', 'cache_hit'];
        const csv = [headers.join(',')];
        
        // CSV Rows
        apiCalls.forEach(call => {
            const row = [
                new Date(call.timestamp).toISOString(),
                call.duration,
                call.success,
                call.model || 'unknown',
                call.tokens || 0,
                call.cacheHit || false
            ];
            csv.push(row.join(','));
        });
        
        fs.writeFileSync(filename, csv.join('\n'), 'utf-8');
        return filename;
    }
    
    /**
     * Reset all metrics (start fresh)
     */
    reset() {
        this.startTime = Date.now();
        this.startMemory = process.memoryUsage();
        this.metrics = {
            apiCalls: [],
            cache: { hits: 0, misses: 0 },
            tokens: { total: 0, prompt: 0, completion: 0 },
            errors: [],
            operations: []
        };
    }
    
    /**
     * Get performance summary for logging
     */
    getSummary() {
        const metrics = this.getMetrics();
        return {
            calls: metrics.api.totalCalls,
            avgTime: metrics.api.averageResponseTime,
            cacheHitRate: metrics.cache.hitRate,
            errorRate: metrics.errors.errorRate,
            uptime: metrics.system.uptime
        };
    }
}

module.exports = PerformanceMonitor;
```

## CLI Usage

### View Performance Report

```bash
# Display formatted performance report
./chat-llm.js perf-report

# Output:
# ╔════════════════════════════════════════════════════════════╗
# ║              PERFORMANCE METRICS REPORT                    ║
# ╚════════════════════════════════════════════════════════════╝
# 
# 📊 API PERFORMANCE
# ─────────────────────────────────────────────────────────────
#   Total Calls:              42
#   Success Rate:             95.2%
#   Average Response Time:    234ms
#   Min Response Time:        45ms
#   Max Response Time:        1234ms
#   P95 Response Time:        800ms
#   P99 Response Time:        950ms
# 
# 💾 CACHE EFFICIENCY
# ─────────────────────────────────────────────────────────────
#   Cache Hits:               33
#   Cache Misses:             9
#   Hit Rate:                 78.6%
# ...
```

### View JSON Metrics

```bash
# Display metrics in JSON format
./chat-llm.js perf-metrics

# Output:
# {
#   "api": {
#     "totalCalls": 42,
#     "successCount": 40,
#     "errorCount": 2,
#     "averageResponseTime": "234ms",
#     "minResponseTime": "45ms",
#     "maxResponseTime": "1234ms",
#     ...
#   },
#   "cache": { ... },
#   "tokens": { ... },
#   "errors": { ... },
#   "system": { ... }
# }
```

### Export Metrics

```bash
# Export metrics as JSON
./chat-llm.js export perf-json metrics.json

# Export metrics as CSV
./chat-llm.js export perf-csv metrics.csv

# Verify files created
ls -lh metrics.*
# metrics.csv   2.4K
# metrics.json  5.8K
```

## Integration with Main Application

### Recording API Calls

```javascript
// chat-llm.js integration

const PerformanceMonitor = require('./tools/performance-monitor.js');
const monitor = new PerformanceMonitor();

// Record successful API call
const startTime = Date.now();
try {
    const response = await fetchFromLLM(messages);
    const duration = Date.now() - startTime;
    
    monitor.recordAPICall(duration, true, {
        model: LLM_CHAT_MODEL,
        tokens: response.usage.total_tokens,
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        cacheHit: isCached
    });
    
} catch (error) {
    const duration = Date.now() - startTime;
    
    monitor.recordAPICall(duration, false, {
        model: LLM_CHAT_MODEL,
        errorType: error.name,
        errorMessage: error.message
    });
}
```

### Recording Cache Operations

```javascript
// Track cache hit
const cacheStartTime = Date.now();
const cached = cache.get(query);
if (cached) {
    const duration = Date.now() - cacheStartTime;
    monitor.recordCacheHit(duration);
}

// Track cache miss (when API is called)
const apiStartTime = Date.now();
const apiResponse = await callAPI(query);
const apiDuration = Date.now() - apiStartTime;
monitor.recordCacheMiss(apiDuration);
```

## Performance Analysis Examples

### Identifying Performance Bottlenecks

```javascript
const monitor = new PerformanceMonitor();
const metrics = monitor.getMetrics();

// Check if API latency is high
if (parseInt(metrics.api.averageResponseTime) > 1000) {
    console.log('⚠️  API response time is high');
    console.log(`Average: ${metrics.api.averageResponseTime}`);
    console.log(`Max: ${metrics.api.maxResponseTime}`);
}

// Check cache efficiency
if (parseFloat(metrics.cache.hitRate) < 50) {
    console.log('⚠️  Low cache hit rate');
    console.log(`Hit rate: ${metrics.cache.hitRate}`);
    console.log('Consider increasing cache TTL or size');
}

// Check error rate
if (parseFloat(metrics.errors.errorRate) > 5) {
    console.log('⚠️  High error rate');
    console.log(`Error rate: ${metrics.errors.errorRate}`);
    console.log('Errors by type:', metrics.errors.byType);
}
```

### Comparing Performance Before/After

```javascript
// Before optimization
const before = monitor.getMetrics();
console.log('Before:', {
    avgTime: before.api.averageResponseTime,
    cacheHit: before.cache.hitRate,
    errorRate: before.errors.errorRate
});

// ... Make optimizations ...

// After optimization
const after = monitor.getMetrics();
console.log('After:', {
    avgTime: after.api.averageResponseTime,
    cacheHit: after.cache.hitRate,
    errorRate: after.errors.errorRate
});

// Calculate improvement
const timeImprovement = (
    (parseInt(before.api.averageResponseTime) - 
     parseInt(after.api.averageResponseTime)) / 
    parseInt(before.api.averageResponseTime) * 100
).toFixed(1);

console.log(`⚡ Response time improved by ${timeImprovement}%`);
```

## Performance Benchmarks

### Typical Metrics (Baseline)

| Metric | Value |
|--------|-------|
| Average Response Time | 200-300ms |
| Cache Hit Rate | 60-80% |
| Error Rate | <5% |
| Memory Usage | 50-100MB |
| Uptime | Continuous |

### Performance Targets

| Scenario | Target | Notes |
|----------|--------|-------|
| Cache Hit | >70% | Increase TTL if lower |
| Response Time | <500ms | Check API service |
| Error Rate | <2% | Investigate errors |
| Memory | <200MB | Monitor memory leaks |

## Optimization Strategies

### Improving Cache Hit Rate

```javascript
// Strategy 1: Increase cache TTL
config.set('caching.ttl', 172800000); // 48 hours instead of 24

// Strategy 2: Enable for all request types
config.set('caching.enabled', true);

// Monitor improvement
console.log('Before:', oldMetrics.cache.hitRate);
// After some time...
console.log('After:', monitor.getMetrics().cache.hitRate);
```

### Reducing Response Time

```javascript
// Strategy 1: Use faster model
config.set('models.chat', 'gpt-3.5-turbo');

// Strategy 2: Reduce max tokens
config.set('models.maxTokens', 1024);

// Strategy 3: Enable streaming
config.set('features.streaming', true);

// Track improvement
const metrics = monitor.getMetrics();
console.log('New avg response time:', metrics.api.averageResponseTime);
```

### Reducing Error Rate

```javascript
// Strategy 1: Increase retry count
config.set('api.maxRetries', 5);

// Strategy 2: Increase timeout
config.set('api.timeout', 30000); // 30 seconds

// Strategy 3: Implement exponential backoff
// (Already implemented in chat-llm.js)

// Track improvement
const metrics = monitor.getMetrics();
console.log('Error rate:', metrics.errors.errorRate);
```

## Troubleshooting

### High Memory Usage
**Problem**: Memory usage constantly increasing
**Solution**: Check for memory leaks
```javascript
const metrics = monitor.getMetrics();
console.log('Memory delta:', metrics.system.memoryDeltaMB);
// If consistently increasing, there's a memory leak
```

### Low Cache Hit Rate
**Problem**: Cache hit rate below 50%
**Solution**: Review cache settings
```bash
# Check cache configuration
./chat-llm.js config-get caching

# Increase TTL
./chat-llm.js config-set caching.ttl 172800000  # 48 hours
```

### High Error Rate
**Problem**: Error rate above 5%
**Solution**: Investigate error types
```javascript
const metrics = monitor.getMetrics();
console.log('Errors by type:', metrics.errors.byType);
// Look for patterns in error types
```

## Performance Monitoring Best Practices

1. **Monitor regularly**
   ```bash
   # Check metrics daily
   ./chat-llm.js perf-report | tee performance.log
   ```

2. **Export for analysis**
   ```bash
   # Export for historical analysis
   ./chat-llm.js export perf-json metrics-$(date +%Y-%m-%d).json
   ```

3. **Set performance baselines**
   ```javascript
   // After deployment, record baseline
   const baseline = monitor.getMetrics();
   fs.writeFileSync('baseline.json', JSON.stringify(baseline, null, 2));
   ```

4. **Alert on degradation**
   ```javascript
   // Alert if performance drops >20%
   const current = monitor.getMetrics();
   const baseline = require('./baseline.json');
   
   if (current.api.averageResponseTime > baseline.api.averageResponseTime * 1.2) {
       console.warn('⚠️  Performance degradation detected');
   }
   ```

5. **Optimize iteratively**
   - Make one change
   - Monitor for 1 hour
   - Compare metrics
   - Decide on keeping change

## Summary

The Performance Monitor provides comprehensive metrics collection and analysis for Chat LLM v2. Track API performance, cache efficiency, token usage, errors, and system health. Use the insights to optimize configuration and identify bottlenecks.

