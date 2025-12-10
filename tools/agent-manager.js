/**
 * Agent Manager - Multi-purpose agent orchestration and delegation system
 * Provides a framework for creating specialized agents for different tasks
 * 
 * @module AgentManager
 * @author yonikashi432
 * @version 2.0.0
 */

class AgentManager {
  /**
   * Initialize the Agent Manager
   */
  constructor() {
    this.agents = new Map();
    this.activeAgent = null;
    this.agentHistory = [];
    this.registerDefaultAgents();
  }

  /**
   * Register default agent personas for common tasks
   */
  registerDefaultAgents() {
    // Research Agent - for gathering and synthesizing information
    this.registerAgent('researcher', {
      name: 'Research Agent',
      description: 'Gathers and synthesizes information on various topics',
      systemPrompt: `You are a Research Agent specializing in gathering, analyzing, and synthesizing information. 
Your role is to:
- Provide comprehensive, well-sourced responses
- Cite key facts and data points
- Identify gaps in current knowledge
- Suggest further areas of investigation
- Present multiple perspectives when relevant`,
      capabilities: ['research', 'analysis', 'synthesis', 'fact-checking']
    });

    // Code Agent - for programming tasks
    this.registerAgent('coder', {
      name: 'Code Agent',
      description: 'Assists with programming, debugging, and code optimization',
      systemPrompt: `You are a Code Agent specializing in software development.
Your expertise includes:
- Writing clean, maintainable code in multiple languages
- Debugging and fixing code issues
- Code optimization and refactoring
- Explaining code concepts and best practices
- Suggesting architectural improvements
- Security and performance optimization`,
      capabilities: ['coding', 'debugging', 'optimization', 'architecture']
    });

    // Content Agent - for writing and creative tasks
    this.registerAgent('writer', {
      name: 'Content Agent',
      description: 'Creates high-quality written content across multiple formats',
      systemPrompt: `You are a Content Agent specializing in creative and technical writing.
Your strengths include:
- Clear, engaging writing for diverse audiences
- Multiple content formats (articles, blogs, technical docs)
- Storytelling and narrative structure
- Tone adaptation based on context
- Editing and improvement suggestions
- Content optimization for target audience`,
      capabilities: ['writing', 'editing', 'storytelling', 'formatting']
    });

    // Analyst Agent - for data analysis and decision support
    this.registerAgent('analyst', {
      name: 'Analysis Agent',
      description: 'Analyzes data, identifies patterns, and supports decision-making',
      systemPrompt: `You are an Analysis Agent specializing in data interpretation and insights.
Your responsibilities:
- Extract meaningful patterns from data
- Identify correlations and causation
- Present findings clearly with visualizations described
- Support evidence-based decision making
- Highlight risks and opportunities
- Provide actionable recommendations`,
      capabilities: ['analysis', 'statistics', 'insights', 'recommendations']
    });

    // Tutor Agent - for learning and education
    this.registerAgent('tutor', {
      name: 'Tutor Agent',
      description: 'Educational agent that explains concepts and creates learning materials',
      systemPrompt: `You are a Tutor Agent dedicated to helping people learn effectively.
Your teaching approach:
- Break complex topics into understandable parts
- Use analogies and real-world examples
- Ask clarifying questions
- Adapt explanations to learning level
- Create practice problems and exercises
- Provide constructive feedback
- Encourage deeper understanding`,
      capabilities: ['teaching', 'explanation', 'exercises', 'feedback']
    });

    // Problem Solver Agent - for logical and practical problem-solving
    this.registerAgent('solver', {
      name: 'Problem Solver Agent',
      description: 'Solves complex problems using structured methodologies',
      systemPrompt: `You are a Problem Solver Agent specializing in logical and practical solutions.
Your methodology:
- Define the problem clearly
- Break down into manageable components
- Identify root causes
- Generate multiple solution approaches
- Evaluate trade-offs
- Provide implementation steps
- Anticipate potential obstacles`,
      capabilities: ['problem-solving', 'logic', 'methodology', 'implementation']
    });

    // Customer Support Agent - for customer interaction
    this.registerAgent('support', {
      name: 'Support Agent',
      description: 'Professional customer service and support specialist',
      systemPrompt: `You are a Support Agent providing professional customer service.
Your principles:
- Empathy and understanding
- Clear, patient explanations
- Efficient problem resolution
- Proactive support
- Maintaining professional tone
- Following up appropriately
- Escalating when necessary`,
      capabilities: ['support', 'troubleshooting', 'communication', 'empathy']
    });
  }

  /**
   * Register a custom agent
   * @param {string} id - Unique agent identifier
   * @param {Object} config - Agent configuration
   * @param {string} config.name - Agent name
   * @param {string} config.description - Agent description
   * @param {string} config.systemPrompt - System prompt for the agent
   * @param {Array<string>} config.capabilities - List of agent capabilities
   * @returns {void}
   */
  registerAgent(id, config) {
    this.agents.set(id, {
      id,
      ...config,
      createdAt: new Date(),
      usageCount: 0,
      totalTokens: 0
    });
  }

  /**
   * Activate an agent for use
   * @param {string} agentId - Agent identifier
   * @returns {Object|null} Agent configuration or null if not found
   */
  activateAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return null;
    }
    this.activeAgent = agentId;
    this.agentHistory.push({
      agentId,
      activatedAt: new Date(),
      timestamp: Date.now()
    });
    return agent;
  }

  /**
   * Get the currently active agent
   * @returns {Object|null} Current agent or null
   */
  getActiveAgent() {
    return this.agents.get(this.activeAgent) || null;
  }

  /**
   * Get all registered agents
   * @returns {Array<Object>} List of all agents
   */
  listAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * Get agent by ID
   * @param {string} agentId - Agent identifier
   * @returns {Object|null} Agent or null if not found
   */
  getAgent(agentId) {
    return this.agents.get(agentId) || null;
  }

  /**
   * Update agent usage statistics
   * @param {string} agentId - Agent identifier
   * @param {number} tokensUsed - Number of tokens used
   * @returns {void}
   */
  updateAgentStats(agentId, tokensUsed = 0) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.usageCount += 1;
      agent.totalTokens += tokensUsed;
      agent.lastUsedAt = new Date();
    }
  }

  /**
   * Get agent statistics
   * @param {string} agentId - Optional agent ID to filter
   * @returns {Object|Array<Object>} Agent stats
   */
  getStats(agentId = null) {
    if (agentId) {
      const agent = this.agents.get(agentId);
      return agent ? {
        id: agent.id,
        name: agent.name,
        usageCount: agent.usageCount,
        totalTokens: agent.totalTokens,
        createdAt: agent.createdAt,
        lastUsedAt: agent.lastUsedAt || null
      } : null;
    }

    return Array.from(this.agents.values()).map(agent => ({
      id: agent.id,
      name: agent.name,
      usageCount: agent.usageCount,
      totalTokens: agent.totalTokens,
      createdAt: agent.createdAt,
      lastUsedAt: agent.lastUsedAt || null
    }));
  }

  /**
   * Get system prompt for an agent
   * @param {string} agentId - Agent identifier
   * @returns {string|null} System prompt or null if agent not found
   */
  getSystemPrompt(agentId) {
    const agent = this.agents.get(agentId);
    return agent ? agent.systemPrompt : null;
  }

  /**
   * Check if agent has a capability
   * @param {string} agentId - Agent identifier
   * @param {string} capability - Capability to check
   * @returns {boolean} Whether agent has capability
   */
  hasCapability(agentId, capability) {
    const agent = this.agents.get(agentId);
    return agent && agent.capabilities && agent.capabilities.includes(capability);
  }

  /**
   * Find agents with specific capability
   * @param {string} capability - Capability to search for
   * @returns {Array<Object>} List of agents with capability
   */
  findAgentsByCapability(capability) {
    return Array.from(this.agents.values()).filter(agent =>
      agent.capabilities && agent.capabilities.includes(capability)
    );
  }

  /**
   * Get agent history
   * @returns {Array<Object>} Agent activation history
   */
  getHistory() {
    return this.agentHistory;
  }

  /**
   * Clear agent history
   * @returns {void}
   */
  clearHistory() {
    this.agentHistory = [];
  }
}

module.exports = { AgentManager };
