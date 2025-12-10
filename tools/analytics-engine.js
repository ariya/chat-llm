/**
 * Analytics Engine - Real-time metrics, performance trending, and anomaly detection
 * Provides comprehensive monitoring and insights into system behavior
 */

const fs = require('fs');
const path = require('path');

class AnalyticsEngine {
    constructor(dataDir = './analytics') {
        this.dataDir = dataDir;
        this.metrics = {
            requests: [],
            responses: [],
            errors: [],
            performance: [],
            sentiment: []
        };
        this.thresholds = {
            latency: { warning: 2000, critical: 5000 },
            errorRate: { warning: 5, critical: 10 },
            cache: { minHitRate: 30 }
        };
        this.anomalies = [];
        this.ensureDir();
        this.loadMetrics();
    }

    ensureDir() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    /**
     * Record a metric event
     * @param {string} type - Metric type (request, response, error, performance, sentiment)
     * @param {Object} data - Metric data
     */
    recordMetric(type, data) {
        const metric = {
            timestamp: new Date().toISOString(),
            type,
            ...data
        };

        if (this.metrics[type]) {
            this.metrics[type].push(metric);
            this.detectAnomalies(type, metric);
            this.pruneOldMetrics(type);
        }
    }

    /**
     * Detect anomalies in metrics
     * @param {string} type - Metric type
     * @param {Object} metric - Current metric
     */
    detectAnomalies(type, metric) {
        const recentMetrics = this.metrics[type].slice(-100);
        
        if (type === 'performance' && metric.latency) {
            const avgLatency = recentMetrics.reduce((sum, m) => sum + (m.latency || 0), 0) / recentMetrics.length;
            const stdDev = Math.sqrt(recentMetrics.reduce((sum, m) => sum + Math.pow((m.latency || 0) - avgLatency, 2), 0) / recentMetrics.length);
            
            if (metric.latency > avgLatency + (3 * stdDev)) {
                this.anomalies.push({
                    type: 'high_latency',
                    severity: 'warning',
                    value: metric.latency,
                    expected: avgLatency,
                    timestamp: metric.timestamp
                });
            }
        }

        if (type === 'errors' && recentMetrics.length > 10) {
            const errorRate = (recentMetrics.length / (recentMetrics.length + 90)) * 100;
            if (errorRate > this.thresholds.errorRate.critical) {
                this.anomalies.push({
                    type: 'high_error_rate',
                    severity: 'critical',
                    value: errorRate.toFixed(2),
                    threshold: this.thresholds.errorRate.critical,
                    timestamp: metric.timestamp
                });
            }
        }
    }

    /**
     * Get performance statistics
     */
    getPerformanceStats() {
        const perf = this.metrics.performance;
        if (perf.length === 0) return null;

        const latencies = perf.map(m => m.latency || 0);
        const sorted = latencies.sort((a, b) => a - b);

        return {
            totalRequests: perf.length,
            avgLatency: (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2),
            minLatency: sorted[0],
            maxLatency: sorted[sorted.length - 1],
            p50Latency: sorted[Math.floor(sorted.length * 0.5)],
            p95Latency: sorted[Math.floor(sorted.length * 0.95)],
            p99Latency: sorted[Math.floor(sorted.length * 0.99)]
        };
    }

    /**
     * Get error statistics
     */
    getErrorStats() {
        const errors = this.metrics.errors;
        const errorTypes = {};

        errors.forEach(err => {
            const type = err.category || 'unknown';
            errorTypes[type] = (errorTypes[type] || 0) + 1;
        });

        return {
            totalErrors: errors.length,
            errorRate: ((errors.length / (errors.length + this.metrics.requests.length)) * 100).toFixed(2),
            byType: errorTypes,
            recentErrors: errors.slice(-5)
        };
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        const requests = this.metrics.requests;
        const cached = requests.filter(r => r.cached).length;
        const hitRate = requests.length > 0 ? ((cached / requests.length) * 100).toFixed(2) : 0;

        return {
            totalRequests: requests.length,
            cachedRequests: cached,
            hitRate: hitRate,
            missRate: (100 - parseFloat(hitRate)).toFixed(2),
            status: hitRate >= this.thresholds.cache.minHitRate ? 'healthy' : 'degraded'
        };
    }

    /**
     * Get sentiment trends
     */
    getSentimentTrends() {
        const sentiment = this.metrics.sentiment;
        const positive = sentiment.filter(s => s.sentiment === 'positive').length;
        const negative = sentiment.filter(s => s.sentiment === 'negative').length;
        const neutral = sentiment.filter(s => s.sentiment === 'neutral').length;
        const total = sentiment.length;

        return {
            total,
            positive: { count: positive, percentage: ((positive / total) * 100).toFixed(2) },
            negative: { count: negative, percentage: ((negative / total) * 100).toFixed(2) },
            neutral: { count: neutral, percentage: ((neutral / total) * 100).toFixed(2) },
            avgScore: total > 0 ? (sentiment.reduce((sum, s) => sum + (s.score || 0), 0) / total).toFixed(2) : 0
        };
    }

    /**
     * Get comprehensive dashboard
     */
    getDashboard() {
        return {
            timestamp: new Date().toISOString(),
            performance: this.getPerformanceStats(),
            errors: this.getErrorStats(),
            cache: this.getCacheStats(),
            sentiment: this.getSentimentTrends(),
            anomalies: this.anomalies.slice(-10),
            health: this.calculateHealth()
        };
    }

    /**
     * Calculate overall system health
     */
    calculateHealth() {
        const perf = this.getPerformanceStats();
        const errors = this.getErrorStats();
        const cache = this.getCacheStats();

        let health = 100;

        // Latency impact
        if (perf && parseFloat(perf.avgLatency) > this.thresholds.latency.critical) health -= 30;
        else if (perf && parseFloat(perf.avgLatency) > this.thresholds.latency.warning) health -= 15;

        // Error rate impact
        if (errors && parseFloat(errors.errorRate) > this.thresholds.errorRate.critical) health -= 30;
        else if (errors && parseFloat(errors.errorRate) > this.thresholds.errorRate.warning) health -= 15;

        // Cache hit rate impact
        if (cache && parseFloat(cache.hitRate) < this.thresholds.cache.minHitRate) health -= 10;

        return {
            score: Math.max(0, health),
            status: health >= 80 ? 'healthy' : health >= 50 ? 'degraded' : 'critical'
        };
    }

    /**
     * Export metrics to file
     */
    export(format = 'json') {
        const data = {
            exportDate: new Date().toISOString(),
            dashboard: this.getDashboard(),
            metrics: this.metrics
        };

        const filename = path.join(this.dataDir, `analytics-${Date.now()}.${format}`);
        
        if (format === 'json') {
            fs.writeFileSync(filename, JSON.stringify(data, null, 2));
        } else if (format === 'csv') {
            const csv = this.convertToCSV(data);
            fs.writeFileSync(filename, csv);
        }

        return filename;
    }

    /**
     * Convert metrics to CSV format
     */
    convertToCSV(data) {
        let csv = 'Metric,Value\n';
        const dashboard = data.dashboard;

        if (dashboard.performance) {
            csv += `Avg Latency (ms),${dashboard.performance.avgLatency}\n`;
            csv += `P95 Latency (ms),${dashboard.performance.p95Latency}\n`;
            csv += `P99 Latency (ms),${dashboard.performance.p99Latency}\n`;
        }

        if (dashboard.errors) {
            csv += `Total Errors,${dashboard.errors.totalErrors}\n`;
            csv += `Error Rate (%),${dashboard.errors.errorRate}\n`;
        }

        if (dashboard.cache) {
            csv += `Cache Hit Rate (%),${dashboard.cache.hitRate}\n`;
        }

        csv += `Health Score,${dashboard.health.score}\n`;
        csv += `Health Status,${dashboard.health.status}\n`;

        return csv;
    }

    /**
     * Prune old metrics to prevent memory bloat
     */
    pruneOldMetrics(type, maxAge = 24 * 60 * 60 * 1000) {
        const cutoff = Date.now() - maxAge;
        if (this.metrics[type]) {
            this.metrics[type] = this.metrics[type].filter(m => new Date(m.timestamp).getTime() > cutoff);
        }
    }

    /**
     * Load metrics from disk
     */
    loadMetrics() {
        try {
            const files = fs.readdirSync(this.dataDir).filter(f => f.endsWith('.json'));
            if (files.length > 0) {
                const latest = files.sort().pop();
                const data = JSON.parse(fs.readFileSync(path.join(this.dataDir, latest), 'utf8'));
                this.metrics = data.metrics || this.metrics;
            }
        } catch (e) {
            // Silent fail on load
        }
    }

    /**
     * Save metrics to disk
     */
    saveMetrics() {
        try {
            const data = {
                timestamp: new Date().toISOString(),
                metrics: this.metrics
            };
            fs.writeFileSync(
                path.join(this.dataDir, `metrics-${Date.now()}.json`),
                JSON.stringify(data, null, 2)
            );
        } catch (e) {
            console.error('Failed to save metrics:', e.message);
        }
    }
}

module.exports = { AnalyticsEngine };
