/**
 * Plugin Manager - Dynamic plugin system for extending functionality
 * Provides plugin architecture for custom capabilities and integrations
 * 
 * @module PluginManager
 * @author yonikashi432
 * @version 2.0.0
 */

class PluginManager {
  /**
   * Initialize the Plugin Manager
   */
  constructor() {
    this.plugins = new Map();
    this.hooks = new Map();
    this.middlewares = [];
    this.pluginContexts = new Map();
  }

  /**
   * Register a plugin
   * @param {string} name - Plugin name
   * @param {Object} plugin - Plugin definition
   * @param {string} plugin.version - Plugin version
   * @param {string} plugin.author - Plugin author
   * @param {string} plugin.description - Plugin description
   * @param {Array<string>} plugin.hooks - Supported hooks
   * @param {Object} plugin.capabilities - Plugin capabilities
   * @param {Function} plugin.init - Plugin initialization function
   * @returns {void}
   */
  registerPlugin(name, plugin) {
    if (this.plugins.has(name)) {
      throw new Error(`Plugin '${name}' is already registered`);
    }

    const pluginContext = {
      name,
      version: plugin.version || '1.0.0',
      author: plugin.author || 'unknown',
      description: plugin.description || '',
      enabled: false,
      hooks: plugin.hooks || [],
      capabilities: plugin.capabilities || {},
      config: {},
      metadata: {
        registered: new Date(),
        executions: 0,
        errors: 0,
        averageExecutionTime: 0
      }
    };

    // Register plugin hooks
    if (plugin.hooks) {
      plugin.hooks.forEach(hookName => {
        if (!this.hooks.has(hookName)) {
          this.hooks.set(hookName, []);
        }
      });
    }

    this.plugins.set(name, { ...plugin, ...pluginContext });
    this.pluginContexts.set(name, pluginContext);

    // Initialize plugin if init function provided
    if (plugin.init) {
      try {
        plugin.init(this.createPluginAPI(name));
      } catch (error) {
        console.error(`Error initializing plugin '${name}':`, error.message);
      }
    }
  }

  /**
   * Enable a plugin
   * @param {string} name - Plugin name
   * @param {Object} config - Plugin configuration
   * @returns {void}
   */
  enablePlugin(name, config = {}) {
    if (!this.plugins.has(name)) {
      throw new Error(`Plugin '${name}' not found`);
    }

    const plugin = this.plugins.get(name);
    const context = this.pluginContexts.get(name);

    context.enabled = true;
    context.config = config;

    if (plugin.onEnable) {
      try {
        plugin.onEnable(config);
      } catch (error) {
        console.error(`Error enabling plugin '${name}':`, error.message);
        context.enabled = false;
      }
    }
  }

  /**
   * Disable a plugin
   * @param {string} name - Plugin name
   * @returns {void}
   */
  disablePlugin(name) {
    if (!this.plugins.has(name)) {
      throw new Error(`Plugin '${name}' not found`);
    }

    const plugin = this.plugins.get(name);
    const context = this.pluginContexts.get(name);

    context.enabled = false;

    if (plugin.onDisable) {
      try {
        plugin.onDisable();
      } catch (error) {
        console.error(`Error disabling plugin '${name}':`, error.message);
      }
    }
  }

  /**
   * Create plugin API
   * @private
   */
  createPluginAPI(pluginName) {
    return {
      getName: () => pluginName,
      registerHook: (hookName, callback) => {
        if (!this.hooks.has(hookName)) {
          this.hooks.set(hookName, []);
        }
        this.hooks.get(hookName).push({ plugin: pluginName, callback });
      },
      addMiddleware: (middleware) => {
        this.middlewares.push({ plugin: pluginName, middleware });
      },
      executeHook: (hookName, data) => this.executeHook(hookName, data),
      getConfig: () => this.pluginContexts.get(pluginName).config
    };
  }

  /**
   * Execute a hook
   * @param {string} hookName - Hook name
   * @param {Object} data - Hook data
   * @returns {Promise<any>}
   */
  async executeHook(hookName, data = {}) {
    if (!this.hooks.has(hookName)) {
      return data;
    }

    let result = data;
    const hooks = this.hooks.get(hookName);

    for (const hook of hooks) {
      const plugin = this.plugins.get(hook.plugin);
      if (plugin && this.pluginContexts.get(hook.plugin).enabled) {
        try {
          result = await hook.callback(result);
        } catch (error) {
          console.error(`Error in hook '${hookName}' from plugin '${hook.plugin}':`, error.message);
          this.pluginContexts.get(hook.plugin).metadata.errors++;
        }
      }
    }

    return result;
  }

  /**
   * Register a middleware
   * @param {Function} middleware - Middleware function
   * @returns {void}
   */
  registerMiddleware(middleware) {
    this.middlewares.push({ plugin: 'core', middleware });
  }

  /**
   * Apply middlewares to data
   * @param {any} data - Data to process
   * @returns {Promise<any>}
   */
  async applyMiddlewares(data) {
    let result = data;

    for (const { plugin, middleware } of this.middlewares) {
      const context = this.pluginContexts.get(plugin);
      if (!context || context.enabled) {
        try {
          result = await middleware(result);
        } catch (error) {
          console.error(`Middleware error from plugin '${plugin}':`, error.message);
        }
      }
    }

    return result;
  }

  /**
   * Get plugin information
   * @param {string} name - Plugin name
   * @returns {Object} Plugin information
   */
  getPluginInfo(name) {
    if (!this.plugins.has(name)) {
      throw new Error(`Plugin '${name}' not found`);
    }

    const plugin = this.plugins.get(name);
    const context = this.pluginContexts.get(name);

    return {
      name,
      version: plugin.version,
      author: plugin.author,
      description: plugin.description,
      enabled: context.enabled,
      hooks: plugin.hooks || [],
      capabilities: plugin.capabilities || {},
      metadata: context.metadata
    };
  }

  /**
   * List all plugins
   * @param {boolean} enabledOnly - Return only enabled plugins
   * @returns {Array<Object>} List of plugins
   */
  listPlugins(enabledOnly = false) {
    return Array.from(this.plugins.entries())
      .filter(([name]) => !enabledOnly || this.pluginContexts.get(name).enabled)
      .map(([name, plugin]) => ({
        name,
        version: plugin.version,
        enabled: this.pluginContexts.get(name).enabled,
        description: plugin.description
      }));
  }

  /**
   * Get plugin statistics
   * @returns {Object} Plugin statistics
   */
  getPluginStats() {
    const stats = {
      total: this.plugins.size,
      enabled: Array.from(this.pluginContexts.values()).filter(c => c.enabled).length,
      plugins: {}
    };

    for (const [name, plugin] of this.plugins.entries()) {
      const context = this.pluginContexts.get(name);
      stats.plugins[name] = {
        version: plugin.version,
        enabled: context.enabled,
        executions: context.metadata.executions,
        errors: context.metadata.errors,
        averageExecutionTime: context.metadata.averageExecutionTime
      };
    }

    return stats;
  }
}

module.exports = { PluginManager };
