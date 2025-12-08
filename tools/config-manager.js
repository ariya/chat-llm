/**
 * Configuration management for Chat LLM v2
 * Handles application settings, profiles, and user preferences with persistent storage.
 * Supports nested configuration keys with dot notation (e.g., 'models.temperature').
 * 
 * @module ConfigManager
 * @author yonikashi432
 * @version 2.0.0
 * 
 * @example
 * const config = new ConfigManager('./config');
 * config.set('models.temperature', 0.8);
 * const temp = config.get('models.temperature');
 */

const fs = require('fs');
const path = require('path');

class ConfigManager {
    /**
     * Initialize the Configuration Manager
     * @param {string} configDir - Directory to store configuration files (default: './config')
     * @throws {Error} If configuration directory cannot be created
     */
    constructor(configDir = './config') {
        if (typeof configDir !== 'string' || configDir.trim().length === 0) {
            throw new Error('Config directory must be a non-empty string');
        }
        
        this.configDir = configDir;
        this.configFile = path.join(configDir, 'settings.json');
        this.profilesDir = path.join(configDir, 'profiles');
        this.defaultConfig = {
            version: '2.0',
            apiDefaults: {
                timeout: 30,
                retries: 3,
                streaming: true
            },
            caching: {
                enabled: true,
                ttl: 86400000 // 24 hours in milliseconds
            },
            logging: {
                enabled: true,
                level: 'info',
                maxFileSize: 10485760 // 10MB
            },
            models: {
                default: 'gpt-4',
                temperature: 0.7,
                maxTokens: 2000
            }
        };
        this.ensureConfigDir();
        this.loadConfig();
    }

    /**
     * Ensures configuration directories exist
     * @private
     * @throws {Error} If directory creation fails
     */
    ensureConfigDir() {
        try {
            [this.configDir, this.profilesDir].forEach(dir => {
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
            });
        } catch (error) {
            throw new Error(`Failed to create config directories: ${error.message}`);
        }
    }

    /**
     * Loads configuration from disk or creates default configuration
     * @private
     */
    loadConfig() {
        try {
            if (fs.existsSync(this.configFile)) {
                const data = fs.readFileSync(this.configFile, 'utf-8');
                this.config = JSON.parse(data);
                
                // Merge with defaults to ensure all keys exist
                this.config = this.mergeWithDefaults(this.config, this.defaultConfig);
            } else {
                this.config = { ...this.defaultConfig };
                this.saveConfig();
            }
        } catch (error) {
            console.error(`Error loading config: ${error.message}`);
            this.config = { ...this.defaultConfig };
        }
    }
    
    /**
     * Merges user config with default config to ensure all required keys exist
     * @private
     * @param {Object} userConfig - User's configuration
     * @param {Object} defaultConfig - Default configuration
     * @returns {Object} Merged configuration
     */
    mergeWithDefaults(userConfig, defaultConfig) {
        const result = { ...defaultConfig };
        
        for (const key in userConfig) {
            if (typeof userConfig[key] === 'object' && !Array.isArray(userConfig[key])) {
                result[key] = this.mergeWithDefaults(
                    userConfig[key],
                    defaultConfig[key] || {}
                );
            } else {
                result[key] = userConfig[key];
            }
        }
        
        return result;
    }

    /**
     * Saves current configuration to disk
     * @private
     */
    saveConfig() {
        try {
            fs.writeFileSync(
                this.configFile, 
                JSON.stringify(this.config, null, 2), 
                'utf-8'
            );
        } catch (error) {
            console.error(`Error saving config: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get configuration value using dot notation
     * @param {string} key - Configuration key (e.g., 'models.temperature')
     * @param {*} defaultValue - Default value to return if key not found (default: null)
     * @returns {*} Configuration value or default value
     * @throws {TypeError} If key is not a string
     * 
     * @example
     * const temp = config.get('models.temperature', 0.7);
     * const cacheTTL = config.get('caching.ttl');
     */
    get(key, defaultValue = null) {
        if (typeof key !== 'string' || key.trim().length === 0) {
            throw new TypeError('Configuration key must be a non-empty string');
        }
        
        const keys = key.split('.');
        let value = this.config;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return defaultValue;
            }
        }

        return value;
    }

    /**
     * Set configuration value using dot notation
     * Automatically creates nested objects if they don't exist
     * @param {string} key - Configuration key (e.g., 'models.temperature')
     * @param {*} value - Value to set
     * @throws {TypeError} If key is not a valid string
     * 
     * @example
     * config.set('models.temperature', 0.9);
     * config.set('newSection.newKey', 'value');
     */
    set(key, value) {
        if (typeof key !== 'string' || key.trim().length === 0) {
            throw new TypeError('Configuration key must be a non-empty string');
        }
        
        const keys = key.split('.');
        let obj = this.config;

        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in obj) || typeof obj[k] !== 'object') {
                obj[k] = {};
            }
            obj = obj[k];
        }

        obj[keys[keys.length - 1]] = value;
        this.saveConfig();
    }

    /**
     * Save a named configuration profile
     * @param {string} name - Profile name
     * @param {Object} settings - Configuration settings to save
     * @throws {TypeError} If name is not a valid string or settings is not an object
     * 
     * @example
     * config.saveProfile('production', { models: { temperature: 0.5 } });
     */
    saveProfile(name, settings) {
        if (typeof name !== 'string' || name.trim().length === 0) {
            throw new TypeError('Profile name must be a non-empty string');
        }
        
        if (typeof settings !== 'object' || settings === null) {
            throw new TypeError('Settings must be an object');
        }
        
        try {
            const filepath = path.join(this.profilesDir, `${name}.json`);
            fs.writeFileSync(filepath, JSON.stringify(settings, null, 2), 'utf-8');
        } catch (error) {
            console.error(`Error saving profile '${name}': ${error.message}`);
            throw error;
        }
    }

    /**
     * Load a named configuration profile
     * @param {string} name - Profile name to load
     * @returns {Object|null} Profile configuration or null if not found
     * @throws {TypeError} If name is not a string
     * 
     * @example
     * const prodConfig = config.loadProfile('production');
     */
    loadProfile(name) {
        if (typeof name !== 'string' || name.trim().length === 0) {
            throw new TypeError('Profile name must be a non-empty string');
        }
        
        try {
            const filepath = path.join(this.profilesDir, `${name}.json`);
            if (fs.existsSync(filepath)) {
                const data = fs.readFileSync(filepath, 'utf-8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error(`Error loading profile '${name}': ${error.message}`);
        }
        return null;
    }

    /**
     * List all available configuration profiles
     * @returns {Array<string>} Array of profile names
     * 
     * @example
     * const profiles = config.listProfiles();
     * console.log('Available profiles:', profiles.join(', '));
     */
    listProfiles() {
        try {
            if (!fs.existsSync(this.profilesDir)) {
                return [];
            }
            const files = fs.readdirSync(this.profilesDir);
            return files.filter(f => f.endsWith('.json')).map(f => f.slice(0, -5));
        } catch (error) {
            console.error(`Error listing profiles: ${error.message}`);
            return [];
        }
    }

    /**
     * Export current configuration as JSON string
     * @returns {string} JSON representation of current configuration
     * 
     * @example
     * const configJson = config.export();
     * fs.writeFileSync('backup.json', configJson);
     */
    export() {
        return JSON.stringify(this.config, null, 2);
    }

    /**
     * Reset configuration to default values
     * WARNING: This will delete all custom settings
     * 
     * @example
     * config.reset(); // Restore factory defaults
     */
    reset() {
        this.config = { ...this.defaultConfig };
        this.saveConfig();
    }
    
    /**
     * Get all configuration (entire config object)
     * @returns {Object} Complete configuration object
     * 
     * @example
     * const allConfig = config.getAll();
     */
    getAll() {
        return { ...this.config };
    }
    
    /**
     * Apply a profile to current configuration
     * @param {string} name - Profile name to apply
     * @returns {boolean} True if profile was applied successfully
     * 
     * @example
     * config.applyProfile('production'); // Load and merge production settings
     */
    applyProfile(name) {
        const profile = this.loadProfile(name);
        if (profile) {
            this.config = this.mergeWithDefaults(profile, this.config);
            this.saveConfig();
            return true;
        }
        return false;
    }
}

module.exports = { ConfigManager };
