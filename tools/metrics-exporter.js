/**
 * Metrics Exporter for Chat LLM v2.2
 * 
 * Exports system metrics in Prometheus-compatible format
 * Also supports JSON export for custom dashboards
 * 
 * @module MetricsExporter
 * @version 2.2.0
 */

const fs = require('fs');
const path = require('path');

class MetricsExporter {
    constructor(performanceMonitor, cache, memory, agentManager) {
        this.performanceMonitor = performanceMonitor;
        this.cache = cache;
        this.memory = memory;
        this.agentManager = agentManager;
        this.startTime = Date.now();
    }

    /**
     * Export metrics in Prometheus text format
     * https://prometheus.io/docs/instrumenting/exposition_formats/
     */
    exportPrometheus() {
        const metrics = [];
        const timestamp = Date.now();

        // System uptime
        metrics.push('# HELP chatllm_uptime_seconds System uptime in seconds');
        metrics.push('# TYPE chatllm_uptime_seconds counter');
        metrics.push(`chatllm_uptime_seconds ${(timestamp - this.startTime) / 1000}`);

        // Performance metrics
        if (this.performanceMonitor) {
            const perfStats = this.performanceMonitor.getOverallStats();
            
            metrics.push('# HELP chatllm_requests_total Total number of requests');
            metrics.push('# TYPE chatllm_requests_total counter');
            metrics.push(`chatllm_requests_total ${perfStats.totalOperations || 0}`);

            metrics.push('# HELP chatllm_request_duration_seconds Request duration histogram');
            metrics.push('# TYPE chatllm_request_duration_seconds histogram');
            metrics.push(`chatllm_request_duration_seconds_sum ${(perfStats.totalDuration || 0) / 1000}`);
            metrics.push(`chatllm_request_duration_seconds_count ${perfStats.totalOperations || 0}`);

            if (perfStats.avgDuration) {
                metrics.push('# HELP chatllm_request_duration_avg_seconds Average request duration');
                metrics.push('# TYPE chatllm_request_duration_avg_seconds gauge');
                metrics.push(`chatllm_request_duration_avg_seconds ${perfStats.avgDuration / 1000}`);
            }
        }

        // Cache metrics
        if (this.cache) {
            const cacheStats = this.cache.getStats();
            
            metrics.push('# HELP chatllm_cache_hits_total Total cache hits');
            metrics.push('# TYPE chatllm_cache_hits_total counter');
            metrics.push(`chatllm_cache_hits_total ${cacheStats.hits || 0}`);

            metrics.push('# HELP chatllm_cache_misses_total Total cache misses');
            metrics.push('# TYPE chatllm_cache_misses_total counter');
            metrics.push(`chatllm_cache_misses_total ${cacheStats.misses || 0}`);

            metrics.push('# HELP chatllm_cache_size_bytes Cache size in bytes');
            metrics.push('# TYPE chatllm_cache_size_bytes gauge');
            metrics.push(`chatllm_cache_size_bytes ${cacheStats.diskCacheSize || 0}`);

            const hitRate = cacheStats.hits + cacheStats.misses > 0
                ? cacheStats.hits / (cacheStats.hits + cacheStats.misses)
                : 0;
            
            metrics.push('# HELP chatllm_cache_hit_rate Cache hit rate (0-1)');
            metrics.push('# TYPE chatllm_cache_hit_rate gauge');
            metrics.push(`chatllm_cache_hit_rate ${hitRate.toFixed(4)}`);
        }

        // Memory metrics
        if (this.memory) {
            const memStats = this.memory.getStats();
            
            metrics.push('# HELP chatllm_conversations_total Total conversations');
            metrics.push('# TYPE chatllm_conversations_total gauge');
            metrics.push(`chatllm_conversations_total ${memStats.conversations || 0}`);

            metrics.push('# HELP chatllm_messages_total Total messages stored');
            metrics.push('# TYPE chatllm_messages_total gauge');
            metrics.push(`chatllm_messages_total ${memStats.totalMessages || 0}`);
        }

        // Agent metrics
        if (this.agentManager) {
            const agentStats = this.agentManager.getStats();
            
            metrics.push('# HELP chatllm_agent_activations_total Agent activations by type');
            metrics.push('# TYPE chatllm_agent_activations_total counter');
            
            Object.keys(agentStats).forEach(agentId => {
                const count = agentStats[agentId].activations || 0;
                metrics.push(`chatllm_agent_activations_total{agent="${agentId}"} ${count}`);
            });
        }

        // Process metrics
        const memUsage = process.memoryUsage();
        metrics.push('# HELP chatllm_memory_heap_bytes Process heap memory usage');
        metrics.push('# TYPE chatllm_memory_heap_bytes gauge');
        metrics.push(`chatllm_memory_heap_bytes ${memUsage.heapUsed}`);

        metrics.push('# HELP chatllm_memory_rss_bytes Process RSS memory');
        metrics.push('# TYPE chatllm_memory_rss_bytes gauge');
        metrics.push(`chatllm_memory_rss_bytes ${memUsage.rss}`);

        return metrics.join('\n') + '\n';
    }

    /**
     * Export metrics in JSON format
     */
    exportJSON() {
        const timestamp = Date.now();
        const metrics = {
            timestamp: new Date(timestamp).toISOString(),
            uptime: timestamp - this.startTime,
            version: '2.2.0'
        };

        // Performance
        if (this.performanceMonitor) {
            metrics.performance = this.performanceMonitor.getOverallStats();
        }

        // Cache
        if (this.cache) {
            metrics.cache = this.cache.getStats();
        }

        // Memory
        if (this.memory) {
            metrics.memory = this.memory.getStats();
        }

        // Agents
        if (this.agentManager) {
            metrics.agents = this.agentManager.getStats();
        }

        // Process
        const memUsage = process.memoryUsage();
        metrics.process = {
            memory: {
                heapUsed: memUsage.heapUsed,
                heapTotal: memUsage.heapTotal,
                rss: memUsage.rss,
                external: memUsage.external
            },
            uptime: process.uptime(),
            pid: process.pid
        };

        return metrics;
    }

    /**
     * Export metrics to file
     */
    exportToFile(filePath, format = 'json') {
        const data = format === 'prometheus' 
            ? this.exportPrometheus()
            : JSON.stringify(this.exportJSON(), null, 2);

        fs.writeFileSync(filePath, data, 'utf8');
        return filePath;
    }

    /**
     * Get metrics summary for display
     */
    getSummary() {
        const metrics = this.exportJSON();
        
        return {
            uptime: `${Math.floor(metrics.uptime / 1000 / 60)} minutes`,
            requests: metrics.performance?.totalOperations || 0,
            cacheHitRate: metrics.cache?.hitRate || '0%',
            conversations: metrics.memory?.conversations || 0,
            memoryUsage: `${Math.floor(metrics.process.memory.heapUsed / 1024 / 1024)}MB`
        };
    }
}

module.exports = { MetricsExporter };
