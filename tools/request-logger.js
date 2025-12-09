/**
 * Request logger module for tracking API calls and performance metrics.
 * Provides comprehensive logging, analytics, and export capabilities for monitoring
 * LLM interactions and optimizing performance.
 * 
 * @module RequestLogger
 * @author yonikashi432
 * @version 2.0.0
 * 
 * @example
 * const logger = new RequestLogger('./logs');
 * logger.logRequest('chat', 'Hello', 'Hi there!', 150);
 * const stats = logger.getStats();
 */

const fs = require('fs');
const path = require('path');

class RequestLogger {
    /**
     * Initialize the Request Logger
     * @param {string} logDir - Directory to store log files (default: './logs')
     * @throws {Error} If logDir cannot be created
     */
    constructor(logDir = './logs') {
        if (typeof logDir !== 'string' || logDir.trim().length === 0) {
            throw new Error('Log directory must be a non-empty string');
        }
        
        this.logDir = logDir;
        this.requests = [];
        this.maxInMemoryLogs = 10000; // Prevent memory issues
        this.ensureLogDir();
        this.loadLogs();
    }

    /**
     * Ensures the log directory exists, creates it if necessary
     * @private
     * @throws {Error} If directory creation fails
     */
    ensureLogDir() {
        try {
            if (!fs.existsSync(this.logDir)) {
                fs.mkdirSync(this.logDir, { recursive: true });
            }
        } catch (error) {
            throw new Error(`Failed to create log directory: ${error.message}`);
        }
    }

    /**
     * Loads existing logs from disk into memory
     * Only loads the most recent logs to prevent memory issues
     * @private
     */
    loadLogs() {
        try {
            if (!fs.existsSync(this.logDir)) {
                return; // Nothing to load yet
            }
            
            const files = fs.readdirSync(this.logDir)
                .filter(f => f.startsWith('requests-') && f.endsWith('.jsonl'))
                .sort()
                .reverse(); // Most recent first
            
            let loadedCount = 0;
            for (const file of files) {
                if (loadedCount >= this.maxInMemoryLogs) {
                    break; // Prevent memory overflow
                }
                
                const filepath = path.join(this.logDir, file);
                try {
                    const content = fs.readFileSync(filepath, 'utf-8');
                    const lines = content.split('\n').filter(l => l.trim());
                    
                    for (const line of lines) {
                        if (loadedCount >= this.maxInMemoryLogs) break;
                        
                        try {
                            this.requests.push(JSON.parse(line));
                            loadedCount++;
                        } catch (parseError) {
                            // Log corruption - skip this line
                            console.warn(`Skipping corrupted log entry in ${file}`);
                        }
                    }
                } catch (readError) {
                    console.error(`Failed to read log file ${file}: ${readError.message}`);
                }
            }
        } catch (error) {
            console.error(`Error loading logs: ${error.message}`);
        }
    }

    /**
     * Logs a request with comprehensive metadata
     * @param {string} type - Type of request (e.g., 'chat', 'sentiment', 'analysis')
     * @param {string} input - Input text or query
     * @param {string} output - Output or response
     * @param {number} duration - Duration in milliseconds
     * @param {Object} metadata - Additional metadata (optional)
     * @throws {TypeError} If required parameters are invalid
     * 
     * @example
     * logger.logRequest('chat', 'What is AI?', 'AI is...', 250, { cached: false });
     */
    logRequest(type, input, output, duration, metadata = {}) {
        // Input validation
        if (typeof type !== 'string' || type.trim().length === 0) {
            throw new TypeError('Type must be a non-empty string');
        }
        
        if (typeof duration !== 'number' || duration < 0) {
            throw new TypeError('Duration must be a non-negative number');
        }
        
        // Safely convert input/output to strings
        const inputStr = String(input || '');
        const outputStr = String(output || '');
        
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            type: type.trim(),
            input: inputStr.substring(0, 100), // Truncate for privacy and storage
            output: outputStr.substring(0, 100),
            duration: Math.round(duration),
            inputLength: inputStr.length,
            outputLength: outputStr.length,
            ...metadata
        };

        // Add to in-memory cache (with size limit)
        if (this.requests.length >= this.maxInMemoryLogs) {
            this.requests.shift(); // Remove oldest entry
        }
        this.requests.push(logEntry);

        // Write to file asynchronously to avoid blocking
        try {
            const filename = path.join(
                this.logDir, 
                `requests-${new Date().toISOString().split('T')[0]}.jsonl`
            );
            fs.appendFileSync(filename, JSON.stringify(logEntry) + '\n');
        } catch (error) {
            console.error(`Failed to write log entry: ${error.message}`);
        }
    }

    /**
     * Gets comprehensive summary statistics
     * @returns {Object|null} Statistics object or null if no requests logged
     * @property {number} totalRequests - Total number of logged requests
     * @property {number} averageDuration - Average request duration in ms
     * @property {number} maxDuration - Maximum request duration in ms
     * @property {number} minDuration - Minimum request duration in ms
     * @property {number} p95Duration - 95th percentile duration in ms
     * @property {Object} byType - Request counts grouped by type
     * @property {number} cachedRequests - Number of cached responses (if tracked)
     * 
     * @example
     * const stats = logger.getStats();
     * console.log(`Average duration: ${stats.averageDuration}ms`);
     */
    getStats() {
        if (this.requests.length === 0) {
            return null;
        }

        const durations = this.requests.map(r => r.duration).filter(d => typeof d === 'number');
        
        if (durations.length === 0) {
            return null;
        }
        
        // Sort for percentile calculations
        const sortedDurations = [...durations].sort((a, b) => a - b);
        
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        const maxDuration = Math.max(...durations);
        const minDuration = Math.min(...durations);
        
        // Calculate 95th percentile
        const p95Index = Math.floor(sortedDurations.length * 0.95);
        const p95Duration = sortedDurations[p95Index] || maxDuration;

        const typeStats = {};
        let cachedCount = 0;
        
        this.requests.forEach(r => {
            // Count by type
            if (!typeStats[r.type]) {
                typeStats[r.type] = 0;
            }
            typeStats[r.type]++;
            
            // Count cached requests
            if (r.cached === true) {
                cachedCount++;
            }
        });

        return {
            totalRequests: this.requests.length,
            averageDuration: Math.round(avgDuration),
            maxDuration,
            minDuration,
            p95Duration,
            byType: typeStats,
            cachedRequests: cachedCount,
            cacheHitRate: this.requests.length > 0 
                ? ((cachedCount / this.requests.length) * 100).toFixed(2) + '%'
                : '0%'
        };
    }

    /**
     * Exports all in-memory logs in JSON format
     * @returns {string} JSON string of all logged requests
     * 
     * @example
     * const json = logger.exportJSON();
     * fs.writeFileSync('logs.json', json);
     */
    exportJSON() {
        return JSON.stringify(this.requests, null, 2);
    }

    /**
     * Exports all in-memory logs in CSV format
     * Useful for importing into spreadsheet applications
     * @returns {string} CSV-formatted string of all logged requests
     * 
     * @example
     * const csv = logger.exportCSV();
     * fs.writeFileSync('logs.csv', csv);
     */
    exportCSV() {
        if (this.requests.length === 0) {
            return '';
        }

        const headers = Object.keys(this.requests[0]).join(',');
        const rows = this.requests.map(req =>
            Object.values(req).map(v => {
                // Escape quotes and handle special characters
                const str = String(v || '');
                return `"${str.replace(/"/g, '""')}"`;
            }).join(',')
        );

        return [headers, ...rows].join('\n');
    }
    
    /**
     * Clears all in-memory logs (does not delete log files)
     * Useful for freeing memory in long-running processes
     * 
     * @example
     * logger.clearMemory();
     */
    clearMemory() {
        this.requests = [];
    }
    
    /**
     * Gets the number of in-memory log entries
     * @returns {number} Count of loaded log entries
     */
    getLogCount() {
        return this.requests.length;
    }
    
    /**
     * Checks if logger has reached maximum in-memory capacity
     * @returns {boolean} True if at capacity
     */
    isAtCapacity() {
        return this.requests.length >= this.maxInMemoryLogs;
    }
}

module.exports = { RequestLogger };
