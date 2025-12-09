#!/usr/bin/env node

/**
 * Chat LLM v2.2 - Comprehensive Test Suite
 * 
 * This test suite validates all core functionality of Chat LLM v2.x
 * Run with: node tests/test-suite.js
 * 
 * Test Categories:
 * 1. Unit Tests - Individual module testing
 * 2. Integration Tests - Multi-module interactions
 * 3. Performance Tests - Benchmarks and stress tests
 * 4. Edge Case Tests - Error handling and boundary conditions
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Test results tracking
const testResults = {
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: []
};

// Color codes for output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

/**
 * Test runner function
 */
function test(name, fn, category = 'unit') {
    const testCase = { name, category, status: 'pending', error: null };
    
    try {
        fn();
        testCase.status = 'passed';
        testResults.passed++;
        console.log(`${colors.green}✓${colors.reset} ${name}`);
    } catch (error) {
        testCase.status = 'failed';
        testCase.error = error.message;
        testResults.failed++;
        console.log(`${colors.red}✗${colors.reset} ${name}`);
        console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
    }
    
    testResults.tests.push(testCase);
}

/**
 * Async test runner
 */
async function testAsync(name, fn, category = 'integration') {
    const testCase = { name, category, status: 'pending', error: null };
    
    try {
        await fn();
        testCase.status = 'passed';
        testResults.passed++;
        console.log(`${colors.green}✓${colors.reset} ${name}`);
    } catch (error) {
        testCase.status = 'failed';
        testCase.error = error.message;
        testResults.failed++;
        console.log(`${colors.red}✗${colors.reset} ${name}`);
        console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
    }
    
    testResults.tests.push(testCase);
}

// ============================================================================
// UNIT TESTS - Core Modules
// ============================================================================

console.log(`\n${colors.blue}=== Unit Tests - Core Modules ===${colors.reset}\n`);

// Test 1: Response Cache Module
test('ResponseCache - Constructor initializes correctly', () => {
    const ResponseCache = require('../tools/response-cache.js');
    const cache = new ResponseCache('./cache', 1000);
    
    assert.strictEqual(cache.cacheDir, './cache');
    assert.strictEqual(cache.ttl, 1000);
    assert.ok(cache.memoryCache instanceof Map);
});

// Test 2: ResponseCache - Set and get operations
test('ResponseCache - Can store and retrieve values', () => {
    const ResponseCache = require('../tools/response-cache.js');
    const cache = new ResponseCache('./test-cache', 10000);
    
    cache.set('test-key', 'test-value');
    const value = cache.get('test-key');
    
    assert.strictEqual(value, 'test-value');
});

// Test 3: ResponseCache - TTL expiration
test('ResponseCache - Respects TTL expiration', (done) => {
    const ResponseCache = require('../tools/response-cache.js');
    const cache = new ResponseCache('./test-cache', 100); // 100ms TTL
    
    cache.set('expire-key', 'expire-value');
    
    setTimeout(() => {
        const value = cache.get('expire-key');
        assert.strictEqual(value, null, 'Value should expire after TTL');
        done();
    }, 150);
});

// Test 4: Memory Manager
test('MemoryManager - Can add and retrieve messages', () => {
    const MemoryManager = require('../tools/memory-manager.js');
    const memory = new MemoryManager();
    
    memory.addMessage('conv-1', 'user', 'Hello');
    memory.addMessage('conv-1', 'assistant', 'Hi there');
    
    const messages = memory.getConversation('conv-1');
    assert.strictEqual(messages.length, 2);
    assert.strictEqual(messages[0].content, 'Hello');
});

// Test 5: Context Manager
test('ContextManager - Can create and activate contexts', () => {
    const ContextManager = require('../tools/context-manager.js');
    const contextManager = new ContextManager();
    
    contextManager.createContext('test-context', { type: 'research' });
    contextManager.activateContext('test-context');
    
    const active = contextManager.getActiveContext();
    assert.strictEqual(active.name, 'test-context');
});

// Test 6: Agent Manager
test('AgentManager - Lists available agents', () => {
    const AgentManager = require('../tools/agent-manager.js');
    const agentManager = new AgentManager();
    
    const agents = agentManager.listAgents();
    assert.ok(agents.length > 0);
    assert.ok(agents.some(a => a.id === 'researcher'));
});

// Test 7: Event Bus
test('EventBus - Can publish and subscribe to events', async () => {
    const EventBus = require('../tools/event-bus.js');
    const eventBus = new EventBus();
    
    let received = false;
    
    eventBus.subscribe('test-event', () => {
        received = true;
    });
    
    await eventBus.publish('test-event', { data: 'test' });
    
    assert.strictEqual(received, true);
});

// Test 8: Performance Monitor
test('PerformanceMonitor - Records and retrieves metrics', () => {
    const PerformanceMonitor = require('../tools/performance-monitor.js');
    const monitor = new PerformanceMonitor();
    
    monitor.record('test-operation', 150, { status: 'success' });
    
    const metrics = monitor.getMetrics('test-operation');
    assert.strictEqual(metrics.count, 1);
    assert.strictEqual(metrics.totalDuration, 150);
});

// Test 9: Error Handler
test('ErrorHandler - Handles errors with retry strategy', () => {
    const ErrorHandler = require('../tools/error-handler.js');
    const errorHandler = new ErrorHandler();
    
    let attempts = 0;
    const operation = () => {
        attempts++;
        if (attempts < 3) throw new Error('Temporary failure');
        return 'success';
    };
    
    const result = errorHandler.handle(operation, { strategy: 'retry', maxRetries: 3 });
    assert.strictEqual(result, 'success');
    assert.strictEqual(attempts, 3);
});

// Test 10: Config Manager
test('ConfigManager - Loads and saves configuration', () => {
    const ConfigManager = require('../tools/config-manager.js');
    const config = new ConfigManager();
    
    config.set('test.setting', 'value');
    const value = config.get('test.setting');
    
    assert.strictEqual(value, 'value');
});

// ============================================================================
// INTEGRATION TESTS - Multi-Module Interactions
// ============================================================================

console.log(`\n${colors.blue}=== Integration Tests ===${colors.reset}\n`);

testAsync('Multi-agent workflow execution', async () => {
    const AgentManager = require('../tools/agent-manager.js');
    const ContextManager = require('../tools/context-manager.js');
    
    const agentManager = new AgentManager();
    const contextManager = new ContextManager();
    
    // Create research context
    contextManager.createContext('research-project', { type: 'research' });
    contextManager.activateContext('research-project');
    
    // Activate researcher agent
    const agent = agentManager.activateAgent('researcher');
    
    assert.ok(agent);
    assert.strictEqual(agent.id, 'researcher');
});

testAsync('Event bus with multiple subscribers', async () => {
    const EventBus = require('../tools/event-bus.js');
    const eventBus = new EventBus();
    
    let count = 0;
    
    eventBus.subscribe('multi-event', () => count++);
    eventBus.subscribe('multi-event', () => count++);
    eventBus.subscribe('multi-event', () => count++);
    
    await eventBus.publish('multi-event', {});
    
    assert.strictEqual(count, 3);
});

testAsync('Cache and memory integration', async () => {
    const ResponseCache = require('../tools/response-cache.js');
    const MemoryManager = require('../tools/memory-manager.js');
    
    const cache = new ResponseCache('./test-cache');
    const memory = new MemoryManager();
    
    // Store in cache
    cache.set('query-1', 'cached-response');
    
    // Store in memory
    memory.addMessage('conv-1', 'user', 'query-1');
    memory.addMessage('conv-1', 'assistant', 'cached-response');
    
    // Retrieve
    const cachedValue = cache.get('query-1');
    const conversation = memory.getConversation('conv-1');
    
    assert.strictEqual(cachedValue, 'cached-response');
    assert.strictEqual(conversation.length, 2);
});

// ============================================================================
// PERFORMANCE TESTS - Benchmarks
// ============================================================================

console.log(`\n${colors.blue}=== Performance Tests ===${colors.reset}\n`);

test('Cache performance - 1000 writes', () => {
    const ResponseCache = require('../tools/response-cache.js');
    const cache = new ResponseCache('./test-cache');
    
    const start = Date.now();
    
    for (let i = 0; i < 1000; i++) {
        cache.set(`key-${i}`, `value-${i}`);
    }
    
    const duration = Date.now() - start;
    console.log(`  ℹ 1000 cache writes completed in ${duration}ms`);
    
    assert.ok(duration < 1000, 'Should complete in under 1 second');
});

test('Memory manager performance - 1000 messages', () => {
    const MemoryManager = require('../tools/memory-manager.js');
    const memory = new MemoryManager();
    
    const start = Date.now();
    
    for (let i = 0; i < 1000; i++) {
        memory.addMessage('perf-test', i % 2 === 0 ? 'user' : 'assistant', `message-${i}`);
    }
    
    const duration = Date.now() - start;
    console.log(`  ℹ 1000 memory operations completed in ${duration}ms`);
    
    assert.ok(duration < 500, 'Should complete in under 500ms');
});

test('Event bus performance - 1000 events', async () => {
    const EventBus = require('../tools/event-bus.js');
    const eventBus = new EventBus();
    
    let count = 0;
    eventBus.subscribe('perf-event', () => count++);
    
    const start = Date.now();
    
    for (let i = 0; i < 1000; i++) {
        await eventBus.publish('perf-event', { index: i });
    }
    
    const duration = Date.now() - start;
    console.log(`  ℹ 1000 event publications completed in ${duration}ms`);
    
    assert.strictEqual(count, 1000);
    assert.ok(duration < 2000, 'Should complete in under 2 seconds');
});

// ============================================================================
// EDGE CASE TESTS - Error Handling
// ============================================================================

console.log(`\n${colors.blue}=== Edge Case Tests ===${colors.reset}\n`);

test('Cache handles null/undefined values', () => {
    const ResponseCache = require('../tools/response-cache.js');
    const cache = new ResponseCache('./test-cache');
    
    cache.set('null-key', null);
    const nullValue = cache.get('null-key');
    
    cache.set('undefined-key', undefined);
    const undefinedValue = cache.get('undefined-key');
    
    assert.strictEqual(nullValue, null);
    assert.strictEqual(undefinedValue, undefined);
});

test('Memory manager handles empty conversation', () => {
    const MemoryManager = require('../tools/memory-manager.js');
    const memory = new MemoryManager();
    
    const messages = memory.getConversation('non-existent');
    
    assert.ok(Array.isArray(messages));
    assert.strictEqual(messages.length, 0);
});

test('Agent manager handles invalid agent ID', () => {
    const AgentManager = require('../tools/agent-manager.js');
    const agentManager = new AgentManager();
    
    try {
        agentManager.activateAgent('non-existent-agent');
        assert.fail('Should throw error for invalid agent');
    } catch (error) {
        assert.ok(error.message.includes('not found') || error.message.includes('invalid'));
    }
});

test('Config manager handles missing configuration', () => {
    const ConfigManager = require('../tools/config-manager.js');
    const config = new ConfigManager();
    
    const value = config.get('non.existent.key');
    
    assert.strictEqual(value, undefined);
});

// ============================================================================
// TEST SUMMARY
// ============================================================================

function printSummary() {
    console.log(`\n${colors.cyan}=== Test Summary ===${colors.reset}\n`);
    
    const total = testResults.passed + testResults.failed + testResults.skipped;
    const passRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0;
    
    console.log(`Total Tests: ${total}`);
    console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
    console.log(`${colors.yellow}Skipped: ${testResults.skipped}${colors.reset}`);
    console.log(`Pass Rate: ${passRate}%`);
    
    // Category breakdown
    console.log(`\n${colors.cyan}By Category:${colors.reset}`);
    const categories = {};
    testResults.tests.forEach(test => {
        if (!categories[test.category]) {
            categories[test.category] = { passed: 0, failed: 0 };
        }
        if (test.status === 'passed') categories[test.category].passed++;
        if (test.status === 'failed') categories[test.category].failed++;
    });
    
    Object.keys(categories).forEach(category => {
        const stats = categories[category];
        const total = stats.passed + stats.failed;
        console.log(`  ${category}: ${stats.passed}/${total} passed`);
    });
    
    // Exit code
    process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
(async () => {
    console.log(`${colors.cyan}Chat LLM v2.2 - Test Suite${colors.reset}`);
    console.log(`Starting tests at ${new Date().toISOString()}\n`);
    
    // Wait for async tests
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    printSummary();
})();
