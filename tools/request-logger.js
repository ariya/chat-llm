/**
 * Request logger module for tracking API calls and performance metrics.
 * Useful for debugging, monitoring, and optimizing LLM interactions.
 */

const fs = require('fs');
const path = require('path');

class RequestLogger {
    constructor(logDir = './logs') {
        this.logDir = logDir;
        this.requests = [];
        this.ensureLogDir();
        this.loadLogs();
    }

    ensureLogDir() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    /**
     * Loads all existing logs from disk
     */
    loadLogs() {
        try {
            const files = fs.readdirSync(this.logDir).filter(f => f.startsWith('requests-') && f.endsWith('.jsonl'));
            files.forEach(file => {
                const filepath = path.join(this.logDir, file);
                const content = fs.readFileSync(filepath, 'utf-8');
                const lines = content.split('\n').filter(l => l.trim());
                lines.forEach(line => {
                    try {
                        this.requests.push(JSON.parse(line));
                    } catch (e) {
                        // Ignore parsing errors
                    }
                });
            });
        } catch (e) {
            // Ignore if logs don't exist yet
        }
    }

    /**
     * Logs a request with metadata
     * @param {string} type - Type of request (chat, sentiment, etc.)
     * @param {string} input - Input text or query
     * @param {string} output - Output or response
     * @param {number} duration - Duration in milliseconds
     * @param {Object} metadata - Additional metadata
     */
    logRequest(type, input, output, duration, metadata = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            type,
            input: input.substring(0, 100), // Truncate for privacy
            output: output.substring(0, 100),
            duration,
            ...metadata
        };

        this.requests.push(logEntry);

        // Write to file
        const filename = path.join(this.logDir, `requests-${new Date().toISOString().split('T')[0]}.jsonl`);
        fs.appendFileSync(filename, JSON.stringify(logEntry) + '\n');
    }

    /**
     * Gets summary statistics
     */
    getStats() {
        if (this.requests.length === 0) {
            return null;
        }

        const durations = this.requests.map(r => r.duration);
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        const maxDuration = Math.max(...durations);
        const minDuration = Math.min(...durations);

        const typeStats = {};
        this.requests.forEach(r => {
            if (!typeStats[r.type]) {
                typeStats[r.type] = 0;
            }
            typeStats[r.type]++;
        });

        return {
            totalRequests: this.requests.length,
            averageDuration: Math.round(avgDuration),
            maxDuration,
            minDuration,
            byType: typeStats
        };
    }

    /**
     * Exports logs in JSON format
     */
    exportJSON() {
        return JSON.stringify(this.requests, null, 2);
    }

    /**
     * Exports logs in CSV format
     */
    exportCSV() {
        if (this.requests.length === 0) {
            return '';
        }

        const headers = Object.keys(this.requests[0]).join(',');
        const rows = this.requests.map(req =>
            Object.values(req).map(v => `"${v}"`).join(',')
        );

        return [headers, ...rows].join('\n');
    }
}

module.exports = { RequestLogger };
