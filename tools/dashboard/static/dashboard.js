/**
 * Chat LLM Dashboard - Client Side
 * v2.2.0
 */

let metricsData = null;
let refreshInterval = 5000; // 5 seconds

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    updateStatus('connected');
    fetchMetrics();
    fetchWebhooks();
    
    // Auto-refresh
    setInterval(() => {
        fetchMetrics();
        fetchWebhooks();
    }, refreshInterval);
});

// Update connection status
function updateStatus(status) {
    const statusEl = document.getElementById('status');
    const dot = statusEl.querySelector('.dot');
    const text = statusEl.querySelector('span:last-child');
    
    if (status === 'connected') {
        dot.className = 'dot connected';
        text.textContent = 'Connected';
    } else if (status === 'error') {
        dot.className = 'dot error';
        text.textContent = 'Connection Error';
    } else {
        dot.className = 'dot';
        text.textContent = 'Connecting...';
    }
}

// Fetch metrics from API
async function fetchMetrics() {
    try {
        const response = await fetch('/api/metrics');
        if (!response.ok) throw new Error('Failed to fetch metrics');
        
        metricsData = await response.json();
        updateDashboard(metricsData);
        updateStatus('connected');
        
        // Update last update time
        document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
    } catch (error) {
        console.error('Error fetching metrics:', error);
        updateStatus('error');
    }
}

// Fetch webhook data
async function fetchWebhooks() {
    try {
        const response = await fetch('/api/webhooks');
        if (!response.ok) return;
        
        const data = await response.json();
        updateWebhookMetrics(data);
    } catch (error) {
        console.error('Error fetching webhooks:', error);
    }
}

// Update dashboard with metrics
function updateDashboard(metrics) {
    // System metrics
    if (metrics.uptime) {
        document.getElementById('uptime').textContent = formatUptime(metrics.uptime);
    }
    
    if (metrics.process && metrics.process.memory) {
        const memMB = Math.floor(metrics.process.memory.heapUsed / 1024 / 1024);
        document.getElementById('memory').textContent = `${memMB} MB`;
    }
    
    document.getElementById('node-version').textContent = metrics.version || 'N/A';
    
    // Performance metrics
    if (metrics.performance) {
        const perf = metrics.performance;
        document.getElementById('requests').textContent = perf.totalOperations || 0;
        
        if (perf.avgDuration) {
            document.getElementById('avg-duration').textContent = `${Math.floor(perf.avgDuration)}ms`;
        }
        
        if (perf.successRate) {
            document.getElementById('success-rate').textContent = perf.successRate;
        }
    }
    
    // Cache metrics
    if (metrics.cache) {
        const cache = metrics.cache;
        document.getElementById('cache-hit-rate').textContent = cache.hitRate || '0%';
        document.getElementById('cache-hits').textContent = cache.hits || 0;
        document.getElementById('cache-size').textContent = cache.diskCacheSizeFormatted || '0 B';
    }
    
    // Memory/Conversations
    if (metrics.memory) {
        const mem = metrics.memory;
        document.getElementById('conversations').textContent = mem.totalConversations || 0;
        document.getElementById('messages').textContent = mem.totalMessages || 0;
        document.getElementById('tokens').textContent = mem.totalTokens || 0;
    }
    
    // Agents
    if (metrics.agents) {
        updateAgentsList(metrics.agents);
    }
}

// Update webhook metrics
function updateWebhookMetrics(data) {
    if (data.stats) {
        document.getElementById('webhooks-total').textContent = data.stats.totalWebhooks || 0;
        document.getElementById('webhooks-deliveries').textContent = data.stats.totalDeliveries || 0;
        document.getElementById('webhooks-success').textContent = data.stats.successRate || '-';
    }
}

// Update agents list
function updateAgentsList(agents) {
    const container = document.getElementById('agents-list');
    
    if (!agents || Object.keys(agents).length === 0) {
        container.innerHTML = '<p class="no-data">No agent data available</p>';
        return;
    }
    
    let html = '';
    for (const [agentId, data] of Object.entries(agents)) {
        const activations = data.activations || 0;
        html += `
            <div class="agent-item">
                <span class="agent-name">${agentId}</span>
                <span class="agent-count">${activations}</span>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Format uptime
function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}
