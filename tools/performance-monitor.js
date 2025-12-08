/**
 * Performance monitoring module for Chat LLM v2
 * Tracks and analyzes application performance metrics
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = [];
        this.startTime = Date.now();
    }

    /**
     * Record a performance metric
     */
    record(operation, duration, metadata = {}) {
        const metric = {
            timestamp: Date.now(),
            operation,
            duration,
            memory: process.memoryUsage(),
            ...metadata
        };
        this.metrics.push(metric);
    }

    /**
     * Get metrics for a specific operation
     */
    getMetricsFor(operation) {
        return this.metrics.filter(m => m.operation === operation);
    }

    /**
     * Calculate statistics for an operation
     */
    getStats(operation) {
        const metrics = this.getMetricsFor(operation);
        if (metrics.length === 0) return null;

        const durations = metrics.map(m => m.duration);
        const sorted = [...durations].sort((a, b) => a - b);

        return {
            operation,
            count: metrics.length,
            totalTime: durations.reduce((a, b) => a + b, 0),
            avgTime: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
            minTime: Math.min(...durations),
            maxTime: Math.max(...durations),
            medianTime: sorted[Math.floor(sorted.length / 2)],
            p95Time: sorted[Math.floor(sorted.length * 0.95)]
        };
    }

    /**
     * Get overall application stats
     */
    getOverallStats() {
        const ops = [...new Set(this.metrics.map(m => m.operation))];
        const stats = {};

        ops.forEach(op => {
            stats[op] = this.getStats(op);
        });

        return {
            uptime: Date.now() - this.startTime,
            totalMetrics: this.metrics.length,
            operations: stats,
            memory: process.memoryUsage()
        };
    }

    /**
     * Clear metrics
     */
    clear() {
        this.metrics = [];
        this.startTime = Date.now();
    }

    /**
     * Export metrics as JSON
     */
    export() {
        return JSON.stringify({
            metrics: this.metrics,
            stats: this.getOverallStats()
        }, null, 2);
    }
}

module.exports = { PerformanceMonitor };
