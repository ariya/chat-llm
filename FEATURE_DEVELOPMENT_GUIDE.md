# Chat LLM v2 - Robust Tool Development Guide

**Purpose**: Guide for adding features and extending Chat LLM with production-grade robustness  
**Date**: December 8, 2025  
**Target Audience**: Developers, Maintainers, Contributors

---

## 🏗️ Architecture Overview

Chat LLM v2 is built on a **modular, event-driven architecture** designed for:
- **Extensibility**: Add new features without modifying core
- **Reliability**: Graceful error handling and recovery
- **Performance**: Optimized caching and async processing
- **Maintainability**: Clear separation of concerns

### Core Modules

```
┌─────────────────────────────────────────────────────────┐
│                  Chat LLM Application                    │
│                   (chat-llm.js)                          │
└────┬────────────────────────────────────────────────────┘
     │
     ├─ Event Bus ──────────────────┐
     │  (Pub/Sub system)            │
     │                              ├─ Plugins
     ├─ Agent Manager               │
     │  (7 agents)                  │
     │                              │
     ├─ Context Manager             ├─ Workflows
     │  (Session isolation)         │
     │                              │
     ├─ Memory Manager              ├─ Error Handler
     │  (Conversation history)      │  (Recovery logic)
     │                              │
     ├─ Config Manager              │
     │  (Settings & profiles)       │
     │                              │
     ├─ Performance Monitor         │
     │  (Metrics & monitoring)      │
     │                              │
     ├─ Request Logger              │
     │  (Analytics)                 │
     │                              │
     ├─ Response Cache              │
     │  (Caching layer)             │
     │                              │
     └─ Sentiment Analyzer          │
        (NLP analysis)              │
                                    │
                       ┌────────────┘
                       │
                  ┌────▼─────┐
                  │ File I/O  │
                  │ Storage   │
                  └───────────┘
```

---

## 🔨 Building New Features

### Step 1: Create Module Structure

**Example: Building a "Fact Checker" Module**

```javascript
// tools/fact-checker.js

class FactChecker {
    constructor(dataPath = './data/facts') {
        this.dataPath = dataPath;
        this.facts = new Map();
        this.stats = {
            checked: 0,
            verified: 0,
            failed: 0
        };
    }

    /**
     * Check if statement is factually accurate
     * @param {string} statement - Statement to verify
     * @returns {Promise<Object>} Verification result
     */
    async verify(statement) {
        const start = Date.now();
        try {
            // Implementation
            const result = {
                statement,
                verified: true,
                confidence: 0.95,
                sources: ['source1', 'source2'],
                duration: Date.now() - start
            };
            
            this.stats.checked++;
            if (result.verified) this.stats.verified++;
            
            return result;
        } catch (error) {
            this.stats.failed++;
            throw error;
        }
    }

    getStats() {
        return {
            ...this.stats,
            accuracy: (this.stats.verified / this.stats.checked).toFixed(2)
        };
    }
}

module.exports = { FactChecker };
```

### Step 2: Integrate with Main Application

```javascript
// In chat-llm.js

const { FactChecker } = require('./tools/fact-checker');

// Initialize
const factChecker = new FactChecker('./data/facts');

// Use in handlers
eventBus.on('reply:generated', async (data) => {
    const verification = await factChecker.verify(data.answer);
    if (!verification.verified) {
        eventBus.emit('fact-check:warning', {
            statement: data.answer,
            confidence: verification.confidence
        });
    }
});
```

### Step 3: Add CLI Command

```javascript
// In chat-llm.js CLI section

} else if (args[0] === 'fact-check' && args.length > 1) {
    const statement = args.slice(1).join(' ');
    const result = await factChecker.verify(statement);
    console.log(JSON.stringify(result, null, 2));
    logger.logRequest('fact-check', statement, JSON.stringify(result), result.duration);
}
```

---

## 🎯 Design Patterns for Robust Features

### Pattern 1: Error Recovery with Fallback

```javascript
class RobustFeature {
    async executeWithFallback(primaryAction, fallbackAction) {
        try {
            return await primaryAction();
        } catch (error) {
            logger.logError('Primary action failed', error);
            
            try {
                return await fallbackAction();
            } catch (fallbackError) {
                logger.logError('Fallback also failed', fallbackError);
                throw new Error('Both primary and fallback failed');
            }
        }
    }
}
```

### Pattern 2: Async Processing with Queue

```javascript
class TaskQueue {
    constructor(maxConcurrent = 5) {
        this.queue = [];
        this.executing = 0;
        this.maxConcurrent = maxConcurrent;
    }

    async add(task) {
        this.queue.push(task);
        if (this.executing < this.maxConcurrent) {
            await this.processNext();
        }
    }

    async processNext() {
        if (this.queue.length === 0) return;
        
        this.executing++;
        const task = this.queue.shift();
        
        try {
            await task();
        } finally {
            this.executing--;
            await this.processNext();
        }
    }
}
```

### Pattern 3: Circuit Breaker

```javascript
class CircuitBreaker {
    constructor(options = {}) {
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.threshold = options.threshold || 5;
        this.resetTimeout = options.resetTimeout || 60000;
        this.lastFailureTime = null;
    }

    async execute(fn) {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.resetTimeout) {
                this.state = 'HALF_OPEN';
            } else {
                throw new Error('Circuit breaker is OPEN');
            }
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    onSuccess() {
        this.failureCount = 0;
        this.state = 'CLOSED';
    }

    onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        
        if (this.failureCount >= this.threshold) {
            this.state = 'OPEN';
        }
    }
}
```

### Pattern 4: Caching with TTL

```javascript
class SmartCache {
    constructor(ttl = 3600) {
        this.cache = new Map();
        this.ttl = ttl;
    }

    set(key, value, customTtl = null) {
        const expiry = Date.now() + (customTtl || this.ttl) * 1000;
        this.cache.set(key, { value, expiry });
    }

    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;
        
        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return entry.value;
    }

    invalidate(pattern) {
        for (const [key] of this.cache) {
            if (new RegExp(pattern).test(key)) {
                this.cache.delete(key);
            }
        }
    }
}
```

---

## 📊 Adding Analytics & Monitoring

### Implement Usage Tracking

```javascript
class FeatureAnalytics {
    constructor(featureName) {
        this.featureName = featureName;
        this.events = [];
        this.metrics = {
            invocations: 0,
            successes: 0,
            failures: 0,
            avgDuration: 0,
            totalDuration: 0
        };
    }

    recordEvent(eventType, data = {}) {
        this.events.push({
            type: eventType,
            timestamp: Date.now(),
            ...data
        });
    }

    recordExecution(success, duration) {
        this.metrics.invocations++;
        this.metrics.totalDuration += duration;
        this.metrics.avgDuration = this.metrics.totalDuration / this.metrics.invocations;
        
        if (success) {
            this.metrics.successes++;
        } else {
            this.metrics.failures++;
        }
    }

    getReport() {
        return {
            feature: this.featureName,
            metrics: this.metrics,
            successRate: (this.metrics.successes / this.metrics.invocations).toFixed(2),
            recentEvents: this.events.slice(-10)
        };
    }
}
```

---

## 🔐 Security Best Practices

### Input Validation

```javascript
class InputValidator {
    static validateQuery(query) {
        if (!query || typeof query !== 'string') {
            throw new Error('Query must be a non-empty string');
        }
        
        if (query.length > 5000) {
            throw new Error('Query exceeds maximum length');
        }
        
        // Block suspicious patterns
        const suspiciousPatterns = [
            /DROP TABLE/i,
            /DELETE FROM/i,
            /<script>/i
        ];
        
        if (suspiciousPatterns.some(p => p.test(query))) {
            throw new Error('Query contains potentially malicious content');
        }
        
        return query.trim();
    }

    static sanitize(input) {
        return input
            .replace(/[<>]/g, '') // Remove angle brackets
            .replace(/;$/g, '');   // Remove trailing semicolons
    }
}
```

### Rate Limiting

```javascript
class RateLimiter {
    constructor(requestsPerMinute = 60) {
        this.limit = requestsPerMinute;
        this.requests = [];
    }

    checkLimit(userId) {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        
        // Remove old requests
        this.requests = this.requests.filter(req => req.time > oneMinuteAgo && req.userId === userId);
        
        if (this.requests.length >= this.limit) {
            throw new Error(`Rate limit exceeded for user ${userId}`);
        }
        
        this.requests.push({ userId, time: now });
    }
}
```

---

## 🧪 Testing Strategy

### Unit Tests

```javascript
// test/fact-checker.test.js

const { FactChecker } = require('../tools/fact-checker');

describe('FactChecker', () => {
    let checker;

    beforeEach(() => {
        checker = new FactChecker();
    });

    test('should verify true statements', async () => {
        const result = await checker.verify('Paris is the capital of France');
        expect(result.verified).toBe(true);
        expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('should flag false statements', async () => {
        const result = await checker.verify('Paris is the capital of Germany');
        expect(result.verified).toBe(false);
    });

    test('should handle errors gracefully', async () => {
        expect(() => {
            checker.verify('');
        }).toThrow('Statement cannot be empty');
    });
});
```

### Integration Tests

```javascript
describe('FactChecker Integration', () => {
    test('should work with main application', async () => {
        // Start app
        // Send query
        // Verify fact-check is triggered
        // Check results
    });
});
```

---

## 📝 Documentation Requirements

When adding a feature, document:

1. **Purpose & Use Cases**
   - What does it do?
   - When should it be used?

2. **API Reference**
   - Available methods
   - Parameters & return types
   - Error conditions

3. **Configuration**
   - Environment variables
   - Config file options
   - Default values

4. **Examples**
   - Basic usage
   - Advanced scenarios
   - Error handling

5. **Performance Impact**
   - Memory usage
   - CPU overhead
   - Latency impact

6. **Troubleshooting**
   - Common issues
   - Debug tips
   - Log locations

---

## 🚀 Deployment Checklist

Before deploying new features:

- [ ] All tests passing (unit, integration, e2e)
- [ ] Code coverage > 80%
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Security audit passed
- [ ] Error handling verified
- [ ] Rollback plan prepared
- [ ] Monitoring configured
- [ ] Changelog updated
- [ ] Version bumped appropriately

---

## 📚 Module Development Template

```javascript
// tools/new-feature.js

/**
 * NewFeature - Description of what this module does
 * 
 * Features:
 * - Feature 1
 * - Feature 2
 * - Feature 3
 * 
 * Usage:
 * const feature = new NewFeature();
 * const result = await feature.execute(input);
 */
class NewFeature {
    /**
     * Constructor
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        this.options = options;
        this.stats = {
            executed: 0,
            succeeded: 0,
            failed: 0
        };
    }

    /**
     * Main execution method
     * @param {*} input - Input data
     * @returns {Promise<Object>} Result object
     * @throws {Error} On execution failure
     */
    async execute(input) {
        const start = Date.now();
        this.stats.executed++;

        try {
            // Validation
            this.validate(input);

            // Processing
            const result = await this.process(input);

            // Recording
            this.stats.succeeded++;
            result.duration = Date.now() - start;

            return result;
        } catch (error) {
            this.stats.failed++;
            throw error;
        }
    }

    validate(input) {
        // Implementation
    }

    async process(input) {
        // Implementation
    }

    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.executed > 0 
                ? (this.stats.succeeded / this.stats.executed).toFixed(2)
                : 0
        };
    }
}

module.exports = { NewFeature };
```

---

## 🎓 Learning Resources

- **Event-Driven Architecture**: See `tools/event-bus.js`
- **Error Handling**: See `tools/error-handler.js`
- **Module Pattern**: See `tools/agent-manager.js`
- **Performance Optimization**: See `tools/performance-monitor.js`
- **Testing Examples**: See `tests/` directory

---

## 📞 Support & Contribution

For questions or contributions:
1. Check existing documentation in `docs/`
2. Review similar modules for patterns
3. Follow this guide's standards
4. Submit pull request with tests
5. Get code review before merge

---

**Last Updated**: December 8, 2025  
**Maintained By**: Development Team  
**Next Update**: December 22, 2025
