/**
 * Conversation Manager - Multi-turn conversation tracking, context optimization, and intent classification
 * Manages complex multi-turn conversations with memory management and intent tracking
 */

const fs = require('fs');
const path = require('path');

class ConversationManager {
    constructor(storageDir = './conversations') {
        this.storageDir = storageDir;
        this.conversations = new Map();
        this.intentClassifier = new IntentClassifier();
        this.contextOptimizer = new ContextOptimizer();
        this.ensureDir();
    }

    ensureDir() {
        if (!fs.existsSync(this.storageDir)) {
            fs.mkdirSync(this.storageDir, { recursive: true });
        }
    }

    /**
     * Start a new conversation
     * @param {string} conversationId - Unique conversation ID
     * @param {Object} metadata - Conversation metadata
     */
    startConversation(conversationId, metadata = {}) {
        const conversation = {
            id: conversationId,
            startTime: new Date().toISOString(),
            messages: [],
            turns: 0,
            intents: [],
            entities: [],
            context: {},
            metadata,
            state: 'active'
        };

        this.conversations.set(conversationId, conversation);
        return conversation;
    }

    /**
     * Add message to conversation
     * @param {string} conversationId - Conversation ID
     * @param {string} role - 'user' or 'assistant'
     * @param {string} content - Message content
     */
    addMessage(conversationId, role, content) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) {
            throw new Error(`Conversation ${conversationId} not found`);
        }

        const message = {
            role,
            content,
            timestamp: new Date().toISOString(),
            turnNumber: conversation.turns,
            intent: null,
            entities: [],
            sentiment: null
        };

        // Classify intent
        if (role === 'user') {
            message.intent = this.intentClassifier.classify(content);
            message.entities = this.intentClassifier.extractEntities(content);
            conversation.intents.push(message.intent);
            conversation.turns++;
        }

        conversation.messages.push(message);
        this.updateContext(conversation, message);

        return message;
    }

    /**
     * Update conversation context based on new message
     */
    updateContext(conversation, message) {
        if (message.role === 'user') {
            // Extract entities and update context
            message.entities.forEach(entity => {
                conversation.context[entity.type] = entity.value;
            });

            // Track conversation flow
            if (!conversation.context.flow) {
                conversation.context.flow = [];
            }
            conversation.context.flow.push({
                intent: message.intent,
                turn: message.turnNumber
            });
        }
    }

    /**
     * Get optimized context for LLM
     * @param {string} conversationId - Conversation ID
     * @param {number} maxTokens - Max tokens for context
     */
    getOptimizedContext(conversationId, maxTokens = 4000) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) {
            throw new Error(`Conversation ${conversationId} not found`);
        }

        // Get recent messages
        const recentMessages = conversation.messages.slice(-10);
        const relevantMessages = this.contextOptimizer.selectRelevantMessages(
            recentMessages,
            conversation.intents
        );

        // Compress context if needed
        let context = {
            conversationId,
            summary: this.generateConversationSummary(conversation),
            recentMessages: relevantMessages,
            context: conversation.context,
            intents: conversation.intents.slice(-3)
        };

        // Check token count and compress if necessary
        if (this.estimateTokenCount(context) > maxTokens) {
            context = this.contextOptimizer.compressContext(context, maxTokens);
        }

        return context;
    }

    /**
     * Generate conversation summary
     */
    generateConversationSummary(conversation) {
        const intents = [...new Set(conversation.intents)];
        const turns = conversation.messages.filter(m => m.role === 'user').length;

        return {
            totalTurns: turns,
            uniqueIntents: intents,
            primaryIntent: this.getPrimaryIntent(intents),
            duration: new Date(conversation.startTime).getTime(),
            messageCount: conversation.messages.length
        };
    }

    /**
     * Get primary intent from conversation
     */
    getPrimaryIntent(intents) {
        const intentCounts = {};
        intents.forEach(intent => {
            intentCounts[intent] = (intentCounts[intent] || 0) + 1;
        });

        return Object.keys(intentCounts).reduce((max, intent) =>
            intentCounts[intent] > intentCounts[max] ? intent : max
        );
    }

    /**
     * Estimate token count (simple approximation)
     */
    estimateTokenCount(context) {
        const str = JSON.stringify(context);
        return Math.ceil(str.length / 4); // Rough estimate: 4 chars per token
    }

    /**
     * End conversation
     */
    endConversation(conversationId, summary = null) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) {
            throw new Error(`Conversation ${conversationId} not found`);
        }

        conversation.state = 'closed';
        conversation.endTime = new Date().toISOString();
        conversation.summary = summary;

        // Save to disk
        this.saveConversation(conversation);

        return conversation;
    }

    /**
     * Save conversation to disk
     */
    saveConversation(conversation) {
        const filename = path.join(
            this.storageDir,
            `${conversation.id}-${Date.now()}.json`
        );

        fs.writeFileSync(filename, JSON.stringify(conversation, null, 2));
        return filename;
    }

    /**
     * Load conversation from disk
     */
    loadConversation(conversationId) {
        const files = fs.readdirSync(this.storageDir)
            .filter(f => f.startsWith(conversationId))
            .sort();

        if (files.length === 0) {
            throw new Error(`No saved conversation found for ${conversationId}`);
        }

        const data = JSON.parse(fs.readFileSync(
            path.join(this.storageDir, files[files.length - 1]),
            'utf8'
        ));

        this.conversations.set(conversationId, data);
        return data;
    }

    /**
     * Get conversation statistics
     */
    getStatistics(conversationId) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) {
            throw new Error(`Conversation ${conversationId} not found`);
        }

        const userMessages = conversation.messages.filter(m => m.role === 'user');
        const assistantMessages = conversation.messages.filter(m => m.role === 'assistant');

        return {
            conversationId,
            totalTurns: conversation.turns,
            userMessages: userMessages.length,
            assistantMessages: assistantMessages.length,
            avgUserMessageLength: userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length,
            avgAssistantMessageLength: assistantMessages.reduce((sum, m) => sum + m.content.length, 0) / assistantMessages.length,
            intents: [...new Set(conversation.intents)],
            duration: new Date().getTime() - new Date(conversation.startTime).getTime()
        };
    }
}

/**
 * Intent Classifier - Classify user intents
 */
class IntentClassifier {
    constructor() {
        this.intentPatterns = {
            'question': /^(what|when|where|why|how|who|which|can|will|do|does|is|are|be)/i,
            'command': /^(create|delete|update|modify|remove|add|generate|make)/i,
            'clarification': /^(clarify|explain|elaborate|detail|specify)/i,
            'affirmation': /^(yes|yeah|sure|ok|okay|agree|confirm)/i,
            'negation': /^(no|nope|deny|disagree|refuse|reject)/i,
            'greeting': /^(hi|hello|hey|greetings|good morning|good evening)/i,
            'farewell': /^(bye|goodbye|see you|farewell)/i
        };

        this.entityPatterns = {
            'email': /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
            'url': /https?:\/\/[^\s]+/g,
            'date': /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/g,
            'time': /(\d{1,2}:\d{2}\s*(?:am|pm)?)/gi
        };
    }

    /**
     * Classify intent
     */
    classify(text) {
        for (const [intent, pattern] of Object.entries(this.intentPatterns)) {
            if (pattern.test(text.trim())) {
                return intent;
            }
        }
        return 'statement';
    }

    /**
     * Extract entities from text
     */
    extractEntities(text) {
        const entities = [];

        for (const [type, pattern] of Object.entries(this.entityPatterns)) {
            const matches = text.match(pattern) || [];
            matches.forEach(match => {
                entities.push({
                    type,
                    value: match,
                    position: text.indexOf(match)
                });
            });
        }

        return entities;
    }
}

/**
 * Context Optimizer - Optimize context for token efficiency
 */
class ContextOptimizer {
    /**
     * Select relevant messages
     */
    selectRelevantMessages(messages, intents) {
        // Prioritize recent messages and those with similar intents
        return messages
            .map((msg, idx) => ({
                ...msg,
                relevanceScore: this.calculateRelevance(msg, intents, idx, messages.length)
            }))
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 5);
    }

    /**
     * Calculate relevance score
     */
    calculateRelevance(message, intents, index, total) {
        let score = 0;

        // Recency: newer messages are more relevant
        score += (index / total) * 50;

        // Intent matching
        if (message.intent && intents.includes(message.intent)) {
            score += 30;
        }

        // Message length (longer messages often contain important context)
        score += Math.min(message.content.length / 100, 20);

        return score;
    }

    /**
     * Compress context
     */
    compressContext(context, maxTokens) {
        const compressed = { ...context };

        // Remove less relevant messages
        if (compressed.recentMessages.length > 3) {
            compressed.recentMessages = compressed.recentMessages.slice(0, 3);
        }

        // Summarize older context
        if (compressed.context && Object.keys(compressed.context).length > 5) {
            compressed.context = this.summarizeContext(compressed.context);
        }

        return compressed;
    }

    /**
     * Summarize context
     */
    summarizeContext(context) {
        const summary = {};
        const importantKeys = ['primaryIntent', 'entities', 'subject'];

        importantKeys.forEach(key => {
            if (context[key]) {
                summary[key] = context[key];
            }
        });

        return summary;
    }
}

module.exports = { ConversationManager, IntentClassifier, ContextOptimizer };
