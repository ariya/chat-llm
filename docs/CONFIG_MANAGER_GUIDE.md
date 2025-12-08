# Configuration Manager Module - v2 Documentation

## Overview
The Configuration Manager provides a centralized system for managing application settings with persistence, runtime modification, and profile support. It replaces hardcoded environment variables with a flexible, schema-based configuration system.

## Features
- ✅ Persistent configuration storage (JSON files)
- ✅ Dot-notation access (models.temperature)
- ✅ Runtime modification without restart
- ✅ Configuration profiles/presets
- ✅ Schema validation
- ✅ Default values fallback
- ✅ Import/export configurations

## Architecture

### Configuration Hierarchy

```
Environment Variables (highest priority)
    ↓
User Configuration File (config.json)
    ↓
Configuration Profiles (profiles/*.json)
    ↓
Default Values (lowest priority)
```

### Default Configuration Schema

```javascript
const DEFAULT_CONFIG = {
    // Model settings
    models: {
        chat: 'gpt-4',
        temperature: 0.7,      // 0.0 = deterministic, 1.0 = creative
        maxTokens: 2048,
        topP: 0.9,
        frequencyPenalty: 0.0
    },
    
    // Caching behavior
    caching: {
        enabled: true,
        ttl: 86400000,          // 24 hours in milliseconds
        maxSize: 104857600,     // 100MB
        strategy: 'lru'         // Least recently used
    },
    
    // Logging configuration
    logging: {
        enabled: true,
        level: 'info',          // debug, info, warn, error
        format: 'json',         // json or text
        maxAge: 7               // Keep logs for 7 days
    },
    
    // API settings
    api: {
        timeout: 17000,         // 17 seconds
        maxRetries: 3,
        retryDelay: 1500,
        baseURL: 'https://api.openai.com/v1'
    },
    
    // Feature flags
    features: {
        streaming: true,
        sentimentAnalysis: true,
        requestLogging: true,
        performanceMonitoring: true,
        demoMode: false
    },
    
    // Rate limiting
    rateLimit: {
        requestsPerMinute: 60,
        requestsPerHour: 3000
    }
};
```

## Code Walkthrough

### Complete Implementation

```javascript
// tools/config-manager.js

const fs = require('fs');
const path = require('path');

/**
 * ConfigManager - Centralized configuration management
 */
class ConfigManager {
    constructor(configFile = './config.json', profilesDir = './profiles') {
        this.configFile = configFile;
        this.profilesDir = profilesDir;
        this.config = {};
        this.defaults = this.getDefaults();
        
        // Ensure directories exist
        this.ensureDirectories();
        
        // Load configuration (env vars > user config > defaults)
        this.loadConfiguration();
    }
    
    /**
     * Get default configuration
     */
    getDefaults() {
        return {
            models: {
                chat: process.env.LLM_CHAT_MODEL || 'gpt-4',
                temperature: parseFloat(process.env.LLM_TEMPERATURE) || 0.7,
                maxTokens: parseInt(process.env.LLM_MAX_TOKENS) || 2048,
                topP: 0.9,
                frequencyPenalty: 0.0
            },
            caching: {
                enabled: process.env.CACHE_ENABLED !== 'false',
                ttl: parseInt(process.env.CACHE_TTL) || 86400000,
                maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 104857600,
                strategy: 'lru'
            },
            logging: {
                enabled: true,
                level: process.env.LOG_LEVEL || 'info',
                format: 'json',
                maxAge: 7
            },
            api: {
                timeout: 17000,
                maxRetries: 3,
                retryDelay: 1500,
                baseURL: process.env.LLM_API_BASE_URL || 'https://api.openai.com/v1'
            },
            features: {
                streaming: process.env.LLM_STREAMING !== 'false',
                sentimentAnalysis: true,
                requestLogging: true,
                performanceMonitoring: true,
                demoMode: process.env.LLM_DEMO_MODE === '1'
            },
            rateLimit: {
                requestsPerMinute: 60,
                requestsPerHour: 3000
            }
        };
    }
    
    /**
     * Ensure necessary directories exist
     */
    ensureDirectories() {
        [path.dirname(this.configFile), this.profilesDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    /**
     * Load configuration from file and merge with defaults
     */
    loadConfiguration() {
        // Start with defaults
        this.config = JSON.parse(JSON.stringify(this.defaults));
        
        // Merge user configuration file
        if (fs.existsSync(this.configFile)) {
            try {
                const userConfig = JSON.parse(
                    fs.readFileSync(this.configFile, 'utf-8')
                );
                this.config = this.deepMerge(this.config, userConfig);
            } catch (e) {
                console.error(`Error loading config file: ${e.message}`);
            }
        }
    }
    
    /**
     * Deep merge objects (user config overrides defaults)
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }
    
    /**
     * Get configuration value using dot notation
     * Examples: get('models.temperature'), get('caching.enabled')
     */
    get(path) {
        if (!path) return this.config;
        
        const keys = path.split('.');
        let value = this.config;
        
        for (const key of keys) {
            if (value && typeof value === 'object') {
                value = value[key];
            } else {
                return null;
            }
        }
        
        return value;
    }
    
    /**
     * Set configuration value using dot notation
     * Validates input and persists to disk
     */
    set(path, value) {
        if (!path) {
            throw new Error('Path required');
        }
        
        // Validate value before setting
        this.validateValue(path, value);
        
        // Navigate to parent object
        const keys = path.split('.');
        let obj = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!obj[key] || typeof obj[key] !== 'object') {
                obj[key] = {};
            }
            obj = obj[key];
        }
        
        // Set the value
        const lastKey = keys[keys.length - 1];
        obj[lastKey] = value;
        
        // Persist to disk
        this.saveConfiguration();
        
        return {
            path,
            value,
            message: `Configuration updated: ${path} = ${value}`
        };
    }
    
    /**
     * Validate configuration value
     */
    validateValue(path, value) {
        // Temperature must be between 0 and 1
        if (path === 'models.temperature') {
            if (typeof value !== 'number' || value < 0 || value > 1) {
                throw new Error('Temperature must be a number between 0 and 1');
            }
        }
        
        // maxTokens must be positive integer
        if (path === 'models.maxTokens') {
            if (!Number.isInteger(value) || value <= 0) {
                throw new Error('maxTokens must be a positive integer');
            }
        }
        
        // TTL must be positive number
        if (path === 'caching.ttl') {
            if (typeof value !== 'number' || value <= 0) {
                throw new Error('TTL must be a positive number (milliseconds)');
            }
        }
        
        // Log level must be valid
        if (path === 'logging.level') {
            const validLevels = ['debug', 'info', 'warn', 'error'];
            if (!validLevels.includes(value)) {
                throw new Error(`Log level must be one of: ${validLevels.join(', ')}`);
            }
        }
    }
    
    /**
     * Save configuration to file
     */
    saveConfiguration() {
        try {
            const json = JSON.stringify(this.config, null, 2);
            fs.writeFileSync(this.configFile, json, 'utf-8');
        } catch (e) {
            console.error(`Error saving configuration: ${e.message}`);
            throw e;
        }
    }
    
    /**
     * List all current configuration values
     */
    listAll() {
        return JSON.parse(JSON.stringify(this.config));
    }
    
    /**
     * Save current configuration as a named profile
     */
    saveProfile(profileName) {
        const profilePath = path.join(this.profilesDir, `${profileName}.json`);
        
        try {
            const json = JSON.stringify(this.config, null, 2);
            fs.writeFileSync(profilePath, json, 'utf-8');
            return {
                profile: profileName,
                path: profilePath,
                message: `Profile saved: ${profileName}`
            };
        } catch (e) {
            throw new Error(`Error saving profile: ${e.message}`);
        }
    }
    
    /**
     * Load configuration from a named profile
     */
    loadProfile(profileName) {
        const profilePath = path.join(this.profilesDir, `${profileName}.json`);
        
        if (!fs.existsSync(profilePath)) {
            throw new Error(`Profile not found: ${profileName}`);
        }
        
        try {
            const profile = JSON.parse(
                fs.readFileSync(profilePath, 'utf-8')
            );
            this.config = this.deepMerge(this.defaults, profile);
            return {
                profile: profileName,
                message: `Profile loaded: ${profileName}`
            };
        } catch (e) {
            throw new Error(`Error loading profile: ${e.message}`);
        }
    }
    
    /**
     * List available profiles
     */
    listProfiles() {
        try {
            const files = fs.readdirSync(this.profilesDir);
            return files
                .filter(f => f.endsWith('.json'))
                .map(f => f.replace('.json', ''));
        } catch (e) {
            return [];
        }
    }
    
    /**
     * Reset to default configuration
     */
    reset() {
        this.config = JSON.parse(JSON.stringify(this.defaults));
        this.saveConfiguration();
        return { message: 'Configuration reset to defaults' };
    }
    
    /**
     * Export configuration for backup
     */
    export(filename = 'config-backup.json') {
        const json = JSON.stringify(this.config, null, 2);
        fs.writeFileSync(filename, json, 'utf-8');
        return {
            file: filename,
            message: `Configuration exported to ${filename}`
        };
    }
    
    /**
     * Import configuration from file
     */
    import(filename) {
        if (!fs.existsSync(filename)) {
            throw new Error(`File not found: ${filename}`);
        }
        
        try {
            const imported = JSON.parse(fs.readFileSync(filename, 'utf-8'));
            this.config = this.deepMerge(this.defaults, imported);
            this.saveConfiguration();
            return { message: `Configuration imported from ${filename}` };
        } catch (e) {
            throw new Error(`Error importing configuration: ${e.message}`);
        }
    }
}

module.exports = ConfigManager;
```

## CLI Usage

### Getting Configuration

```bash
# Get specific value (dot notation)
./chat-llm.js config-get models.temperature
# Output: 0.7

./chat-llm.js config-get caching.ttl
# Output: 86400000

./chat-llm.js config-get api.timeout
# Output: 17000

# Get entire section
./chat-llm.js config-get models
# Output: { "chat": "gpt-4", "temperature": 0.7, ... }

# Get everything
./chat-llm.js config-get
# Output: Full configuration object
```

### Setting Configuration

```bash
# Change temperature (for more creative responses)
./chat-llm.js config-set models.temperature 0.9
# Output: Configuration updated: models.temperature = 0.9

# Disable streaming for compatibility
./chat-llm.js config-set features.streaming false

# Change caching TTL to 12 hours
./chat-llm.js config-set caching.ttl 43200000

# Increase max tokens
./chat-llm.js config-set models.maxTokens 4096

# Change log level
./chat-llm.js config-set logging.level debug
```

### Managing Profiles

```bash
# Save current configuration as "creative" profile
./chat-llm.js config-save creative
# Output: Profile saved: creative

# Save as "production" profile
./chat-llm.js config-save production

# List available profiles
./chat-llm.js config-list-profiles
# Output: 
# Available profiles:
#   - creative
#   - production
#   - default

# Load a profile
./chat-llm.js config-load creative
# Output: Profile loaded: creative

# Verify profile was loaded
./chat-llm.js config-get models.temperature
# Output: 0.9
```

### Configuration Profiles

#### Creative Profile (High Temperature)
```json
{
  "models": {
    "temperature": 0.9,
    "topP": 0.95
  }
}
```

#### Production Profile (Low Temperature)
```json
{
  "models": {
    "temperature": 0.3,
    "topP": 0.5
  },
  "logging": {
    "level": "warn"
  },
  "features": {
    "demoMode": false
  }
}
```

#### Analysis Profile (Max Tokens)
```json
{
  "models": {
    "maxTokens": 4096,
    "temperature": 0.5
  },
  "caching": {
    "ttl": 604800000
  }
}
```

## Configuration Examples

### Example 1: Switching Models

```javascript
const ConfigManager = require('./tools/config-manager.js');
const config = new ConfigManager();

// Check current model
console.log('Current model:', config.get('models.chat'));
// Output: gpt-4

// Switch to faster model for testing
config.set('models.chat', 'gpt-3.5-turbo');

// Switch to advanced model
config.set('models.chat', 'gpt-4-turbo-preview');
```

### Example 2: Tuning for Different Tasks

```javascript
// For content analysis (detailed, thorough)
config.set('models.temperature', 0.5);
config.set('models.maxTokens', 2048);

// For brainstorming (creative, diverse)
config.set('models.temperature', 0.9);
config.set('models.maxTokens', 1024);

// For fact-checking (consistent, precise)
config.set('models.temperature', 0.2);
config.set('models.maxTokens', 512);
```

### Example 3: Enabling/Disabling Features

```javascript
// Enable all features for development
config.set('features.streaming', true);
config.set('features.sentimentAnalysis', true);
config.set('features.requestLogging', true);
config.set('logging.level', 'debug');

// Disable features for production
config.set('features.demoMode', false);
config.set('logging.level', 'warn');
```

### Example 4: Managing Cache

```javascript
// Disable cache
config.set('caching.enabled', false);

// Aggressive caching (48 hours)
config.set('caching.ttl', 172800000);

// Conservative caching (6 hours)
config.set('caching.ttl', 21600000);

// Disable cache size limit
config.set('caching.maxSize', null);
```

## Integration with Application

### Using Config in Main App

```javascript
// chat-llm.js integration

const ConfigManager = require('./tools/config-manager.js');
const config = new ConfigManager();

// Get configuration when making API call
const makeAPICall = async (messages) => {
    const apiUrl = config.get('api.baseURL');
    const timeout = config.get('api.timeout');
    const model = config.get('models.chat');
    
    return fetch(`${apiUrl}/chat/completions`, {
        timeout: timeout,
        body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: config.get('models.temperature'),
            max_tokens: config.get('models.maxTokens'),
            stream: config.get('features.streaming')
        })
    });
};

// Check feature flags before enabling features
if (config.get('features.sentimentAnalysis')) {
    const sentiment = analyzeSentiment(userInput);
    // Process sentiment
}

// Dynamic logging level
const shouldLog = (level) => {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = levels[config.get('logging.level')];
    return levels[level] >= currentLevel;
};
```

## Configuration Validation

### Temperature Validation
```javascript
// Must be 0-1
config.set('models.temperature', 0.7);  // ✓ OK
config.set('models.temperature', 1.5);  // ✗ Error: must be 0-1
```

### Token Validation
```javascript
// Must be positive integer
config.set('models.maxTokens', 2048);   // ✓ OK
config.set('models.maxTokens', -100);   // ✗ Error: must be positive
config.set('models.maxTokens', 50.5);   // ✗ Error: must be integer
```

### TTL Validation
```javascript
// Must be positive milliseconds
config.set('caching.ttl', 86400000);    // ✓ OK (24 hours)
config.set('caching.ttl', 0);           // ✗ Error: must be positive
```

## File Structure

```
project/
├── config.json                # User configuration
├── profiles/
│   ├── creative.json
│   ├── production.json
│   └── analysis.json
└── tools/
    └── config-manager.js
```

### Sample config.json
```json
{
  "models": {
    "chat": "gpt-4",
    "temperature": 0.7,
    "maxTokens": 2048,
    "topP": 0.9,
    "frequencyPenalty": 0.0
  },
  "caching": {
    "enabled": true,
    "ttl": 86400000,
    "maxSize": 104857600,
    "strategy": "lru"
  },
  "logging": {
    "enabled": true,
    "level": "info",
    "format": "json",
    "maxAge": 7
  },
  "api": {
    "timeout": 17000,
    "maxRetries": 3,
    "retryDelay": 1500,
    "baseURL": "https://api.openai.com/v1"
  },
  "features": {
    "streaming": true,
    "sentimentAnalysis": true,
    "requestLogging": true,
    "performanceMonitoring": true,
    "demoMode": false
  },
  "rateLimit": {
    "requestsPerMinute": 60,
    "requestsPerHour": 3000
  }
}
```

## Advanced Use Cases

### Dynamic Configuration Updates

```javascript
// Update multiple settings at once
const updateConfig = (updates) => {
    for (const [path, value] of Object.entries(updates)) {
        config.set(path, value);
    }
};

updateConfig({
    'models.temperature': 0.8,
    'models.maxTokens': 3000,
    'logging.level': 'debug'
});
```

### Configuration Rollback

```javascript
// Backup before changes
config.export('config-backup.json');

// Make changes
config.set('models.temperature', 0.95);
config.set('caching.enabled', false);

// Rollback if needed
config.import('config-backup.json');
```

### Configuration Validation & Testing

```javascript
// Validate configuration before deployment
const validateConfig = (configObj) => {
    const errors = [];
    
    if (configObj.models.temperature < 0 || configObj.models.temperature > 1) {
        errors.push('Invalid temperature');
    }
    
    if (configObj.models.maxTokens <= 0) {
        errors.push('Invalid maxTokens');
    }
    
    return errors.length === 0 ? { valid: true } : { valid: false, errors };
};
```

## Best Practices

1. **Use profiles for different environments**
   ```bash
   ./chat-llm.js config-load production
   ```

2. **Validate before setting**
   - Configuration manager includes validation
   - Invalid inputs rejected with errors

3. **Backup before major changes**
   ```bash
   ./chat-llm.js config-export backup.json
   ```

4. **Use environment variables for secrets**
   - API keys in `LLM_API_KEY`
   - Not stored in config files

5. **Document custom configurations**
   - Add README notes when using non-standard settings
   - Share profiles across team

## Troubleshooting

### Configuration Won't Save
**Problem**: `config.set()` doesn't persist
**Solution**: Check directory permissions
```bash
chmod 755 ./
chmod 644 config.json
```

### Configuration Reset to Defaults
**Problem**: Custom settings reverted
**Solution**: Check if environment variables override
```bash
# Environment variables take precedence
export LLM_TEMPERATURE=0.5
./chat-llm.js config-get models.temperature
# Shows 0.5 from env var, not from config file
```

### Profile Not Found
**Problem**: `config-load profile-name` fails
**Solution**: List available profiles
```bash
./chat-llm.js config-list-profiles
# Shows available profiles
```

## Summary

The Configuration Manager provides a robust, validated, persistent configuration system with support for profiles, import/export, and runtime modification. Perfect for managing complex application settings without code changes or restarts.

