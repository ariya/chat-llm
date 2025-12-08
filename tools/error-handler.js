/**
 * Error Handler & Recovery Manager - Robust error handling and recovery
 * Provides circuit breaker pattern, automatic retries, fallbacks, and error monitoring
 * 
 * @module ErrorHandler
 * @author yonikashi432
 * @version 2.0.0
 */

class ErrorHandler {
  /**
   * Initialize the Error Handler
   */
  constructor() {
    this.circuitBreakers = new Map();
    this.errorLog = [];
    this.recoveryStrategies = new Map();
    this.registerDefaultStrategies();
  }

  /**
   * Register default recovery strategies
   */
  registerDefaultStrategies() {
    // Exponential backoff retry strategy
    this.registerStrategy('exponential-backoff', {
      async execute(fn, options = {}) {
        const maxRetries = options.maxRetries || 3;
        const initialDelay = options.initialDelay || 100;
        let lastError;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            return await fn();
          } catch (error) {
            lastError = error;
            if (attempt < maxRetries) {
              const delay = initialDelay * Math.pow(2, attempt);
              const jitter = Math.random() * delay * 0.1; // 10% jitter
              await new Promise(resolve => setTimeout(resolve, delay + jitter));
            }
          }
        }
        throw lastError;
      }
    });

    // Linear backoff retry strategy
    this.registerStrategy('linear-backoff', {
      async execute(fn, options = {}) {
        const maxRetries = options.maxRetries || 3;
        const delayMs = options.delayMs || 1000;
        let lastError;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            return await fn();
          } catch (error) {
            lastError = error;
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
            }
          }
        }
        throw lastError;
      }
    });

    // Fallback strategy
    this.registerStrategy('fallback', {
      async execute(fn, options = {}) {
        try {
          return await fn();
        } catch (error) {
          if (options.fallback) {
            return typeof options.fallback === 'function'
              ? await options.fallback(error)
              : options.fallback;
          }
          throw error;
        }
      }
    });

    // Timeout strategy
    this.registerStrategy('timeout', {
      async execute(fn, options = {}) {
        const timeoutMs = options.timeoutMs || 5000;
        return Promise.race([
          fn(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
          )
        ]);
      }
    });
  }

  /**
   * Register a recovery strategy
   * @param {string} name - Strategy name
   * @param {Object} strategy - Strategy implementation
   */
  registerStrategy(name, strategy) {
    this.recoveryStrategies.set(name, strategy);
  }

  /**
   * Execute function with error handling
   * @param {Function} fn - Function to execute
   * @param {string} strategyName - Recovery strategy to use
   * @param {Object} options - Strategy options
   * @returns {Promise<any>} Function result
   */
  async executeWithStrategy(fn, strategyName = 'exponential-backoff', options = {}) {
    if (!this.recoveryStrategies.has(strategyName)) {
      throw new Error(`Strategy '${strategyName}' not registered`);
    }

    const strategy = this.recoveryStrategies.get(strategyName);
    const context = {
      fnName: fn.name || 'anonymous',
      strategyName,
      startTime: Date.now(),
      attempts: 0
    };

    try {
      const result = await strategy.execute(fn, options);
      this.logError({
        type: 'success',
        functionName: context.fnName,
        strategy: strategyName,
        duration: Date.now() - context.startTime,
        timestamp: new Date()
      });
      return result;
    } catch (error) {
      this.logError({
        type: 'error',
        functionName: context.fnName,
        strategy: strategyName,
        error: error.message,
        duration: Date.now() - context.startTime,
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Create a circuit breaker for a service
   * @param {string} name - Service name
   * @param {Object} options - Circuit breaker options
   * @returns {CircuitBreaker}
   */
  createCircuitBreaker(name, options = {}) {
    const breaker = new CircuitBreaker(name, {
      failureThreshold: options.failureThreshold || 5,
      successThreshold: options.successThreshold || 2,
      timeout: options.timeout || 60000,
      onStateChange: options.onStateChange
    });

    this.circuitBreakers.set(name, breaker);
    return breaker;
  }

  /**
   * Get circuit breaker status
   * @param {string} name - Service name
   * @returns {Object} Circuit breaker status
   */
  getCircuitBreakerStatus(name) {
    if (!this.circuitBreakers.has(name)) {
      return null;
    }
    return this.circuitBreakers.get(name).getStatus();
  }

  /**
   * Log an error
   * @private
   */
  logError(errorInfo) {
    this.errorLog.push({
      ...errorInfo,
      id: this.errorLog.length + 1
    });

    // Keep only last 1000 errors
    if (this.errorLog.length > 1000) {
      this.errorLog.shift();
    }
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getErrorStats() {
    const errors = this.errorLog.filter(e => e.type === 'error');
    const successes = this.errorLog.filter(e => e.type === 'success');

    const errorsByFunction = {};
    errors.forEach(e => {
      if (!errorsByFunction[e.functionName]) {
        errorsByFunction[e.functionName] = { count: 0, strategies: {} };
      }
      errorsByFunction[e.functionName].count++;
      if (!errorsByFunction[e.functionName].strategies[e.strategy]) {
        errorsByFunction[e.functionName].strategies[e.strategy] = 0;
      }
      errorsByFunction[e.functionName].strategies[e.strategy]++;
    });

    return {
      totalErrors: errors.length,
      totalSuccesses: successes.length,
      successRate: errors.length + successes.length > 0
        ? (successes.length / (errors.length + successes.length)) * 100
        : 100,
      errorsByFunction,
      circuitBreakers: Array.from(this.circuitBreakers.values()).map(cb => cb.getStatus())
    };
  }

  /**
   * Get error log
   * @param {number} limit - Maximum records
   * @returns {Array<Object>} Error log entries
   */
  getErrorLog(limit = 50) {
    return this.errorLog.slice(-limit).reverse();
  }

  /**
   * Clear error log
   */
  clearErrorLog() {
    this.errorLog = [];
  }
}

/**
 * Circuit Breaker implementation
 */
class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.state = 'closed'; // closed, open, half-open
    this.failureCount = 0;
    this.successCount = 0;
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 2;
    this.timeout = options.timeout || 60000;
    this.openedAt = null;
    this.onStateChange = options.onStateChange;
  }

  /**
   * Execute function through circuit breaker
   * @param {Function} fn - Function to execute
   * @returns {Promise<any>} Function result
   */
  async execute(fn) {
    if (this.state === 'open') {
      if (Date.now() - this.openedAt > this.timeout) {
        this.state = 'half-open';
        this.successCount = 0;
      } else {
        throw new Error(`Circuit breaker '${this.name}' is OPEN`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   * @private
   */
  onSuccess() {
    this.failureCount = 0;

    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = 'closed';
        this.successCount = 0;
        this.triggerStateChange('closed');
      }
    }
  }

  /**
   * Handle failed execution
   * @private
   */
  onFailure() {
    this.failureCount++;
    this.successCount = 0;

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
      this.openedAt = Date.now();
      this.triggerStateChange('open');
    }
  }

  /**
   * Trigger state change callback
   * @private
   */
  triggerStateChange(newState) {
    if (this.onStateChange) {
      this.onStateChange({
        name: this.name,
        state: newState,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get circuit breaker status
   */
  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      failureThreshold: this.failureThreshold,
      successThreshold: this.successThreshold
    };
  }

  /**
   * Reset circuit breaker
   */
  reset() {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.openedAt = null;
  }
}

module.exports = { ErrorHandler, CircuitBreaker };
