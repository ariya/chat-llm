#!/usr/bin/env node

/**
 * Comprehensive Module Tests for Chat-LLM v2
 * Tests all tools and core functionality
 */

const fs = require('fs');
const path = require('path');

// Color codes
const GREEN = '\x1b[92m';
const RED = '\x1b[91m';
const YELLOW = '\x1b[93m';
const CYAN = '\x1b[36m';
const NORMAL = '\x1b[0m';
const BOLD = '\x1b[1m';

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to test module imports
function testModuleImport(modulePath, moduleName) {
  try {
    const module = require(modulePath);
    console.log(`${GREEN}✓${NORMAL} ${moduleName}: Import successful`);
    results.passed++;
    results.tests.push({ name: moduleName, status: 'PASS', message: 'Module imported' });
    return module;
  } catch (e) {
    console.log(`${RED}✗${NORMAL} ${moduleName}: Import failed - ${e.message}`);
    results.failed++;
    results.tests.push({ name: moduleName, status: 'FAIL', message: e.message });
    return null;
  }
}

// Helper function to test module functionality
function testModuleFunctionality(module, moduleName, tests) {
  try {
    if (!module) return false;
    
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        test.fn(module);
        passed++;
      } catch (e) {
        failed++;
        console.log(`  ${RED}✗${NORMAL} ${test.name}: ${e.message}`);
      }
    }

    if (failed === 0) {
      console.log(`${GREEN}✓${NORMAL} ${moduleName}: All ${passed} tests passed`);
      results.passed += passed;
      return true;
    } else {
      console.log(`${YELLOW}⚠${NORMAL} ${moduleName}: ${passed} passed, ${failed} failed`);
      results.failed += failed;
      return false;
    }
  } catch (e) {
    console.log(`${RED}✗${NORMAL} ${moduleName}: Test execution failed`);
    results.failed++;
    return false;
  }
}

console.log(`\n${BOLD}${CYAN}═══════════════════════════════════════════════════════════${NORMAL}`);
console.log(`${BOLD}${CYAN}CHAT-LLM V2 - COMPREHENSIVE MODULE UNIT TESTS${NORMAL}`);
console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════════${NORMAL}\n`);

// Test v2.0 Core Tools
console.log(`${BOLD}Core Tools (v2.0):${NORMAL}\n`);

// 1. Sentiment Analyzer
testModuleImport('./tools/sentiment_analyzer', 'Sentiment Analyzer');
const sentimentAnalyzer = testModuleImport('./tools/sentiment_analyzer', 'Sentiment Analyzer');
if (sentimentAnalyzer) {
  testModuleFunctionality(sentimentAnalyzer, 'Sentiment Analyzer', [
    {
      name: 'Analyze positive sentiment',
      fn: (mod) => {
        const result = mod.analyzeSentiment('This is amazing!');
        if (!result || !result.sentiment) throw new Error('No sentiment returned');
        if (result.sentiment !== 'positive') throw new Error(`Expected positive, got ${result.sentiment}`);
      }
    },
    {
      name: 'Analyze negative sentiment',
      fn: (mod) => {
        const result = mod.analyzeSentiment('This is terrible');
        if (!result.sentiment) throw new Error('No sentiment returned');
      }
    },
    {
      name: 'Return score',
      fn: (mod) => {
        const result = mod.analyzeSentiment('Good');
        if (typeof result.score !== 'number') throw new Error('Score not a number');
      }
    }
  ]);
}

// 2. Request Logger
const RequestLogger = require('./tools/request-logger').RequestLogger;
testModuleFunctionality({ RequestLogger }, 'Request Logger', [
  {
    name: 'Create logger instance',
    fn: (mod) => {
      const logger = new mod.RequestLogger('./logs-test');
      if (!logger) throw new Error('Logger not created');
    }
  },
  {
    name: 'Log request',
    fn: (mod) => {
      const logger = new mod.RequestLogger('./logs-test');
      logger.logRequest('test-request', 'test-input', 'test-output', 100, { model: 'test' });
    }
  },
  {
    name: 'Get statistics',
    fn: (mod) => {
      const logger = new mod.RequestLogger('./logs-test');
      const stats = logger.getStats();
      if (!stats) throw new Error('Stats not available');
    }
  }
]);

// 3. Response Cache
const ResponseCache = require('./tools/response-cache').ResponseCache;
testModuleFunctionality({ ResponseCache }, 'Response Cache', [
  {
    name: 'Create cache instance',
    fn: (mod) => {
      const cache = new mod.ResponseCache('./cache-test');
      if (!cache) throw new Error('Cache not created');
    }
  },
  {
    name: 'Set and get value',
    fn: (mod) => {
      const cache = new mod.ResponseCache('./cache-test');
      cache.set('test-key', 'test-value');
      const value = cache.get('test-key');
      if (value !== 'test-value') throw new Error('Cache value mismatch');
    }
  },
  {
    name: 'Invalid key returns null',
    fn: (mod) => {
      const cache = new mod.ResponseCache('./cache-test');
      const value = cache.get('nonexistent-key');
      if (value !== null) throw new Error('Invalid key should return null');
    }
  }
]);

// 4. Config Manager
const ConfigManager = require('./tools/config-manager').ConfigManager;
testModuleFunctionality({ ConfigManager }, 'Config Manager', [
  {
    name: 'Create config instance',
    fn: (mod) => {
      const config = new mod.ConfigManager('./config-test');
      if (!config) throw new Error('Config not created');
    }
  },
  {
    name: 'Set and get config',
    fn: (mod) => {
      const config = new mod.ConfigManager('./config-test');
      config.set('test.key', 'test-value');
      const value = config.get('test.key');
      if (value !== 'test-value') throw new Error('Config value mismatch');
    }
  },
  {
    name: 'Get all config',
    fn: (mod) => {
      const config = new mod.ConfigManager('./config-test');
      const all = config.getAll();
      if (typeof all !== 'object') throw new Error('Config not an object');
    }
  }
]);

// 5. Performance Monitor
const PerformanceMonitor = require('./tools/performance-monitor').PerformanceMonitor;
testModuleFunctionality({ PerformanceMonitor }, 'Performance Monitor', [
  {
    name: 'Create monitor instance',
    fn: (mod) => {
      const monitor = new mod.PerformanceMonitor();
      if (!monitor) throw new Error('Monitor not created');
    }
  },
  {
    name: 'Record metric',
    fn: (mod) => {
      const monitor = new mod.PerformanceMonitor();
      monitor.record('test', 100);
    }
  },
  {
    name: 'Get statistics',
    fn: (mod) => {
      const monitor = new mod.PerformanceMonitor();
      monitor.record('test', 100);
      const stats = monitor.getStats('test');
      if (!stats) throw new Error('Stats not available');
    }
  }
]);

// Test v2.1 Advanced Tools
console.log(`\n${BOLD}Advanced Tools (v2.1):${NORMAL}\n`);

// 6. Analytics Engine
const AnalyticsEngine = require('./tools/analytics-engine').AnalyticsEngine;
testModuleFunctionality({ AnalyticsEngine }, 'Analytics Engine', [
  {
    name: 'Create analytics instance',
    fn: (mod) => {
      const analytics = new mod.AnalyticsEngine('./analytics-test');
      if (!analytics) throw new Error('Analytics not created');
    }
  },
  {
    name: 'Record metric',
    fn: (mod) => {
      const analytics = new mod.AnalyticsEngine('./analytics-test');
      analytics.recordMetric('performance', { latency: 250 });
    }
  },
  {
    name: 'Get dashboard',
    fn: (mod) => {
      const analytics = new mod.AnalyticsEngine('./analytics-test');
      const dashboard = analytics.getDashboard();
      if (!dashboard) throw new Error('Dashboard not generated');
    }
  },
  {
    name: 'Calculate health',
    fn: (mod) => {
      const analytics = new mod.AnalyticsEngine('./analytics-test');
      const health = analytics.calculateHealth();
      if (!health || typeof health.score !== 'number') throw new Error('Health not calculated');
    }
  }
]);

// 7. Model Router
const ModelRouter = require('./tools/model-router').ModelRouter;
testModuleFunctionality({ ModelRouter }, 'Model Router', [
  {
    name: 'Create router instance',
    fn: (mod) => {
      const router = new mod.ModelRouter();
      if (!router) throw new Error('Router not created');
    }
  },
  {
    name: 'Route query',
    fn: (mod) => {
      const router = new mod.ModelRouter();
      const decision = router.route('What is 2+2?');
      if (!decision || !decision.selectedModel) throw new Error('Route decision failed');
    }
  },
  {
    name: 'Add custom model',
    fn: (mod) => {
      const router = new mod.ModelRouter();
      router.addModel('custom', { cost: 1.5, latency: 1.0, quality: 0.85, capabilities: ['text'] });
      if (!router.models['custom']) throw new Error('Custom model not added');
    }
  },
  {
    name: 'Get statistics',
    fn: (mod) => {
      const router = new mod.ModelRouter();
      const stats = router.getStatistics();
      if (typeof stats !== 'object') throw new Error('Statistics not returned');
    }
  }
]);

// 8. Conversation Manager
const ConversationManager = require('./tools/conversation-manager').ConversationManager;
testModuleFunctionality({ ConversationManager }, 'Conversation Manager', [
  {
    name: 'Create manager instance',
    fn: (mod) => {
      const manager = new mod.ConversationManager('./conversations-test');
      if (!manager) throw new Error('Manager not created');
    }
  },
  {
    name: 'Start conversation',
    fn: (mod) => {
      const manager = new mod.ConversationManager('./conversations-test');
      const convo = manager.startConversation('test-123');
      if (!convo) throw new Error('Conversation not started');
    }
  },
  {
    name: 'Add message',
    fn: (mod) => {
      const manager = new mod.ConversationManager('./conversations-test');
      manager.startConversation('test-456');
      manager.addMessage('test-456', 'user', 'Hello');
      if (manager.conversations.get('test-456').messages.length === 0) throw new Error('Message not added');
    }
  },
  {
    name: 'Get optimized context',
    fn: (mod) => {
      const manager = new mod.ConversationManager('./conversations-test');
      manager.startConversation('test-789');
      manager.addMessage('test-789', 'user', 'What is AI?');
      const context = manager.getOptimizedContext('test-789');
      if (!context) throw new Error('Context not optimized');
    }
  }
]);

// 9. Advanced Cache
const AdvancedCache = require('./tools/advanced-cache').AdvancedCache;
testModuleFunctionality({ AdvancedCache }, 'Advanced Cache', [
  {
    name: 'Create cache instance',
    fn: (mod) => {
      const cache = new mod.AdvancedCache();
      if (!cache) throw new Error('Cache not created');
    }
  },
  {
    name: 'Set and get value',
    fn: (mod) => {
      const cache = new mod.AdvancedCache();
      cache.set('key', 'value');
      const result = cache.get('key');
      if (result !== 'value') throw new Error('Cache get/set failed');
    }
  },
  {
    name: 'Semantic search',
    fn: (mod) => {
      const cache = new mod.AdvancedCache();
      cache.set('hello world', 'greeting');
      const result = cache.semanticGet('hello world', 0.85);
      if (!result) throw new Error('Semantic search failed');
    }
  },
  {
    name: 'Get statistics',
    fn: (mod) => {
      const cache = new mod.AdvancedCache();
      const stats = cache.getStats();
      if (!stats) throw new Error('Stats not available');
    }
  }
]);

// 10. Advanced CLI
const AdvancedCLI = require('./tools/advanced-cli').AdvancedCLI;
testModuleFunctionality({ AdvancedCLI }, 'Advanced CLI', [
  {
    name: 'Create CLI instance',
    fn: (mod) => {
      const analytics = new AnalyticsEngine('./analytics-test');
      const router = new ModelRouter();
      const conversations = new ConversationManager('./conversations-test');
      const cache = new AdvancedCache();
      const cli = new mod.AdvancedCLI(analytics, router, conversations, cache);
      if (!cli) throw new Error('CLI not created');
    }
  }
]);

// Print summary
console.log(`\n${BOLD}${CYAN}═══════════════════════════════════════════════════════════${NORMAL}`);
console.log(`${BOLD}TEST SUMMARY${NORMAL}\n`);
console.log(`Passed: ${results.passed}`);
console.log(`Failed: ${results.failed}`);
console.log(`\nTotal Tests: ${results.passed + results.failed}`);
console.log(`Pass Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

if (results.failed === 0) {
  console.log(`\n${GREEN}${BOLD}✓ ALL TESTS PASSED${NORMAL}\n`);
  process.exit(0);
} else {
  console.log(`\n${RED}${BOLD}✗ SOME TESTS FAILED${NORMAL}\n`);
  process.exit(1);
}
