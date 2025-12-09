#!/usr/bin/env node

/**
 * Chat-LLM v2 - Comprehensive Module Unit Tests
 * Tests all core and advanced tools
 */

const { analyzeSentiment } = require('./tools/sentiment_analyzer');
const { RequestLogger } = require('./tools/request-logger');
const { ResponseCache } = require('./tools/response-cache');
const { ConfigManager } = require('./tools/config-manager');
const { PerformanceMonitor } = require('./tools/performance-monitor');
const { AnalyticsEngine } = require('./tools/analytics-engine');
const { ModelRouter } = require('./tools/model-router');
const { ConversationManager } = require('./tools/conversation-manager');
const { AdvancedCache } = require('./tools/advanced-cache');
const { AdvancedCLI } = require('./tools/advanced-cli');

const CYAN = '\x1b[36m';
const GREEN = '\x1b[92m';
const RED = '\x1b[91m';
const NORMAL = '\x1b[0m';
const BOLD = '\x1b[1m';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function reportTest(category, testName, passed, error = null) {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`  ${GREEN}✓${NORMAL} ${testName}`);
  } else {
    failedTests++;
    console.log(`  ${RED}✘${NORMAL} ${testName}`);
    if (error) {
      console.log(`    ${RED}Error: ${error.message}${NORMAL}`);
    }
  }
}

function runTests() {
  console.log(`\n${BOLD}${CYAN}═══════════════════════════════════════════════════════════${NORMAL}`);
  console.log(`${BOLD}${CYAN}CHAT-LLM V2 - COMPREHENSIVE MODULE UNIT TESTS${NORMAL}`);
  console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════════${NORMAL}\n`);

  // Core Tools (v2.0)
  console.log(`${BOLD}Core Tools (v2.0):${NORMAL}\n`);

  // 1. Sentiment Analyzer Tests
  console.log(`${CYAN}Sentiment Analyzer:${NORMAL}`);
  try {
    const analyzer = analyzeSentiment;
    reportTest('Sentiment Analyzer', 'Function exported', typeof analyzer === 'function');
    
    const result1 = analyzer('I love this product!');
    reportTest('Sentiment Analyzer', 'Positive sentiment', result1.sentiment === 'positive');
    
    const result2 = analyzer('This is terrible and awful');
    reportTest('Sentiment Analyzer', 'Negative sentiment', result2.sentiment === 'negative');
  } catch (e) {
    reportTest('Sentiment Analyzer', 'Module working', false, e);
  }

  // 2. Request Logger Tests
  console.log(`${CYAN}Request Logger:${NORMAL}`);
  try {
    const logger = new RequestLogger('./logs');
    reportTest('Request Logger', 'Create instance', logger !== null);
    
    logger.logRequest('test', 'test input', 'test output', 100, { model: 'test' });
    reportTest('Request Logger', 'Log request', true);
    
    const stats = logger.getStats();
    reportTest('Request Logger', 'Get statistics', stats && stats.totalRequests > 0);
  } catch (e) {
    reportTest('Request Logger', 'Module working', false, e);
  }

  // 3. Response Cache Tests
  console.log(`${CYAN}Response Cache:${NORMAL}`);
  try {
    const cache = new ResponseCache('./cache');
    reportTest('Response Cache', 'Create instance', cache !== null);
    
    cache.set('test-key', 'test-value');
    const value = cache.get('test-key');
    reportTest('Response Cache', 'Set and get value', value === 'test-value');
    
    const missing = cache.get('nonexistent');
    reportTest('Response Cache', 'Invalid key returns null', missing === null);
  } catch (e) {
    reportTest('Response Cache', 'Module working', false, e);
  }

  // 4. Config Manager Tests
  console.log(`${CYAN}Config Manager:${NORMAL}`);
  try {
    const config = new ConfigManager('./config');
    reportTest('Config Manager', 'Create instance', config !== null);
    
    config.set('test.key', 'test-value');
    const value = config.get('test.key');
    reportTest('Config Manager', 'Set and get config', value === 'test-value');
    
    const all = config.getAll();
    reportTest('Config Manager', 'Get all config', all && typeof all === 'object');
  } catch (e) {
    reportTest('Config Manager', 'Module working', false, e);
  }

  // 5. Performance Monitor Tests
  console.log(`${CYAN}Performance Monitor:${NORMAL}`);
  try {
    const monitor = new PerformanceMonitor();
    reportTest('Performance Monitor', 'Create instance', monitor !== null);
    
    monitor.record('test-op', 100);
    reportTest('Performance Monitor', 'Record metric', true);
    
    const stats = monitor.getStats('test-op');
    reportTest('Performance Monitor', 'Get statistics', stats && stats.count > 0);
  } catch (e) {
    reportTest('Performance Monitor', 'Module working', false, e);
  }

  // Advanced Tools (v2.1)
  console.log(`\n${BOLD}Advanced Tools (v2.1):${NORMAL}\n`);

  // 6. Analytics Engine Tests
  console.log(`${CYAN}Analytics Engine:${NORMAL}`);
  try {
    const analytics = new AnalyticsEngine();
    reportTest('Analytics Engine', 'Create instance', analytics !== null);
    
    analytics.recordMetric('performance', { latency: 150 });
    reportTest('Analytics Engine', 'Record metric', true);
    
    const dashboard = analytics.getDashboard();
    reportTest('Analytics Engine', 'Get dashboard', dashboard && typeof dashboard === 'object');
    
    const health = analytics.calculateHealth();
    reportTest('Analytics Engine', 'Calculate health', health >= 0 && health <= 100);
  } catch (e) {
    reportTest('Analytics Engine', 'Module working', false, e);
  }

  // 7. Model Router Tests
  console.log(`${CYAN}Model Router:${NORMAL}`);
  try {
    const router = new ModelRouter();
    reportTest('Model Router', 'Create instance', router !== null);
    
    const decision = router.route('What is 2+2?', { priority: 'speed' });
    reportTest('Model Router', 'Route query', decision && decision.selectedModel);
    
    router.addModel('custom-model', { maxTokens: 4096, cost: 0.001 });
    reportTest('Model Router', 'Add custom model', true);
    
    const stats = router.getStatistics();
    reportTest('Model Router', 'Get statistics', stats && typeof stats === 'object');
  } catch (e) {
    reportTest('Model Router', 'Module working', false, e);
  }

  // 8. Conversation Manager Tests
  console.log(`${CYAN}Conversation Manager:${NORMAL}`);
  try {
    const convMgr = new ConversationManager();
    reportTest('Conversation Manager', 'Create instance', convMgr !== null);
    
    const convId = 'conv-test-' + Date.now();
    convMgr.startConversation(convId, { userId: 'test' });
    reportTest('Conversation Manager', 'Start conversation', true);
    
    convMgr.addMessage(convId, 'user', 'Hello');
    reportTest('Conversation Manager', 'Add message', true);
    
    const context = convMgr.getOptimizedContext(convId, 2000);
    reportTest('Conversation Manager', 'Get optimized context', context && typeof context === 'string');
  } catch (e) {
    reportTest('Conversation Manager', 'Module working', false, e);
  }

  // 9. Advanced Cache Tests
  console.log(`${CYAN}Advanced Cache:${NORMAL}`);
  try {
    const advCache = new AdvancedCache();
    reportTest('Advanced Cache', 'Create instance', advCache !== null);
    
    advCache.set('key1', { data: 'value1' }, { ttl: 3600 });
    reportTest('Advanced Cache', 'Set value', true);
    
    const value = advCache.get('key1');
    reportTest('Advanced Cache', 'Get value', value && value.data === 'value1');
    
    const stats = advCache.getStats();
    reportTest('Advanced Cache', 'Get statistics', stats && typeof stats === 'object');
  } catch (e) {
    reportTest('Advanced Cache', 'Module working', false, e);
  }

  // 10. Advanced CLI Tests
  console.log(`${CYAN}Advanced CLI:${NORMAL}`);
  try {
    const managers = {
      analytics: new AnalyticsEngine(),
      modelRouter: new ModelRouter(),
      conversationManager: new ConversationManager(),
      advancedCache: new AdvancedCache()
    };
    const cli = new AdvancedCLI(managers);
    reportTest('Advanced CLI', 'Create instance', cli !== null);
  } catch (e) {
    reportTest('Advanced CLI', 'Module working', false, e);
  }

  // Summary
  console.log(`\n${BOLD}${CYAN}═══════════════════════════════════════════════════════════${NORMAL}`);
  console.log(`\n${BOLD}TEST SUMMARY${NORMAL}`);
  console.log(`Passed: ${GREEN}${passedTests}${NORMAL}`);
  console.log(`Failed: ${RED}${failedTests}${NORMAL}`);
  console.log(`\nTotal Tests: ${totalTests}`);
  const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
  console.log(`Pass Rate: ${passRate}%`);

  if (failedTests === 0) {
    console.log(`\n${GREEN}${BOLD}✓ ALL TESTS PASSED${NORMAL}\n`);
    process.exit(0);
  } else {
    console.log(`\n${RED}${BOLD}✘ SOME TESTS FAILED${NORMAL}\n`);
    process.exit(1);
  }
}

// Run tests
runTests();
