/**
 * Dashboard Server for Chat LLM v2.2
 * 
 * Provides real-time monitoring interface via HTTP
 * Note: WebSocket functionality requires 'ws' package (optional dependency)
 * 
 * @module DashboardServer
 * @version 2.2.0
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class DashboardServer {
    constructor(options = {}) {
        this.port = options.port || 8080;
        this.metricsExporter = options.metricsExporter;
        this.eventBus = options.eventBus;
        this.webhooks = options.webhooks;
        this.performance = options.performance;
        
        this.server = null;
        this.updateInterval = options.updateInterval || 1000; // 1 second
    }

    /**
     * Start the dashboard server
     */
    start() {
        return new Promise((resolve, reject) => {
            // Create HTTP server
            this.server = http.createServer((req, res) => {
                this.handleRequest(req, res);
            });

            this.server.listen(this.port, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`✓ Dashboard server running at http://localhost:${this.port}`);
                    resolve();
                }
            });

            this.server.on('error', reject);
        });
    }

    /**
     * Stop the dashboard server
     */
    stop() {
        if (this.server) {
            this.server.close();
        }
    }

    /**
     * Handle HTTP requests
     */
    handleRequest(req, res) {
        const url = req.url === '/' ? '/index.html' : req.url;

        // API endpoints
        if (url === '/api/metrics') {
            this.handleMetricsAPI(req, res);
        } else if (url === '/api/webhooks') {
            this.handleWebhooksAPI(req, res);
        } else if (url === '/api/health') {
            this.handleHealthAPI(req, res);
        } else {
            // Serve static files
            this.serveStaticFile(url, res);
        }
    }

    /**
     * Serve static files
     */
    serveStaticFile(url, res) {
        const staticDir = path.join(__dirname, 'static');
        const filePath = path.join(staticDir, url);

        // Security: prevent directory traversal
        if (!filePath.startsWith(staticDir)) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('Forbidden');
            return;
        }

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            } else {
                const ext = path.extname(filePath);
                const contentType = this.getContentType(ext);
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(data);
            }
        });
    }

    /**
     * Get content type based on file extension
     */
    getContentType(ext) {
        const types = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.svg': 'image/svg+xml'
        };
        return types[ext] || 'text/plain';
    }

    /**
     * Handle metrics API endpoint
     */
    handleMetricsAPI(req, res) {
        if (!this.metricsExporter) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Metrics not available' }));
            return;
        }

        const metrics = this.metricsExporter.exportJSON();
        res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(metrics));
    }

    /**
     * Handle webhooks API endpoint
     */
    handleWebhooksAPI(req, res) {
        if (!this.webhooks) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Webhooks not available' }));
            return;
        }

        const data = {
            webhooks: this.webhooks.list(),
            stats: this.webhooks.getStats()
        };

        res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(data));
    }

    /**
     * Handle health check API endpoint
     */
    handleHealthAPI(req, res) {
        const health = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage()
        };

        res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(health));
    }
}

module.exports = { DashboardServer };
