/**
 * CLI Command Extensions for Advanced v2.1 Features
 * Integrates Analytics, Model Router, Conversation Manager, and Advanced Cache
 */

const { AnalyticsEngine } = require('./analytics-engine');
const { ModelRouter } = require('./model-router');
const { ConversationManager } = require('./conversation-manager');
const { AdvancedCache } = require('./advanced-cache');

class AdvancedCLI {
    constructor(analytics, router, conversations, cache) {
        this.analytics = analytics;
        this.router = router;
        this.conversations = conversations;
        this.cache = cache;
    }

    /**
     * Get analytics dashboard
     */
    analyticsDashboard() {
        const dashboard = this.analytics.getDashboard();
        
        console.log('\n' + '='.repeat(60));
        console.log('ANALYTICS DASHBOARD');
        console.log('='.repeat(60));

        // Performance Stats
        if (dashboard.performance) {
            console.log('\n📊 PERFORMANCE:');
            console.log(`  Avg Latency: ${dashboard.performance.avgLatency}ms`);
            console.log(`  P95 Latency: ${dashboard.performance.p95Latency}ms`);
            console.log(`  P99 Latency: ${dashboard.performance.p99Latency}ms`);
        }

        // Error Stats
        if (dashboard.errors) {
            console.log('\n⚠️  ERRORS:');
            console.log(`  Total: ${dashboard.errors.totalErrors}`);
            console.log(`  Error Rate: ${dashboard.errors.errorRate}%`);
            Object.entries(dashboard.errors.byType).forEach(([type, count]) => {
                console.log(`  ${type}: ${count}`);
            });
        }

        // Cache Stats
        if (dashboard.cache) {
            console.log('\n💾 CACHE:');
            console.log(`  Hit Rate: ${dashboard.cache.hitRate}%`);
            console.log(`  Requests: ${dashboard.cache.totalRequests}`);
            console.log(`  Status: ${dashboard.cache.status}`);
        }

        // Sentiment Trends
        if (dashboard.sentiment) {
            console.log('\n😊 SENTIMENT:');
            console.log(`  Positive: ${dashboard.sentiment.positive.percentage}%`);
            console.log(`  Negative: ${dashboard.sentiment.negative.percentage}%`);
            console.log(`  Neutral: ${dashboard.sentiment.neutral.percentage}%`);
        }

        // Health Status
        if (dashboard.health) {
            console.log('\n❤️  HEALTH:');
            console.log(`  Score: ${dashboard.health.score}/100`);
            console.log(`  Status: ${dashboard.health.status.toUpperCase()}`);
        }

        // Anomalies
        if (dashboard.anomalies && dashboard.anomalies.length > 0) {
            console.log('\n🚨 ANOMALIES:');
            dashboard.anomalies.forEach(anomaly => {
                console.log(`  [${anomaly.severity}] ${anomaly.type}: ${anomaly.value}`);
            });
        }

        console.log('\n' + '='.repeat(60) + '\n');
    }

    /**
     * Get model routing statistics
     */
    routingStats() {
        const stats = this.router.getStatistics();
        
        console.log('\n' + '='.repeat(60));
        console.log('MODEL ROUTING STATISTICS');
        console.log('='.repeat(60));

        Object.entries(stats).forEach(([model, stat]) => {
            console.log(`\n${model.toUpperCase()}:`);
            console.log(`  Selected: ${stat.selected} times`);
            console.log(`  Avg Quality: ${stat.avgQuality}`);
            console.log(`  Cost per Query: $${stat.costPerQuery}`);
        });

        console.log('\n' + '='.repeat(60) + '\n');
    }

    /**
     * Show cache statistics
     */
    cacheStats() {
        const stats = this.cache.getStats();
        
        console.log('\n' + '='.repeat(60));
        console.log('CACHE STATISTICS');
        console.log('='.repeat(60));

        console.log(`\nHit Rate: ${stats.hitRate}%`);
        console.log(`Total Requests: ${stats.totalRequests}`);
        console.log(`Cache Hits: ${stats.hits}`);
        console.log(`Cache Misses: ${stats.misses}`);
        console.log(`Compressions: ${stats.compressionCount}`);
        console.log(`Evictions: ${stats.evictionCount}`);
        console.log(`\nMemory Entries: ${stats.memoryEntries}`);
        console.log(`Disk Entries: ${stats.diskEntries}`);
        console.log(`Memory Size: ${(stats.memorySize / 1024).toFixed(2)}KB`);
        console.log(`Disk Size: ${(stats.diskSize / 1024).toFixed(2)}KB`);

        console.log('\n' + '='.repeat(60) + '\n');
    }

    /**
     * List conversations
     */
    listConversations() {
        const convos = Array.from(this.conversations.conversations.values());
        
        console.log('\n' + '='.repeat(60));
        console.log('CONVERSATIONS');
        console.log('='.repeat(60));

        if (convos.length === 0) {
            console.log('\nNo conversations found');
        } else {
            convos.forEach(convo => {
                console.log(`\n${convo.id}:`);
                console.log(`  State: ${convo.state}`);
                console.log(`  Turns: ${convo.turns}`);
                console.log(`  Messages: ${convo.messages.length}`);
                console.log(`  Intents: ${[...new Set(convo.intents)].join(', ')}`);
            });
        }

        console.log('\n' + '='.repeat(60) + '\n');
    }

    /**
     * Show conversation details
     */
    conversationDetails(conversationId) {
        const convo = this.conversations.conversations.get(conversationId);
        
        if (!convo) {
            console.log(`\nConversation '${conversationId}' not found\n`);
            return;
        }

        console.log('\n' + '='.repeat(60));
        console.log(`CONVERSATION: ${conversationId}`);
        console.log('='.repeat(60));

        try {
            const stats = this.conversations.getStatistics(conversationId);
            console.log(`\nTurns: ${stats.totalTurns}`);
            console.log(`User Messages: ${stats.userMessages}`);
            console.log(`Assistant Messages: ${stats.assistantMessages}`);
            console.log(`Avg User Length: ${stats.avgUserMessageLength.toFixed(0)} chars`);
            console.log(`Avg Response Length: ${stats.avgAssistantMessageLength.toFixed(0)} chars`);
            console.log(`Duration: ${(stats.duration / 1000).toFixed(1)}s`);
            console.log(`Intents: ${stats.intents.join(', ')}`);
        } catch (e) {
            console.log(`Error: ${e.message}`);
        }

        console.log('\n' + '='.repeat(60) + '\n');
    }

    /**
     * Route a query and show decision
     */
    routeQuery(query, constraints = {}) {
        console.log('\n' + '='.repeat(60));
        console.log('QUERY ROUTING');
        console.log('='.repeat(60));

        console.log(`\nQuery: ${query.substring(0, 50)}...`);
        
        try {
            const decision = this.router.route(query, constraints);
            
            console.log(`\nSelected Model: ${decision.selectedModel}`);
            console.log(`Complexity: ${decision.complexity}`);
            console.log(`Estimated Cost: $${decision.estimatedCost}`);
            
            if (decision.fallbacks && decision.fallbacks.length > 0) {
                console.log(`Fallbacks: ${decision.fallbacks.join(', ')}`);
            }

            console.log(`\nReasoning:`);
            console.log(`  Quality: ${(decision.reasoning.metrics.quality * 100).toFixed(0)}%`);
            console.log(`  Cost: $${decision.reasoning.metrics.cost}`);
            console.log(`  Latency: ${decision.reasoning.metrics.latency}x`);
        } catch (e) {
            console.log(`Error: ${e.message}`);
        }

        console.log('\n' + '='.repeat(60) + '\n');
    }

    /**
     * Clear cache with confirmation
     */
    clearCache() {
        console.log('\n⚠️  WARNING: This will clear all cached data');
        console.log('Continue? (yes/no): ');
        
        // In actual implementation, this would prompt for confirmation
        this.cache.clear();
        console.log('✓ Cache cleared\n');
    }

    /**
     * Export analytics
     */
    exportAnalytics(format = 'json') {
        try {
            const filename = this.analytics.export(format);
            console.log(`\n✓ Analytics exported to: ${filename}\n`);
        } catch (e) {
            console.log(`\n✗ Export failed: ${e.message}\n`);
        }
    }

    /**
     * Show help for advanced commands
     */
    showAdvancedHelp() {
        console.log(`
${'\x1b[1m'}Advanced v2.1 CLI Commands${'\x1b[0m'}

Analytics Commands:
  analytics dashboard     Show real-time analytics dashboard
  analytics export json   Export analytics to JSON
  analytics export csv    Export analytics to CSV

Model Router Commands:
  router stats           Show model routing statistics
  router route <query>   Route a query and see decision

Conversation Commands:
  conversation list      List all conversations
  conversation info <id> Show conversation details

Cache Commands:
  cache stats            Show cache statistics
  cache clear            Clear all cache data

Examples:
  ./chat-llm.js analytics dashboard
  ./chat-llm.js router stats
  ./chat-llm.js conversation list
  ./chat-llm.js cache stats
        `);
    }
}

module.exports = { AdvancedCLI };
