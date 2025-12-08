/**
 * Memory Manager - Intelligent conversation memory and history management
 * Provides persistent memory, context retention, and intelligent summarization
 * 
 * @module MemoryManager
 * @author yonikashi432
 * @version 2.0.0
 */

const fs = require('fs');
const path = require('path');

class MemoryManager {
  /**
   * Initialize the Memory Manager
   * @param {string} storageDir - Directory to store memory data
   */
  constructor(storageDir = './memory') {
    this.storageDir = storageDir;
    this.conversations = new Map();
    this.shortTermMemory = [];
    this.longTermMemory = new Map();
    this.maxShortTermSize = 100;
    this.maxConversationHistory = 500;
    this.ensureStorage();
    this.loadExistingConversations();
  }

  /**
   * Ensure storage directory exists
   */
  ensureStorage() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Load all existing conversations from disk
   */
  loadExistingConversations() {
    try {
      const files = fs.readdirSync(this.storageDir).filter(file => file.endsWith('.json'));
      files.forEach(file => {
        try {
          const content = fs.readFileSync(path.join(this.storageDir, file), 'utf-8');
          const conversation = JSON.parse(content);
          if (conversation?.id) {
            this.conversations.set(conversation.id, conversation);
          }
        } catch (e) {
          console.error(`Failed to load conversation file ${file}:`, e.message);
        }
      });
    } catch (e) {
      // Ignore if storage dir is empty/missing
    }
  }

  /**
   * Create a new conversation
   * @param {string} conversationId - Unique conversation identifier
   * @param {Object} metadata - Conversation metadata
   * @returns {Object} Conversation object
   */
  createConversation(conversationId, metadata = {}) {
    const conversation = {
      id: conversationId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        ...metadata,
        messageCount: 0,
        tokenCount: 0,
        topics: [],
        participants: []
      }
    };

    this.conversations.set(conversationId, conversation);
    this.saveConversation(conversationId);
    return conversation;
  }

  /**
   * Add message to conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} role - Message role (user, assistant, system)
   * @param {string} content - Message content
   * @param {Object} metadata - Message metadata
   * @returns {boolean} Success
   */
  addMessage(conversationId, role, content, metadata = {}) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return false;
    }

    const message = {
      role,
      content,
      timestamp: new Date(),
      metadata: {
        ...metadata,
        tokens: this.estimateTokens(content)
      }
    };

    conversation.messages.push(message);
    conversation.metadata.messageCount += 1;
    conversation.metadata.tokenCount += message.metadata.tokens;
    conversation.updatedAt = new Date();

    // Add to short-term memory
    this.addToShortTermMemory({
      conversationId,
      message,
      timestamp: message.timestamp
    });

    // Manage conversation size
    if (conversation.messages.length > this.maxConversationHistory) {
      this.summarizeOldMessages(conversationId);
    }

    this.saveConversation(conversationId);
    return true;
  }

  /**
   * Get conversation history
   * @param {string} conversationId - Conversation ID
   * @param {number} limit - Maximum messages to return
   * @returns {Array<Object>} Messages
   */
  getHistory(conversationId, limit = null) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return [];
    }

    let messages = conversation.messages;
    if (limit) {
      messages = messages.slice(-limit);
    }

    return messages;
  }

  /**
   * Get recent messages from short-term memory
   * @param {number} count - Number of messages to retrieve
   * @returns {Array<Object>} Recent messages
   */
  getRecentMemory(count = 10) {
    return this.shortTermMemory.slice(-count);
  }

  /**
   * Add to short-term memory
   * @private
   */
  addToShortTermMemory(item) {
    this.shortTermMemory.push(item);
    if (this.shortTermMemory.length > this.maxShortTermSize) {
      this.shortTermMemory.shift();
    }
  }

  /**
   * Add to long-term memory (knowledge base)
   * @param {string} key - Memory key
   * @param {*} value - Memory value
   * @param {Object} metadata - Memory metadata
   */
  addToLongTermMemory(key, value, metadata = {}) {
    this.longTermMemory.set(key, {
      value,
      metadata: {
        ...metadata,
        createdAt: new Date(),
        accessCount: 0,
        lastAccessedAt: null
      }
    });
  }

  /**
   * Retrieve from long-term memory
   * @param {string} key - Memory key
   * @returns {*|null} Memory value or null
   */
  retrieveFromLongTermMemory(key) {
    const memory = this.longTermMemory.get(key);
    if (memory) {
      memory.metadata.accessCount += 1;
      memory.metadata.lastAccessedAt = new Date();
    }
    return memory ? memory.value : null;
  }

  /**
   * Search long-term memory
   * @param {string} query - Search query
   * @returns {Array<Object>} Matching memories
   */
  searchLongTermMemory(query) {
    const results = [];
    const queryLower = query.toLowerCase();

    this.longTermMemory.forEach((memory, key) => {
      if (key.toLowerCase().includes(queryLower)) {
        results.push({
          key,
          ...memory
        });
      }
    });

    return results;
  }

  /**
   * Summarize old messages in conversation
   * @private
   */
  summarizeOldMessages(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return;
    }

    const splitPoint = Math.floor(conversation.messages.length / 2);
    const oldMessages = conversation.messages.splice(0, splitPoint);

    // Create summary of old messages
    const summary = {
      type: 'summary',
      messageCount: oldMessages.length,
      timespan: {
        start: oldMessages[0].timestamp,
        end: oldMessages[oldMessages.length - 1].timestamp
      },
      keyTopics: this.extractKeyTopics(oldMessages),
      originalMessages: oldMessages
    };

    // Insert summary as single message
    conversation.messages.unshift({
      role: 'system',
      content: `[Summary of ${oldMessages.length} previous messages]`,
      timestamp: oldMessages[0].timestamp,
      metadata: {
        type: 'summary',
        ...summary
      }
    });

    this.saveConversation(conversationId);
  }

  /**
   * Extract key topics from messages
   * @private
   */
  extractKeyTopics(messages) {
    const topics = new Set();
    messages.forEach(msg => {
      if (msg.metadata && msg.metadata.topics) {
        msg.metadata.topics.forEach(topic => topics.add(topic));
      }
    });
    return Array.from(topics);
  }

  /**
   * Get conversation metadata
   * @param {string} conversationId - Conversation ID
   * @returns {Object|null} Conversation metadata or null
   */
  getMetadata(conversationId) {
    const conversation = this.conversations.get(conversationId);
    return conversation ? conversation.metadata : null;
  }

  /**
   * List all conversations
   * @returns {Array<Object>} Conversation summaries
   */
  listConversations() {
    return Array.from(this.conversations.values()).map(conv => ({
      id: conv.id,
      messageCount: conv.metadata.messageCount,
      tokenCount: conv.metadata.tokenCount,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      topics: conv.metadata.topics
    }));
  }

  /**
   * Export conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} format - Export format (json|text|csv)
   * @returns {string|null} Exported data or null
   */
  exportConversation(conversationId, format = 'json') {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return null;
    }

    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(conversation, null, 2);
      case 'text':
        return this.convertToText(conversation);
      case 'csv':
        return this.convertToCsv(conversation);
      default:
        return null;
    }
  }

  /**
   * Convert conversation to text format
   * @private
   */
  convertToText(conversation) {
    let text = `Conversation: ${conversation.id}\n`;
    text += `Created: ${conversation.createdAt}\n`;
    text += `Messages: ${conversation.metadata.messageCount}\n\n`;

    conversation.messages.forEach(msg => {
      text += `[${msg.role.toUpperCase()}] ${msg.timestamp}\n`;
      text += `${msg.content}\n\n`;
    });

    return text;
  }

  /**
   * Convert conversation to CSV format
   * @private
   */
  convertToCsv(conversation) {
    const rows = ['timestamp,role,content'];
    conversation.messages.forEach(msg => {
      const content = msg.content.replace(/"/g, '""').replace(/\n/g, ' ');
      rows.push(`"${msg.timestamp}","${msg.role}","${content}"`);
    });
    return rows.join('\n');
  }

  /**
   * Delete conversation
   * @param {string} conversationId - Conversation ID
   * @returns {boolean} Success
   */
  deleteConversation(conversationId) {
    const deleted = this.conversations.delete(conversationId);
    try {
      fs.unlinkSync(path.join(this.storageDir, `${conversationId}.json`));
    } catch (e) {
      // File might not exist
    }
    return deleted;
  }

  /**
   * Save conversation to disk
   * @private
   */
  saveConversation(conversationId) {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) {
        return false;
      }
      fs.writeFileSync(
        path.join(this.storageDir, `${conversationId}.json`),
        JSON.stringify(conversation, null, 2)
      );
      return true;
    } catch (e) {
      console.error(`Failed to save conversation ${conversationId}:`, e.message);
      return false;
    }
  }

  /**
   * Load conversation from disk
   * @param {string} conversationId - Conversation ID
   * @returns {Object|null} Conversation or null
   */
  loadConversation(conversationId) {
    try {
      const filePath = path.join(this.storageDir, `${conversationId}.json`);
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        const conversation = JSON.parse(data);
        this.conversations.set(conversationId, conversation);
        return conversation;
      }
    } catch (e) {
      console.error(`Failed to load conversation ${conversationId}:`, e.message);
    }
    return null;
  }

  /**
   * Estimate token count for text
   * @private
   */
  estimateTokens(text) {
    // Simple estimation: ~4 characters per token on average
    return Math.ceil(text.length / 4);
  }

  /**
   * Get memory statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const conversations = Array.from(this.conversations.values());
    return {
      totalConversations: conversations.length,
      totalMessages: conversations.reduce((sum, c) => sum + c.metadata.messageCount, 0),
      totalTokens: conversations.reduce((sum, c) => sum + c.metadata.tokenCount, 0),
      shortTermMemorySize: this.shortTermMemory.length,
      longTermMemorySize: this.longTermMemory.size
    };
  }

  /**
   * Clear all memory
   * @param {boolean} clearDisk - Also clear disk storage
   * @returns {void}
   */
  clearAll(clearDisk = false) {
    this.conversations.clear();
    this.shortTermMemory = [];
    this.longTermMemory.clear();

    if (clearDisk) {
      try {
        const files = fs.readdirSync(this.storageDir);
        files.forEach(file => {
          fs.unlinkSync(path.join(this.storageDir, file));
        });
      } catch (e) {
        console.error('Failed to clear disk storage:', e.message);
      }
    }
  }

  /**
   * Check if a conversation exists
   * @param {string} conversationId
   * @returns {boolean}
   */
  hasConversation(conversationId) {
    return this.conversations.has(conversationId);
  }

  /**
   * Ensure a conversation exists, creating it when missing
   * @param {string} conversationId
   * @param {Object} metadata
   */
  ensureConversation(conversationId, metadata = {}) {
    if (!this.hasConversation(conversationId)) {
      this.createConversation(conversationId, metadata);
    }
  }
}

module.exports = { MemoryManager };
