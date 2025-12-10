/**
 * Advanced Features Integration Examples
 * Demonstrates how to use v2.1 features in real scenarios
 */

// Example 1: Using Analytics Engine for monitoring
async function exampleAnalyticsMonitoring() {
    const { AnalyticsEngine } = require('./tools/analytics-engine');
    
    const analytics = new AnalyticsEngine('./analytics');

    // Simulate API request
    const startTime = Date.now();
    // const response = await chat([...messages]);
    const latency = Date.now() - startTime;

    // Record metrics
    analytics.recordMetric('performance', {
        latency,
        model: 'gpt-4',
        tokens: 150,
        success: true
    });

    analytics.recordMetric('request', {
        endpoint: 'chat',
        method: 'POST',
        cached: false
    });

    // Check health
    const dashboard = analytics.getDashboard();
    if (dashboard.health.score < 50) {
        console.warn('System health degraded:', dashboard.health);
    }

    // Export daily
    if (new Date().getHours() === 0) {
        analytics.export('json');
        analytics.export('csv');
    }
}

// Example 2: Cost-optimized query routing
async function exampleCostOptimization() {
    const { ModelRouter } = require('./tools/model-router');

    const router = new ModelRouter();

    // Route for cost optimization
    const simpleQuery = 'What is 2+2?';
    const decision = router.route(simpleQuery, {
        priority: 'cost',  // Optimize for cost
        maxCost: 0.5       // Use only cheap models
    });

    console.log(`Simple query uses: ${decision.selectedModel}`);
    // Output: Simple query uses: fast

    // Complex query
    const complexQuery = `
        Analyze this code and explain the algorithm, 
        identify potential bugs, and suggest optimizations:
        [large code block]
    `;

    const complexDecision = router.route(complexQuery, {
        priority: 'quality',  // Optimize for quality
        requiredCapabilities: ['reasoning']
    });

    console.log(`Complex query uses: ${complexDecision.selectedModel}`);
    // Output: Complex query uses: powerful
}

// Example 3: Multi-turn conversation tracking
async function exampleConversationTracking() {
    const { ConversationManager } = require('./tools/conversation-manager');

    const manager = new ConversationManager();
    const conversationId = 'session-' + Date.now();

    // Start conversation
    manager.startConversation(conversationId, {
        userId: 'user-123',
        platform: 'web',
        language: 'en'
    });

    // Simulate multi-turn conversation
    const exchanges = [
        { user: 'What is machine learning?', assistant: 'ML is...' },
        { user: 'Can you give examples?', assistant: 'Sure, examples include...' },
        { user: 'How is it used in practice?', assistant: 'In practice, ML is used...' }
    ];

    for (const exchange of exchanges) {
        manager.addMessage(conversationId, 'user', exchange.user);
        manager.addMessage(conversationId, 'assistant', exchange.assistant);
    }

    // Get optimized context for next response
    const context = manager.getOptimizedContext(conversationId, 4000);
    console.log('Conversation context:', {
        summary: context.summary,
        recentMessages: context.recentMessages.length,
        intents: context.intents
    });

    // Get statistics
    const stats = manager.getStatistics(conversationId);
    console.log('Conversation stats:', {
        turns: stats.totalTurns,
        avgUserLength: stats.avgUserMessageLength.toFixed(0),
        avgResponseLength: stats.avgAssistantMessageLength.toFixed(0)
    });

    // End conversation
    manager.endConversation(conversationId, {
        satisfied: true,
        duration: stats.duration
    });
}

// Example 4: Intelligent caching with semantic search
async function exampleSemanticCaching() {
    const { AdvancedCache } = require('./tools/advanced-cache');

    const cache = new AdvancedCache({
        maxMemorySize: 100 * 1024 * 1024,
        semanticThreshold: 0.85
    });

    // Cache an answer
    cache.set('What is the capital of France?', {
        answer: 'Paris',
        confidence: 0.99,
        source: 'gpt-4'
    });

    // Try exact match
    let result = cache.get('What is the capital of France?');
    if (result) {
        console.log('Exact match found:', result.answer);
    }

    // Try semantic match
    result = cache.semanticGet('whats the capital of france', 0.85);
    if (result) {
        console.log(`Semantic match found (similarity: ${result.similarity.toFixed(2)}):`, result.value.answer);
    }

    // Prefetch related queries
    const relatedQueries = [
        'What is the population of France?',
        'What is the area of France?',
        'When was Paris founded?'
    ];

    cache.set('What is the population of France?', { answer: '67 million' });
    cache.set('What is the area of France?', { answer: '643,801 km²' });

    const prefetched = cache.prefetch(relatedQueries, 'high');
    console.log(`Prefetched ${prefetched.length} related answers`);

    // Invalidate by pattern
    cache.invalidate(null, { pattern: '.*France.*' });

    // Check stats
    const stats = cache.getStats();
    console.log('Cache performance:', {
        hitRate: stats.hitRate,
        compressionCount: stats.compressionCount,
        memoryUsage: (stats.memorySize / 1024).toFixed(2) + 'KB'
    });
}

// Example 5: Complete pipeline integration
async function exampleFullPipeline() {
    const { AnalyticsEngine } = require('./tools/analytics-engine');
    const { ModelRouter } = require('./tools/model-router');
    const { ConversationManager } = require('./tools/conversation-manager');
    const { AdvancedCache } = require('./tools/advanced-cache');

    // Initialize all tools
    const analytics = new AnalyticsEngine('./analytics');
    const router = new ModelRouter();
    const conversations = new ConversationManager('./conversations');
    const cache = new AdvancedCache();

    const userQuery = 'What is cloud computing?';
    const conversationId = 'session-' + Date.now();

    console.log('Processing query:', userQuery);
    console.log('');

    // Step 1: Start conversation
    conversations.startConversation(conversationId);
    console.log('✓ Conversation started');

    // Step 2: Check cache
    let response = cache.semanticGet(userQuery, 0.9);
    const cached = !!response;
    
    if (!cached) {
        console.log('✓ Cache miss - routing query');

        // Step 3: Route query
        const decision = router.route(userQuery, { priority: 'cost' });
        console.log(`✓ Routed to: ${decision.selectedModel} (cost: $${decision.estimatedCost})`);

        // Step 4: Simulate API call
        const startTime = Date.now();
        response = 'Cloud computing is the delivery of computing services...';
        const latency = Date.now() - startTime;

        // Step 5: Cache response
        cache.set(userQuery, response, { ttl: 24 * 60 * 60 * 1000 });
        console.log('✓ Response cached');

        // Step 6: Record metrics
        analytics.recordMetric('performance', {
            latency,
            model: decision.selectedModel,
            cached: false
        });
    } else {
        console.log('✓ Cache hit - using cached response');
        analytics.recordMetric('performance', {
            latency: 5,
            cached: true
        });
    }

    // Step 7: Add to conversation
    conversations.addMessage(conversationId, 'user', userQuery);
    conversations.addMessage(conversationId, 'assistant', response);
    console.log('✓ Added to conversation history');

    // Step 8: Get optimized context
    const context = conversations.getOptimizedContext(conversationId);
    console.log(`✓ Context ready (${context.recentMessages.length} messages)`);

    // Step 9: Check analytics
    const dashboard = analytics.getDashboard();
    console.log(`✓ System health: ${dashboard.health.status.toUpperCase()} (${dashboard.health.score}/100)`);

    console.log('');
    console.log('Pipeline complete!');
    
    return { response, conversationId, cached };
}

// Example 6: Monitoring and alerting
async function exampleMonitoring() {
    const { AnalyticsEngine } = require('./tools/analytics-engine');

    const analytics = new AnalyticsEngine('./analytics');

    // Simulate degraded performance
    for (let i = 0; i < 100; i++) {
        const latency = Math.random() * 8000; // Some will exceed threshold
        
        analytics.recordMetric('performance', {
            latency,
            success: latency < 5000
        });

        analytics.recordMetric('error', {
            category: latency >= 5000 ? 'timeout' : 'none'
        });
    }

    // Check health
    const dashboard = analytics.getDashboard();

    // Alert on degraded health
    if (dashboard.health.score < 50) {
        console.warn('🚨 ALERT: System health critical');
        console.warn('Recent anomalies:', dashboard.anomalies);
        
        // Actions to take:
        // - Send alert to ops team
        // - Switch to fallback models
        // - Enable cache-only mode
        // - Reduce rate limits
    }

    // Check for specific anomalies
    dashboard.anomalies.forEach(anomaly => {
        if (anomaly.severity === 'critical') {
            console.warn(`Critical issue detected: ${anomaly.type}`);
        }
    });
}

// Export examples
module.exports = {
    exampleAnalyticsMonitoring,
    exampleCostOptimization,
    exampleConversationTracking,
    exampleSemanticCaching,
    exampleFullPipeline,
    exampleMonitoring
};

// Run examples
if (require.main === module) {
    console.log('Advanced Features Integration Examples\n');
    console.log('Run individual examples from your code:');
    console.log('  - exampleAnalyticsMonitoring()');
    console.log('  - exampleCostOptimization()');
    console.log('  - exampleConversationTracking()');
    console.log('  - exampleSemanticCaching()');
    console.log('  - exampleFullPipeline()');
    console.log('  - exampleMonitoring()');
}
