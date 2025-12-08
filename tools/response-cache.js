/**
 * Response caching module for Chat LLM
 * Caches LLM responses to reduce API calls and improve performance
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ResponseCache {
    constructor(cacheDir = './cache') {
        this.cacheDir = cacheDir;
        this.ttl = 24 * 60 * 60 * 1000; // 24 hours default TTL
        this.memoryCache = new Map();
        this.ensureCacheDir();
    }

    ensureCacheDir() {
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }

    /**
     * Generate a cache key from input
     */
    generateKey(input) {
        return crypto.createHash('sha256').update(input).digest('hex');
    }

    /**
     * Get cached response
     */
    get(input) {
        const key = this.generateKey(input);
        
        // Check memory cache first
        if (this.memoryCache.has(key)) {
            const cached = this.memoryCache.get(key);
            if (Date.now() - cached.timestamp < this.ttl) {
                return cached.value;
            } else {
                this.memoryCache.delete(key);
            }
        }

        // Check disk cache
        try {
            const filepath = path.join(this.cacheDir, `${key}.json`);
            if (fs.existsSync(filepath)) {
                const cached = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
                if (Date.now() - cached.timestamp < this.ttl) {
                    this.memoryCache.set(key, cached);
                    return cached.value;
                } else {
                    fs.unlinkSync(filepath);
                }
            }
        } catch (e) {
            // Ignore cache read errors
        }

        return null;
    }

    /**
     * Set cached response
     */
    set(input, response) {
        const key = this.generateKey(input);
        const cached = {
            timestamp: Date.now(),
            value: response,
            input: input.substring(0, 100) // Store truncated input for reference
        };

        // Store in memory
        this.memoryCache.set(key, cached);

        // Store on disk
        try {
            const filepath = path.join(this.cacheDir, `${key}.json`);
            fs.writeFileSync(filepath, JSON.stringify(cached), 'utf-8');
        } catch (e) {
            // Ignore cache write errors
        }
    }

    /**
     * Clear all cache
     */
    clear() {
        this.memoryCache.clear();
        try {
            const files = fs.readdirSync(this.cacheDir).filter(f => f.endsWith('.json'));
            files.forEach(file => {
                fs.unlinkSync(path.join(this.cacheDir, file));
            });
        } catch (e) {
            // Ignore clear errors
        }
    }

    /**
     * Get cache statistics
     */
    getStats() {
        let diskSize = 0;
        try {
            const files = fs.readdirSync(this.cacheDir).filter(f => f.endsWith('.json'));
            files.forEach(file => {
                const stats = fs.statSync(path.join(this.cacheDir, file));
                diskSize += stats.size;
            });
        } catch (e) {
            // Ignore stats errors
        }

        return {
            memoryCacheSize: this.memoryCache.size,
            diskCacheSize: diskSize,
            diskCachePath: this.cacheDir
        };
    }
}

module.exports = { ResponseCache };
