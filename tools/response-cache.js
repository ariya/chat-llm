/**
 * Response caching module for Chat LLM v2
 * Provides dual-layer (memory + disk) caching for LLM responses
 * to reduce API calls, improve performance, and save costs.
 * 
 * Features:
 * - Memory cache for instant retrieval
 * - Disk cache for persistence across restarts
 * - Automatic TTL (time-to-live) expiration
 * - Cache statistics and monitoring
 * 
 * @module ResponseCache
 * @author yonikashi432
 * @version 2.0.0
 * 
 * @example
 * const cache = new ResponseCache('./cache');
 * cache.set('What is AI?', 'AI is artificial intelligence...');
 * const response = cache.get('What is AI?'); // Returns cached response
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ResponseCache {
    /**
     * Initialize the Response Cache
     * @param {string} cacheDir - Directory to store cache files (default: './cache')
     * @param {number} ttl - Time-to-live in milliseconds (default: 24 hours)
     * @throws {Error} If cache directory cannot be created
     */
    constructor(cacheDir = './cache', ttl = 24 * 60 * 60 * 1000) {
        if (typeof cacheDir !== 'string' || cacheDir.trim().length === 0) {
            throw new Error('Cache directory must be a non-empty string');
        }
        
        if (typeof ttl !== 'number' || ttl <= 0) {
            throw new Error('TTL must be a positive number');
        }
        
        this.cacheDir = cacheDir;
        this.ttl = ttl;
        this.memoryCache = new Map();
        this.maxMemoryCacheSize = 1000; // Prevent memory overflow
        this.hits = 0;
        this.misses = 0;
        this.ensureCacheDir();
    }

    /**
     * Ensures cache directory exists
     * @private
     * @throws {Error} If directory creation fails
     */
    ensureCacheDir() {
        try {
            if (!fs.existsSync(this.cacheDir)) {
                fs.mkdirSync(this.cacheDir, { recursive: true });
            }
        } catch (error) {
            throw new Error(`Failed to create cache directory: ${error.message}`);
        }
    }

    /**
     * Generate a deterministic cache key from input using SHA-256
     * @private
     * @param {string} input - Input text to generate key for
     * @returns {string} Hexadecimal hash string
     * @throws {TypeError} If input is not a string
     */
    generateKey(input) {
        if (typeof input !== 'string') {
            throw new TypeError('Input must be a string');
        }
        
        return crypto.createHash('sha256').update(input).digest('hex');
    }

    /**
     * Get cached response for given input
     * Checks memory cache first, then disk cache for better performance
     * @param {string} input - Input text to look up
     * @returns {string|null} Cached response or null if not found/expired
     * @throws {TypeError} If input is not a string
     * 
     * @example
     * const response = cache.get('What is AI?');
     * if (response) {
     *   console.log('Cache hit:', response);
     * }
     */
    get(input) {
        if (typeof input !== 'string') {
            throw new TypeError('Input must be a string');
        }
        
        const key = this.generateKey(input);
        
        // Check memory cache first (fastest)
        if (this.memoryCache.has(key)) {
            const cached = this.memoryCache.get(key);
            if (Date.now() - cached.timestamp < this.ttl) {
                this.hits++;
                return cached.value;
            } else {
                // Expired - remove from memory
                this.memoryCache.delete(key);
            }
        }

        // Check disk cache (slower but persistent)
        try {
            const filepath = path.join(this.cacheDir, `${key}.json`);
            if (fs.existsSync(filepath)) {
                const data = fs.readFileSync(filepath, 'utf-8');
                const cached = JSON.parse(data);
                
                if (Date.now() - cached.timestamp < this.ttl) {
                    // Still valid - load into memory cache
                    if (this.memoryCache.size < this.maxMemoryCacheSize) {
                        this.memoryCache.set(key, cached);
                    }
                    this.hits++;
                    return cached.value;
                } else {
                    // Expired - delete file
                    try {
                        fs.unlinkSync(filepath);
                    } catch (unlinkError) {
                        console.warn(`Failed to delete expired cache: ${unlinkError.message}`);
                    }
                }
            }
        } catch (error) {
            console.warn(`Cache read error: ${error.message}`);
        }

        this.misses++;
        return null;
    }

    /**
     * Store response in cache (both memory and disk)
     * @param {string} input - Input text (used to generate cache key)
     * @param {string} response - Response to cache
     * @throws {TypeError} If input or response is not a string
     * 
     * @example
     * cache.set('What is AI?', 'AI is artificial intelligence...');
     */
    set(input, response) {
        if (typeof input !== 'string') {
            throw new TypeError('Input must be a string');
        }
        
        if (typeof response !== 'string') {
            throw new TypeError('Response must be a string');
        }
        
        const key = this.generateKey(input);
        const cached = {
            timestamp: Date.now(),
            value: response,
            input: input.substring(0, 100), // Store truncated input for debugging
            inputLength: input.length,
            responseLength: response.length
        };

        // Store in memory cache (with size limit)
        if (this.memoryCache.size >= this.maxMemoryCacheSize) {
            // Remove oldest entry (first in map)
            const firstKey = this.memoryCache.keys().next().value;
            this.memoryCache.delete(firstKey);
        }
        this.memoryCache.set(key, cached);

        // Store on disk for persistence
        try {
            const filepath = path.join(this.cacheDir, `${key}.json`);
            fs.writeFileSync(filepath, JSON.stringify(cached), 'utf-8');
        } catch (error) {
            console.warn(`Failed to write cache to disk: ${error.message}`);
        }
    }

    /**
     * Clear all cached responses (memory and disk)
     * WARNING: This will delete all cached data
     * 
     * @example
     * cache.clear(); // Remove all cached responses
     */
    clear() {
        // Clear memory cache
        this.memoryCache.clear();
        
        // Clear disk cache
        try {
            if (!fs.existsSync(this.cacheDir)) {
                return;
            }
            
            const files = fs.readdirSync(this.cacheDir).filter(f => f.endsWith('.json'));
            files.forEach(file => {
                try {
                    fs.unlinkSync(path.join(this.cacheDir, file));
                } catch (unlinkError) {
                    console.warn(`Failed to delete cache file ${file}: ${unlinkError.message}`);
                }
            });
        } catch (error) {
            console.error(`Error clearing cache: ${error.message}`);
        }
        
        // Reset statistics
        this.hits = 0;
        this.misses = 0;
    }

    /**
     * Get comprehensive cache statistics
     * @returns {Object} Statistics object containing:
     *   - memoryCacheSize: Number of items in memory
     *   - diskCacheFiles: Number of files on disk
     *   - diskCacheSize: Total size in bytes
     *   - diskCachePath: Cache directory path
     *   - hits: Number of cache hits
     *   - misses: Number of cache misses
     *   - hitRate: Cache hit rate as percentage
     *   - ttl: Current TTL in milliseconds
     * 
     * @example
     * const stats = cache.getStats();
     * console.log(`Hit rate: ${stats.hitRate}`);
     */
    getStats() {
        let diskSize = 0;
        let fileCount = 0;
        
        try {
            if (fs.existsSync(this.cacheDir)) {
                const files = fs.readdirSync(this.cacheDir).filter(f => f.endsWith('.json'));
                fileCount = files.length;
                
                files.forEach(file => {
                    try {
                        const stats = fs.statSync(path.join(this.cacheDir, file));
                        diskSize += stats.size;
                    } catch (statError) {
                        // Skip files that can't be read
                    }
                });
            }
        } catch (error) {
            console.warn(`Error calculating cache stats: ${error.message}`);
        }

        const totalRequests = this.hits + this.misses;
        const hitRate = totalRequests > 0 
            ? ((this.hits / totalRequests) * 100).toFixed(2) + '%'
            : '0%';

        return {
            memoryCacheSize: this.memoryCache.size,
            maxMemoryCacheSize: this.maxMemoryCacheSize,
            diskCacheFiles: fileCount,
            diskCacheSize: diskSize,
            diskCacheSizeFormatted: this.formatBytes(diskSize),
            diskCachePath: this.cacheDir,
            hits: this.hits,
            misses: this.misses,
            hitRate: hitRate,
            ttl: this.ttl,
            ttlFormatted: this.formatDuration(this.ttl)
        };
    }
    
    /**
     * Format bytes into human-readable format
     * @private
     * @param {number} bytes - Number of bytes
     * @returns {string} Formatted string (e.g., "1.5 MB")
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }
    
    /**
     * Format duration into human-readable format
     * @private
     * @param {number} ms - Duration in milliseconds
     * @returns {string} Formatted string (e.g., "24 hours")
     */
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    
    /**
     * Clean up expired cache entries
     * Removes entries that have exceeded their TTL
     * @returns {number} Number of entries removed
     * 
     * @example
     * const removed = cache.cleanup();
     * console.log(`Removed ${removed} expired entries`);
     */
    cleanup() {
        let removed = 0;
        
        // Clean memory cache
        for (const [key, cached] of this.memoryCache.entries()) {
            if (Date.now() - cached.timestamp >= this.ttl) {
                this.memoryCache.delete(key);
                removed++;
            }
        }
        
        // Clean disk cache
        try {
            if (!fs.existsSync(this.cacheDir)) {
                return removed;
            }
            
            const files = fs.readdirSync(this.cacheDir).filter(f => f.endsWith('.json'));
            for (const file of files) {
                try {
                    const filepath = path.join(this.cacheDir, file);
                    const data = fs.readFileSync(filepath, 'utf-8');
                    const cached = JSON.parse(data);
                    
                    if (Date.now() - cached.timestamp >= this.ttl) {
                        fs.unlinkSync(filepath);
                        removed++;
                    }
                } catch (fileError) {
                    // Skip problematic files
                }
            }
        } catch (error) {
            console.error(`Error during cache cleanup: ${error.message}`);
        }
        
        return removed;
    }
    
    /**
     * Set TTL (time-to-live) for cache entries
     * @param {number} ms - TTL in milliseconds
     * @throws {TypeError} If ms is not a positive number
     * 
     * @example
     * cache.setTTL(12 * 60 * 60 * 1000); // Set to 12 hours
     */
    setTTL(ms) {
        if (typeof ms !== 'number' || ms <= 0) {
            throw new TypeError('TTL must be a positive number');
        }
        this.ttl = ms;
    }
}

module.exports = { ResponseCache };
