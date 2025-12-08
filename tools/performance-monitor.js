/**
 * Performance monitoring module for Chat LLM v2
 * Tracks and analyzes application performance metrics with detailed statistics.
 * Monitors operation durations, memory usage, and provides comprehensive analytics.
 * 
 * @module PerformanceMonitor
 * @author yonikashi432
 * @version 2.0.0
 * 
 * @example
 * const monitor = new PerformanceMonitor();
 * const start = Date.now();
 * // ... perform operation ...
 * monitor.record('chat', Date.now() - start, { model: 'gpt-4' });
 * const stats = monitor.getStats('chat');
 */

class PerformanceMonitor {
    /**
     * Initialize the Performance Monitor
     * @param {Object} options - Configuration options
     * @param {number} options.maxMetrics - Maximum number of metrics to store (default: 10000)
     */
    constructor(options = {}) {
        this.metrics = [];
        this.startTime = Date.now();
        this.maxMetrics = options.maxMetrics || 10000;
        this.operations = new Set();
    }

    /**
     * Record a performance metric for an operation
     * @param {string} operation - Operation name/identifier
     * @param {number} duration - Duration in milliseconds
     * @param {Object} metadata - Additional metadata (optional)
     * @throws {TypeError} If operation is not a string or duration is not a number
     * 
     * @example
     * monitor.record('api_call', 250, { endpoint: '/chat', cached: false });
     */
    record(operation, duration, metadata = {}) {
        if (typeof operation !== 'string' || operation.trim().length === 0) {
            throw new TypeError('Operation must be a non-empty string');
        }
        
        if (typeof duration !== 'number' || duration < 0) {
            throw new TypeError('Duration must be a non-negative number');
        }
        
        const metric = {
            timestamp: Date.now(),
            operation: operation.trim(),
            duration: Math.round(duration),
            memory: process.memoryUsage(),
            ...metadata
        };
        
        // Prevent memory overflow
        if (this.metrics.length >= this.maxMetrics) {
            this.metrics.shift(); // Remove oldest metric
        }
        
        this.metrics.push(metric);
        this.operations.add(operation.trim());
    }

    /**
     * Get all metrics for a specific operation
     * @param {string} operation - Operation name to filter by
     * @returns {Array<Object>} Array of metrics for the operation
     * @throws {TypeError} If operation is not a string
     * 
     * @example
     * const chatMetrics = monitor.getMetricsFor('chat');
     */
    getMetricsFor(operation) {
        if (typeof operation !== 'string' || operation.trim().length === 0) {
            throw new TypeError('Operation must be a non-empty string');
        }
        
        return this.metrics.filter(m => m.operation === operation.trim());
    }

    /**
     * Calculate comprehensive statistics for an operation
     * @param {string} operation - Operation name
     * @returns {Object|null} Statistics object or null if no metrics found
     * @property {string} operation - Operation name
     * @property {number} count - Number of recorded operations
     * @property {number} totalTime - Total time spent (ms)
     * @property {number} avgTime - Average duration (ms)
     * @property {number} minTime - Minimum duration (ms)
     * @property {number} maxTime - Maximum duration (ms)
     * @property {number} medianTime - Median duration (ms)
     * @property {number} p95Time - 95th percentile duration (ms)
     * @property {number} p99Time - 99th percentile duration (ms)
     * 
     * @example
     * const stats = monitor.getStats('chat');
     * console.log(`P95 latency: ${stats.p95Time}ms`);
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
            p95Time: sorted[Math.floor(sorted.length * 0.95)],
            p99Time: sorted[Math.floor(sorted.length * 0.99)]
        };
    }

    /**
     * Get comprehensive overall application statistics
     * @returns {Object} Overall statistics including:
     *   - uptime: Application uptime in ms
     *   - uptimeFormatted: Human-readable uptime
     *   - totalMetrics: Total number of recorded metrics
     *   - uniqueOperations: Number of unique operation types
     *   - operations: Statistics per operation
     *   - memory: Current memory usage
     * 
     * @example
     * const overall = monitor.getOverallStats();
     * console.log(`Uptime: ${overall.uptimeFormatted}`);
     */
    getOverallStats() {
        const ops = [...this.operations];
        const stats = {};

        ops.forEach(op => {
            stats[op] = this.getStats(op);
        });

        const uptime = Date.now() - this.startTime;

        return {
            uptime,
            uptimeFormatted: this.formatDuration(uptime),
            totalMetrics: this.metrics.length,
            maxMetrics: this.maxMetrics,
            uniqueOperations: ops.length,
            operations: stats,
            memory: process.memoryUsage(),
            memoryFormatted: this.formatMemory(process.memoryUsage())
        };
    }

    /**
     * Clear all recorded metrics and reset start time
     * 
     * @example
     * monitor.clear(); // Reset all metrics
     */
    clear() {
        this.metrics = [];
        this.operations.clear();
        this.startTime = Date.now();
    }

    /**
     * Export metrics and statistics as JSON string
     * @param {boolean} includeMetrics - Include individual metrics (default: true)
     * @returns {string} JSON string of metrics and statistics
     * 
     * @example
     * const json = monitor.export();
     * fs.writeFileSync('performance.json', json);
     */
    export(includeMetrics = true) {
        const data = {
            stats: this.getOverallStats()
        };
        
        if (includeMetrics) {
            data.metrics = this.metrics;
        }
        
        return JSON.stringify(data, null, 2);
    }
    
    /**
     * Format duration into human-readable string
     * @private
     * @param {number} ms - Duration in milliseconds
     * @returns {string} Formatted duration
     */
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
        if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }
    
    /**
     * Format memory usage into human-readable format
     * @private
     * @param {Object} memory - Memory usage object from process.memoryUsage()
     * @returns {Object} Formatted memory object
     */
    formatMemory(memory) {
        return {
            heapUsed: this.formatBytes(memory.heapUsed),
            heapTotal: this.formatBytes(memory.heapTotal),
            rss: this.formatBytes(memory.rss),
            external: this.formatBytes(memory.external)
        };
    }
    
    /**
     * Format bytes into human-readable format
     * @private
     * @param {number} bytes - Number of bytes
     * @returns {string} Formatted string
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }
    
    /**
     * Get metrics within a time range
     * @param {number} startTime - Start timestamp (ms)
     * @param {number} endTime - End timestamp (ms)
     * @returns {Array<Object>} Metrics within the time range
     * 
     * @example
     * const lastHour = Date.now() - (60 * 60 * 1000);
     * const recentMetrics = monitor.getMetricsInRange(lastHour, Date.now());
     */
    getMetricsInRange(startTime, endTime) {
        if (typeof startTime !== 'number' || typeof endTime !== 'number') {
            throw new TypeError('Start and end times must be numbers');
        }
        
        return this.metrics.filter(m => 
            m.timestamp >= startTime && m.timestamp <= endTime
        );
    }
    
    /**
     * Get list of all tracked operations
     * @returns {Array<string>} Array of operation names
     * 
     * @example
     * const ops = monitor.getOperations();
     * console.log('Tracked operations:', ops.join(', '));
     */
    getOperations() {
        return [...this.operations];
    }
    
    /**
     * Get slowest operations
     * @param {number} limit - Number of results to return (default: 10)
     * @returns {Array<Object>} Slowest metrics
     * 
     * @example
     * const slowest = monitor.getSlowestOperations(5);
     */
    getSlowestOperations(limit = 10) {
        return [...this.metrics]
            .sort((a, b) => b.duration - a.duration)
            .slice(0, limit);
    }
}

module.exports = { PerformanceMonitor };
