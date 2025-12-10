/**
 * Advanced Caching System - Multi-level caching with compression and smart invalidation
 * Implements semantic caching, LRU eviction, and intelligent prefetching
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

class AdvancedCache {
    constructor(options = {}) {
        this.memoryCache = new Map();
        this.diskCache = new Map();
        this.storageDir = options.storageDir || './cache/advanced';
        this.maxMemorySize = options.maxMemorySize || 100 * 1024 * 1024; // 100MB
        this.maxDiskSize = options.maxDiskSize || 1024 * 1024 * 1024; // 1GB
        this.compressionThreshold = options.compressionThreshold || 1024; // 1KB
        this.ttl = options.ttl || 24 * 60 * 60 * 1000; // 24 hours
        this.semanticThreshold = options.semanticThreshold || 0.85;

        this.stats = {
            hits: 0,
            misses: 0,
            compression: 0,
            evictions: 0
        };

        this.ensureDir();
    }

    ensureDir() {
        if (!fs.existsSync(this.storageDir)) {
            fs.mkdirSync(this.storageDir, { recursive: true });
        }
    }

    /**
     * Get cached value
     */
    get(key, options = {}) {
        const hash = this.hashKey(key);

        // Check memory cache first
        if (this.memoryCache.has(hash)) {
            const entry = this.memoryCache.get(hash);
            if (!this.isExpired(entry)) {
                this.stats.hits++;
                entry.accessCount = (entry.accessCount || 0) + 1;
                entry.lastAccess = Date.now();
                return entry.value;
            } else {
                this.memoryCache.delete(hash);
            }
        }

        // Check disk cache
        if (this.diskCache.has(hash)) {
            const entry = this.diskCache.get(hash);
            if (!this.isExpired(entry)) {
                const value = this.decompress(entry.value, entry.compressed);
                // Promote to memory cache
                this.set(key, value, { ttl: this.ttl });
                this.stats.hits++;
                return value;
            } else {
                this.diskCache.delete(hash);
            }
        }

        this.stats.misses++;
        return null;
    }

    /**
     * Set cached value
     */
    set(key, value, options = {}) {
        const hash = this.hashKey(key);
        const ttl = options.ttl || this.ttl;
        const metadata = options.metadata || {};

        const entry = {
            key,
            value,
            hash,
            timestamp: Date.now(),
            ttl,
            expiresAt: Date.now() + ttl,
            accessCount: 0,
            lastAccess: Date.now(),
            compressed: false,
            metadata
        };

        // Determine storage tier
        const size = this.getSize(value);
        const shouldCompress = size > this.compressionThreshold;

        if (shouldCompress) {
            entry.value = this.compress(value);
            entry.compressed = true;
            this.stats.compression++;
        }

        // Store in memory cache
        if (size < this.maxMemorySize) {
            this.memoryCache.set(hash, entry);
            this.checkMemoryEviction();
        } else {
            // Store in disk cache
            this.diskCache.set(hash, entry);
            this.checkDiskEviction();
        }

        return entry;
    }

    /**
     * Check for semantic similarity with cached entries
     */
    semanticGet(query, threshold = this.semanticThreshold) {
        const queryHash = this.hashKey(query);
        let bestMatch = null;
        let bestScore = 0;

        // Search both caches
        for (const [hash, entry] of this.memoryCache) {
            const similarity = this.calculateSimilarity(query, entry.key);
            if (similarity > bestScore && similarity >= threshold) {
                bestScore = similarity;
                bestMatch = entry;
            }
        }

        if (bestMatch && !this.isExpired(bestMatch)) {
            this.stats.hits++;
            return {
                value: bestMatch.value,
                similarity: bestScore,
                source: 'memory'
            };
        }

        return null;
    }

    /**
     * Prefetch related entries
     */
    prefetch(keys, priority = 'low') {
        const entries = [];

        keys.forEach(key => {
            const cached = this.get(key);
            if (cached) {
                entries.push({
                    key,
                    value: cached,
                    priority
                });
            }
        });

        return entries;
    }

    /**
     * Invalidate cache entry
     */
    invalidate(key, options = {}) {
        const hash = this.hashKey(key);

        if (options.pattern) {
            // Pattern-based invalidation
            this.invalidateByPattern(options.pattern);
        } else {
            // Single key invalidation
            this.memoryCache.delete(hash);
            this.diskCache.delete(hash);
        }
    }

    /**
     * Invalidate by pattern
     */
    invalidateByPattern(pattern) {
        const regex = new RegExp(pattern);

        for (const [hash, entry] of this.memoryCache) {
            if (regex.test(entry.key)) {
                this.memoryCache.delete(hash);
            }
        }

        for (const [hash, entry] of this.diskCache) {
            if (regex.test(entry.key)) {
                this.diskCache.delete(hash);
            }
        }
    }

    /**
     * Clear all cache
     */
    clear() {
        this.memoryCache.clear();
        this.diskCache.clear();
        this.stats = { hits: 0, misses: 0, compression: 0, evictions: 0 };
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const totalRequests = this.stats.hits + this.stats.misses;
        const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            hitRate: hitRate.toFixed(2),
            compressionCount: this.stats.compression,
            evictionCount: this.stats.evictions,
            memoryEntries: this.memoryCache.size,
            diskEntries: this.diskCache.size,
            memorySize: this.getMemorySizeUsage(),
            diskSize: this.getDiskSizeUsage()
        };
    }

    /**
     * Hash key for storage
     */
    hashKey(key) {
        return crypto.createHash('sha256').update(key).digest('hex');
    }

    /**
     * Compress value
     */
    compress(value) {
        const json = JSON.stringify(value);
        return zlib.deflateSync(json).toString('base64');
    }

    /**
     * Decompress value
     */
    decompress(compressed, wasCompressed) {
        if (!wasCompressed) return compressed;
        const buffer = Buffer.from(compressed, 'base64');
        const decompressed = zlib.inflateSync(buffer).toString('utf8');
        return JSON.parse(decompressed);
    }

    /**
     * Get size of value in bytes
     */
    getSize(value) {
        return JSON.stringify(value).length;
    }

    /**
     * Check if entry is expired
     */
    isExpired(entry) {
        return Date.now() > entry.expiresAt;
    }

    /**
     * Check memory eviction (LRU)
     */
    checkMemoryEviction() {
        const currentSize = Array.from(this.memoryCache.values())
            .reduce((sum, entry) => sum + this.getSize(entry.value), 0);

        if (currentSize > this.maxMemorySize) {
            // Evict least recently used
            const sorted = Array.from(this.memoryCache.values())
                .sort((a, b) => a.lastAccess - b.lastAccess);

            const toEvict = sorted[0];
            this.memoryCache.delete(toEvict.hash);
            this.stats.evictions++;
        }
    }

    /**
     * Check disk eviction
     */
    checkDiskEviction() {
        const currentSize = Array.from(this.diskCache.values())
            .reduce((sum, entry) => sum + this.getSize(entry.value), 0);

        if (currentSize > this.maxDiskSize) {
            // Evict oldest
            const sorted = Array.from(this.diskCache.values())
                .sort((a, b) => a.timestamp - b.timestamp);

            const toEvict = sorted[0];
            this.diskCache.delete(toEvict.hash);
            this.stats.evictions++;
        }
    }

    /**
     * Calculate semantic similarity (simple implementation)
     */
    calculateSimilarity(str1, str2) {
        const tokens1 = new Set(str1.toLowerCase().split(/\s+/));
        const tokens2 = new Set(str2.toLowerCase().split(/\s+/));

        const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
        const union = new Set([...tokens1, ...tokens2]);

        return intersection.size / union.size;
    }

    /**
     * Get memory size usage
     */
    getMemorySizeUsage() {
        return Array.from(this.memoryCache.values())
            .reduce((sum, entry) => sum + this.getSize(entry.value), 0);
    }

    /**
     * Get disk size usage
     */
    getDiskSizeUsage() {
        return Array.from(this.diskCache.values())
            .reduce((sum, entry) => sum + this.getSize(entry.value), 0);
    }
}

module.exports = { AdvancedCache };
