/**
 * Event Bus Manager - Decoupled event-driven architecture
 * Provides pub/sub messaging with pattern matching and event persistence
 * 
 * @module EventBusManager
 * @author yonikashi432
 * @version 2.0.0
 */

class EventBusManager {
  /**
   * Initialize the Event Bus Manager
   */
  constructor() {
    this.subscribers = new Map();
    this.eventHistory = [];
    this.eventFilters = new Map();
    this.deadLetterQueue = [];
    this.maxHistorySize = 1000;
  }

  /**
   * Subscribe to events
   * @param {string} eventType - Event type pattern (supports wildcards)
   * @param {Function} callback - Event callback handler
   * @param {Object} options - Subscription options
   * @returns {Function} Unsubscribe function
   */
  subscribe(eventType, callback, options = {}) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }

    const subscription = {
      callback,
      once: options.once || false,
      priority: options.priority || 0,
      filter: options.filter || null,
      timeout: options.timeout || null,
      retryCount: options.retryCount || 0,
      createdAt: new Date()
    };

    this.subscribers.get(eventType).push(subscription);

    // Sort by priority (higher priority first)
    this.subscribers.get(eventType).sort((a, b) => b.priority - a.priority);

    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(eventType);
      const index = subs.indexOf(subscription);
      if (index > -1) {
        subs.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to event once
   * @param {string} eventType - Event type
   * @param {Function} callback - Event callback
   * @returns {Function} Unsubscribe function
   */
  once(eventType, callback) {
    return this.subscribe(eventType, callback, { once: true });
  }

  /**
   * Publish an event
   * @param {string} eventType - Event type
   * @param {any} data - Event data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Array>} Promise with handler results
   */
  async publish(eventType, data = {}, metadata = {}) {
    const event = {
      type: eventType,
      data,
      metadata: {
        ...metadata,
        timestamp: new Date(),
        id: `${eventType}-${Date.now()}-${Math.random()}`
      }
    };

    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Find matching subscribers
    const matchingSubscribers = this.getMatchingSubscribers(eventType);
    const results = [];

    for (const subscription of matchingSubscribers) {
      try {
        // Apply filter if present
        if (subscription.filter && !subscription.filter(event.data)) {
          continue;
        }

        // Execute with timeout if specified
        let result;
        if (subscription.timeout) {
          result = await this.executeWithTimeout(
            subscription.callback,
            event,
            subscription.timeout
          );
        } else {
          result = await subscription.callback(event.data, event.metadata);
        }

        results.push({ subscription, result, success: true });

        // Remove if one-time subscription
        if (subscription.once) {
          const subs = this.subscribers.get(eventType);
          const index = subs.indexOf(subscription);
          if (index > -1) {
            subs.splice(index, 1);
          }
        }
      } catch (error) {
        results.push({ subscription, error: error.message, success: false });
        this.handleSubscriberError(event, subscription, error);
      }
    }

    return results;
  }

  /**
   * Get matching subscribers using pattern matching
   * @private
   */
  getMatchingSubscribers(eventType) {
    const matching = [];

    for (const [pattern, subscribers] of this.subscribers.entries()) {
      if (this.matchesPattern(eventType, pattern)) {
        matching.push(...subscribers);
      }
    }

    return matching;
  }

  /**
   * Pattern matching for event types
   * @private
   */
  matchesPattern(eventType, pattern) {
    if (pattern === eventType) return true;

    // Support wildcards: 'event.*' matches 'event.user', 'event.system', etc.
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
      .replace(/\*/g, '.*'); // Replace * with .*

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(eventType);
  }

  /**
   * Execute callback with timeout
   * @private
   */
  async executeWithTimeout(callback, event, timeoutMs) {
    return Promise.race([
      callback(event.data, event.metadata),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  /**
   * Handle subscriber error
   * @private
   */
  handleSubscriberError(event, subscription, error) {
    const errorEvent = {
      type: 'event-bus:error',
      originalEvent: event.type,
      error: error.message,
      subscription: {
        priority: subscription.priority,
        createdAt: subscription.createdAt
      },
      timestamp: new Date()
    };

    this.deadLetterQueue.push(errorEvent);
    if (this.deadLetterQueue.length > 100) {
      this.deadLetterQueue.shift();
    }
  }

  /**
   * Get event history
   * @param {string} eventType - Filter by event type (optional)
   * @param {number} limit - Maximum results
   * @returns {Array<Object>} Event history
   */
  getEventHistory(eventType = null, limit = 50) {
    let history = this.eventHistory;
    if (eventType) {
      history = history.filter(e => this.matchesPattern(e.type, eventType));
    }
    return history.slice(-limit).reverse();
  }

  /**
   * Clear event history
   */
  clearHistory() {
    this.eventHistory = [];
  }

  /**
   * Get dead letter queue
   * @param {number} limit - Maximum results
   * @returns {Array<Object>} Dead letter queue items
   */
  getDeadLetterQueue(limit = 50) {
    return this.deadLetterQueue.slice(-limit).reverse();
  }

  /**
   * Clear dead letter queue
   */
  clearDeadLetterQueue() {
    this.deadLetterQueue = [];
  }

  /**
   * Create event filter
   * @param {string} name - Filter name
   * @param {Function} filterFn - Filter function
   */
  registerFilter(name, filterFn) {
    this.eventFilters.set(name, filterFn);
  }

  /**
   * Get filter
   * @param {string} name - Filter name
   * @returns {Function} Filter function
   */
  getFilter(name) {
    return this.eventFilters.get(name);
  }

  /**
   * Get event bus statistics
   * @returns {Object} Event bus statistics
   */
  getStats() {
    const eventTypes = new Map();

    for (const event of this.eventHistory) {
      if (!eventTypes.has(event.type)) {
        eventTypes.set(event.type, 0);
      }
      eventTypes.set(event.type, eventTypes.get(event.type) + 1);
    }

    return {
      totalEvents: this.eventHistory.length,
      totalSubscribers: Array.from(this.subscribers.values())
        .reduce((sum, subs) => sum + subs.length, 0),
      eventTypes: Object.fromEntries(eventTypes),
      deadLetterQueueSize: this.deadLetterQueue.length,
      subscriberCounts: Object.fromEntries(
        Array.from(this.subscribers.entries()).map(([type, subs]) => [type, subs.length])
      )
    };
  }

  /**
   * Wait for an event
   * @param {string} eventType - Event type to wait for
   * @param {number} timeoutMs - Timeout in milliseconds
   * @returns {Promise<Object>} Event data
   */
  waitFor(eventType, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      const unsubscribe = this.once(eventType, (data, metadata) => {
        clearTimeout(timer);
        resolve({ data, metadata });
      });

      const timer = setTimeout(() => {
        unsubscribe();
        reject(new Error(`Timeout waiting for event '${eventType}'`));
      }, timeoutMs);
    });
  }

  /**
   * Emit a batch of events
   * @param {Array<Object>} events - Events to emit
   * @returns {Promise<Array>} Results for all events
   */
  async emitBatch(events) {
    const results = [];
    for (const event of events) {
      const result = await this.publish(event.type, event.data, event.metadata);
      results.push(result);
    }
    return results;
  }

  /**
   * List all subscribers
   * @returns {Object} Subscriber information
   */
  listSubscribers() {
    const list = {};
    for (const [eventType, subscriptions] of this.subscribers.entries()) {
      list[eventType] = subscriptions.map(sub => ({
        priority: sub.priority,
        once: sub.once,
        hasFilter: !!sub.filter,
        createdAt: sub.createdAt
      }));
    }
    return list;
  }
}

module.exports = { EventBusManager };
