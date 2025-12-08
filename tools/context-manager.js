/**
 * Context Manager - Manages custom data, context, and knowledge bases
 * Enables agents to work with custom data, documents, and context
 * 
 * @module ContextManager
 * @author yonikashi432
 * @version 2.0.0
 */

const fs = require('fs');
const path = require('path');

class ContextManager {
  /**
   * Initialize the Context Manager
   * @param {string} dataDir - Directory to store context data
   */
  constructor(dataDir = './context-data') {
    this.dataDir = dataDir;
    this.contexts = new Map();
    this.activeContext = null;
    this.ensureDataDirectory();
    this.loadContexts();
  }

  /**
   * Ensure data directory exists
   */
  ensureDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * Load all contexts from disk
   */
  loadContexts() {
    try {
      if (fs.existsSync(this.dataDir)) {
        const files = fs.readdirSync(this.dataDir);
        files.forEach(file => {
          if (file.endsWith('.json')) {
            const contextName = file.replace('.json', '');
            try {
              const content = fs.readFileSync(
                path.join(this.dataDir, file),
                'utf-8'
              );
              this.contexts.set(contextName, JSON.parse(content));
            } catch (e) {
              console.error(`Failed to load context ${contextName}:`, e.message);
            }
          }
        });
      }
    } catch (e) {
      console.error('Failed to load contexts:', e.message);
    }
  }

  /**
   * Create a new context
   * @param {string} name - Context name
   * @param {Object} data - Initial context data
   * @param {Object} metadata - Context metadata
   * @returns {Object} Created context
   */
  createContext(name, data = {}, metadata = {}) {
    const context = {
      name,
      data,
      metadata: {
        ...metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      },
      documents: [],
      tags: [],
      size: JSON.stringify(data).length
    };

    this.contexts.set(name, context);
    this.saveContext(name);
    return context;
  }

  /**
   * Add or update document in context
   * @param {string} contextName - Context name
   * @param {string} docName - Document name
   * @param {string|Object} content - Document content
   * @param {Object} docMetadata - Document metadata
   * @returns {boolean} Success
   */
  addDocument(contextName, docName, content, docMetadata = {}) {
    const context = this.contexts.get(contextName);
    if (!context) {
      return false;
    }

    // Remove old document if exists
    context.documents = context.documents.filter(doc => doc.name !== docName);

    // Add new document
    context.documents.push({
      name: docName,
      content: typeof content === 'string' ? content : JSON.stringify(content),
      type: typeof content === 'string' ? 'text' : 'json',
      size: typeof content === 'string' ? content.length : JSON.stringify(content).length,
      metadata: {
        ...docMetadata,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      hash: this.hashContent(content)
    });

    context.metadata.updatedAt = new Date();
    context.size = JSON.stringify(context).length;
    this.saveContext(contextName);
    return true;
  }

  /**
   * Get document from context
   * @param {string} contextName - Context name
   * @param {string} docName - Document name
   * @returns {Object|null} Document or null
   */
  getDocument(contextName, docName) {
    const context = this.contexts.get(contextName);
    if (!context) {
      return null;
    }
    return context.documents.find(doc => doc.name === docName) || null;
  }

  /**
   * Add tags to context
   * @param {string} contextName - Context name
   * @param {Array<string>} tags - Tags to add
   * @returns {boolean} Success
   */
  addTags(contextName, tags) {
    const context = this.contexts.get(contextName);
    if (!context) {
      return false;
    }
    context.tags = [...new Set([...context.tags, ...tags])];
    context.metadata.updatedAt = new Date();
    this.saveContext(contextName);
    return true;
  }

  /**
   * Search contexts by tags
   * @param {Array<string>} tags - Tags to search
   * @returns {Array<Object>} Matching contexts
   */
  searchByTags(tags) {
    return Array.from(this.contexts.values()).filter(context =>
      tags.some(tag => context.tags.includes(tag))
    );
  }

  /**
   * Merge contexts
   * @param {string} targetName - Target context name
   * @param {string} sourceName - Source context name
   * @returns {boolean} Success
   */
  mergeContexts(targetName, sourceName) {
    const target = this.contexts.get(targetName);
    const source = this.contexts.get(sourceName);

    if (!target || !source) {
      return false;
    }

    // Merge data
    target.data = { ...target.data, ...source.data };
    
    // Merge documents
    source.documents.forEach(doc => {
      if (!target.documents.find(d => d.name === doc.name)) {
        target.documents.push(doc);
      }
    });

    // Merge tags
    target.tags = [...new Set([...target.tags, ...source.tags])];
    target.metadata.updatedAt = new Date();
    target.size = JSON.stringify(target).length;

    this.saveContext(targetName);
    return true;
  }

  /**
   * Get context
   * @param {string} name - Context name
   * @returns {Object|null} Context or null
   */
  getContext(name) {
    return this.contexts.get(name) || null;
  }

  /**
   * Activate a context
   * @param {string} name - Context name
   * @returns {Object|null} Activated context or null
   */
  activateContext(name) {
    const context = this.contexts.get(name);
    if (!context) {
      return null;
    }
    this.activeContext = name;
    return context;
  }

  /**
   * Get active context
   * @returns {Object|null} Active context or null
   */
  getActiveContext() {
    return this.activeContext ? this.contexts.get(this.activeContext) : null;
  }

  /**
   * List all contexts
   * @returns {Array<Object>} List of context summaries
   */
  listContexts() {
    return Array.from(this.contexts.values()).map(ctx => ({
      name: ctx.name,
      documents: ctx.documents.length,
      tags: ctx.tags,
      size: ctx.size,
      createdAt: ctx.metadata.createdAt,
      updatedAt: ctx.metadata.updatedAt
    }));
  }

  /**
   * Delete context
   * @param {string} name - Context name
   * @returns {boolean} Success
   */
  deleteContext(name) {
    const deleted = this.contexts.delete(name);
    if (deleted && this.activeContext === name) {
      this.activeContext = null;
    }
    try {
      fs.unlinkSync(path.join(this.dataDir, `${name}.json`));
    } catch (e) {
      // File might not exist
    }
    return deleted;
  }

  /**
   * Save context to disk
   * @param {string} name - Context name
   * @returns {boolean} Success
   */
  saveContext(name) {
    try {
      const context = this.contexts.get(name);
      if (!context) {
        return false;
      }
      fs.writeFileSync(
        path.join(this.dataDir, `${name}.json`),
        JSON.stringify(context, null, 2)
      );
      return true;
    } catch (e) {
      console.error(`Failed to save context ${name}:`, e.message);
      return false;
    }
  }

  /**
   * Export context data
   * @param {string} name - Context name
   * @param {string} format - Export format (json|csv|text)
   * @returns {string|null} Exported data or null
   */
  exportContext(name, format = 'json') {
    const context = this.contexts.get(name);
    if (!context) {
      return null;
    }

    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(context, null, 2);
      case 'csv':
        return this.convertToCsv(context);
      case 'text':
        return this.convertToText(context);
      default:
        return null;
    }
  }

  /**
   * Convert context to CSV format
   * @private
   */
  convertToCsv(context) {
    const rows = [];
    rows.push('name,value');
    
    Object.entries(context.data).forEach(([key, value]) => {
      rows.push(`"${key}","${String(value).replace(/"/g, '""')}"`);
    });

    context.documents.forEach(doc => {
      rows.push(`"doc:${doc.name}","${doc.size} bytes"`);
    });

    return rows.join('\n');
  }

  /**
   * Convert context to text format
   * @private
   */
  convertToText(context) {
    let text = `Context: ${context.name}\n`;
    text += `Created: ${context.metadata.createdAt}\n`;
    text += `Updated: ${context.metadata.updatedAt}\n\n`;

    text += 'Data:\n';
    Object.entries(context.data).forEach(([key, value]) => {
      text += `  ${key}: ${value}\n`;
    });

    text += '\nDocuments:\n';
    context.documents.forEach(doc => {
      text += `  - ${doc.name} (${doc.size} bytes)\n`;
    });

    return text;
  }

  /**
   * Hash content for deduplication
   * @private
   */
  hashContent(content) {
    const str = typeof content === 'string' ? content : JSON.stringify(content);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  /**
   * Get context statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const contexts = Array.from(this.contexts.values());
    return {
      totalContexts: contexts.length,
      totalSize: contexts.reduce((sum, c) => sum + c.size, 0),
      totalDocuments: contexts.reduce((sum, c) => sum + c.documents.length, 0),
      activeContext: this.activeContext
    };
  }
}

module.exports = { ContextManager };
