/**
 * Webhook Manager for Chat LLM v2.2
 * 
 * Manages HTTP webhooks for event notifications
 * Supports retry logic, HMAC signatures, and delivery tracking
 * 
 * @module WebhookManager
 * @version 2.2.0
 */

const crypto = require('crypto');
const https = require('https');
const http = require('http');
const { URL } = require('url');

class WebhookManager {
    constructor(eventBus = null) {
        this.webhooks = new Map();
        this.deliveryLog = [];
        this.maxLogSize = 1000;
        this.eventBus = eventBus;

        // Auto-subscribe to event bus if provided
        if (this.eventBus) {
            this.eventBus.subscribe('*', (event, data) => {
                this.handleEvent(event, data);
            });
        }
    }

    /**
     * Register a webhook
     * 
     * @param {Object} config - Webhook configuration
     * @param {string} config.event - Event pattern to subscribe to
     * @param {string} config.url - Webhook URL
     * @param {string} [config.secret] - HMAC secret for signatures
     * @param {number} [config.retries=3] - Max retry attempts
     * @param {number} [config.timeout=5000] - Timeout in milliseconds
     * @param {Object} [config.filter] - Event data filter
     */
    register(config) {
        const {
            event,
            url,
            secret = null,
            retries = 3,
            timeout = 5000,
            filter = null
        } = config;

        if (!event || !url) {
            throw new Error('Event pattern and URL are required');
        }

        // Validate URL
        try {
            new URL(url);
        } catch (error) {
            throw new Error(`Invalid webhook URL: ${url}`);
        }

        const webhookId = `${event}-${Date.now()}`;
        
        this.webhooks.set(webhookId, {
            id: webhookId,
            event,
            url,
            secret,
            retries,
            timeout,
            filter,
            createdAt: new Date(),
            deliveries: 0,
            failures: 0,
            lastDelivery: null
        });

        return webhookId;
    }

    /**
     * Unregister a webhook
     */
    unregister(webhookId) {
        return this.webhooks.delete(webhookId);
    }

    /**
     * List all registered webhooks
     */
    list() {
        return Array.from(this.webhooks.values());
    }

    /**
     * Get webhook by ID
     */
    get(webhookId) {
        return this.webhooks.get(webhookId);
    }

    /**
     * Handle an event and trigger matching webhooks
     */
    async handleEvent(eventName, eventData) {
        const matchingWebhooks = this.findMatchingWebhooks(eventName, eventData);

        for (const webhook of matchingWebhooks) {
            // Don't wait for delivery - fire and forget
            this.deliverWebhook(webhook, eventName, eventData).catch(error => {
                console.error(`Webhook delivery failed: ${error.message}`);
            });
        }
    }

    /**
     * Find webhooks matching the event
     */
    findMatchingWebhooks(eventName, eventData) {
        const matching = [];

        for (const webhook of this.webhooks.values()) {
            // Check event pattern match
            if (webhook.event === '*' || this.matchEventPattern(webhook.event, eventName)) {
                // Check filter if present
                if (!webhook.filter || this.matchFilter(webhook.filter, eventData)) {
                    matching.push(webhook);
                }
            }
        }

        return matching;
    }

    /**
     * Match event pattern (supports wildcards)
     */
    matchEventPattern(pattern, eventName) {
        if (pattern === eventName) return true;
        if (pattern === '*') return true;

        // Convert pattern to regex
        const regexPattern = pattern
            .replace(/\*/g, '.*')
            .replace(/:/g, '\\:');
        
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(eventName);
    }

    /**
     * Match event data against filter
     */
    matchFilter(filter, eventData) {
        for (const [key, value] of Object.entries(filter)) {
            if (eventData[key] !== value) {
                return false;
            }
        }
        return true;
    }

    /**
     * Deliver webhook with retry logic
     */
    async deliverWebhook(webhook, eventName, eventData, attempt = 1) {
        const payload = {
            event: eventName,
            timestamp: new Date().toISOString(),
            data: eventData,
            webhook_id: webhook.id
        };

        // Add HMAC signature if secret provided
        if (webhook.secret) {
            payload.signature = this.generateSignature(payload, webhook.secret);
        }

        const deliveryId = `${webhook.id}-${Date.now()}`;
        const deliveryStart = Date.now();

        try {
            await this.sendHTTPRequest(webhook.url, payload, webhook.timeout);

            // Success - log delivery
            this.logDelivery({
                id: deliveryId,
                webhookId: webhook.id,
                event: eventName,
                url: webhook.url,
                status: 'success',
                attempt,
                duration: Date.now() - deliveryStart,
                timestamp: new Date()
            });

            webhook.deliveries++;
            webhook.lastDelivery = new Date();

        } catch (error) {
            webhook.failures++;

            // Retry if attempts remaining
            if (attempt < webhook.retries) {
                const delay = this.getRetryDelay(attempt);
                
                this.logDelivery({
                    id: deliveryId,
                    webhookId: webhook.id,
                    event: eventName,
                    url: webhook.url,
                    status: 'retry',
                    attempt,
                    error: error.message,
                    nextRetry: delay,
                    timestamp: new Date()
                });

                await this.sleep(delay);
                return this.deliverWebhook(webhook, eventName, eventData, attempt + 1);
            }

            // Final failure
            this.logDelivery({
                id: deliveryId,
                webhookId: webhook.id,
                event: eventName,
                url: webhook.url,
                status: 'failed',
                attempt,
                error: error.message,
                timestamp: new Date()
            });

            throw error;
        }
    }

    /**
     * Send HTTP POST request
     */
    sendHTTPRequest(url, payload, timeout) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const isHTTPS = urlObj.protocol === 'https:';
            const transport = isHTTPS ? https : http;

            const payloadStr = JSON.stringify(payload);

            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (isHTTPS ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payloadStr),
                    'User-Agent': 'ChatLLM-Webhook/2.2'
                },
                timeout
            };

            const req = transport.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({ statusCode: res.statusCode, body: data });
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                });
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.write(payloadStr);
            req.end();
        });
    }

    /**
     * Generate HMAC signature
     */
    generateSignature(payload, secret) {
        const payloadStr = JSON.stringify(payload);
        return crypto
            .createHmac('sha256', secret)
            .update(payloadStr)
            .digest('hex');
    }

    /**
     * Get retry delay with exponential backoff
     */
    getRetryDelay(attempt) {
        return Math.min(1000 * Math.pow(2, attempt - 1), 30000);
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Log delivery attempt
     */
    logDelivery(entry) {
        this.deliveryLog.push(entry);

        // Trim log if too large
        if (this.deliveryLog.length > this.maxLogSize) {
            this.deliveryLog.shift();
        }
    }

    /**
     * Get delivery log
     */
    getDeliveryLog(webhookId = null, limit = 100) {
        let log = this.deliveryLog;

        if (webhookId) {
            log = log.filter(entry => entry.webhookId === webhookId);
        }

        return log.slice(-limit);
    }

    /**
     * Get webhook statistics
     */
    getStats(webhookId = null) {
        if (webhookId) {
            const webhook = this.webhooks.get(webhookId);
            if (!webhook) return null;

            return {
                id: webhook.id,
                event: webhook.event,
                url: webhook.url,
                deliveries: webhook.deliveries,
                failures: webhook.failures,
                successRate: webhook.deliveries > 0 
                    ? ((webhook.deliveries - webhook.failures) / webhook.deliveries * 100).toFixed(2) + '%'
                    : '0%',
                lastDelivery: webhook.lastDelivery
            };
        }

        // Overall stats
        const stats = {
            totalWebhooks: this.webhooks.size,
            totalDeliveries: 0,
            totalFailures: 0,
            recentDeliveries: this.deliveryLog.length
        };

        for (const webhook of this.webhooks.values()) {
            stats.totalDeliveries += webhook.deliveries;
            stats.totalFailures += webhook.failures;
        }

        stats.successRate = stats.totalDeliveries > 0
            ? ((stats.totalDeliveries - stats.totalFailures) / stats.totalDeliveries * 100).toFixed(2) + '%'
            : '0%';

        return stats;
    }
}

module.exports = { WebhookManager };
