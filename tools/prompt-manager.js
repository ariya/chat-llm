/**
 * Prompt Manager - Advanced prompt templating and management system
 * Provides sophisticated prompt engineering capabilities with variables, conditions, and formats
 * 
 * @module PromptManager
 * @author yonikashi432
 * @version 2.0.0
 */

class PromptManager {
  /**
   * Initialize the Prompt Manager
   */
  constructor() {
    this.templates = new Map();
    this.variables = new Map();
    this.registerDefaultTemplates();
  }

  /**
   * Register built-in prompt templates for common tasks
   */
  registerDefaultTemplates() {
    // Analysis template
    this.registerTemplate('analysis', {
      name: 'Data Analysis',
      description: 'Template for analyzing data and identifying patterns',
      template: `Analyze the following data and provide insights:

Data:
{data}

{#if focus}
Focus areas: {focus}
{/if}

Please provide:
1. Key patterns and trends
2. Anomalies or outliers
3. Statistical summary
4. Actionable insights
{#if recommendations}
5. Recommendations: {recommendations}
{/if}`,
      variables: ['data', 'focus', 'recommendations'],
      tags: ['analysis', 'data']
    });

    // Code Review template
    this.registerTemplate('code-review', {
      name: 'Code Review',
      description: 'Template for thorough code review',
      template: `Please review the following code:

Language: {language}

\`\`\`{language}
{code}
\`\`\`

{#if context}
Context: {context}
{/if}

Please evaluate:
1. Code quality and readability
2. Potential bugs or issues
3. Performance considerations
4. Security implications
5. Best practices compliance
{#if specific_focus}
6. Specific focus: {specific_focus}
{/if}

Provide detailed suggestions for improvement.`,
      variables: ['language', 'code', 'context', 'specific_focus'],
      tags: ['code', 'review']
    });

    // Writing template
    this.registerTemplate('writing', {
      name: 'Content Creation',
      description: 'Template for creating written content',
      template: `Create {content_type} content with the following specifications:

Topic: {topic}
Target Audience: {audience}
Tone: {tone}
Length: {length}

{#if keywords}
Include keywords: {keywords}
{/if}

{#if structure}
Preferred structure: {structure}
{/if}

{#if key_points}
Key points to cover:
{key_points}
{/if}

Please generate high-quality, engaging content that meets these requirements.`,
      variables: ['content_type', 'topic', 'audience', 'tone', 'length', 'keywords', 'structure', 'key_points'],
      tags: ['writing', 'content']
    });

    // Problem Solving template
    this.registerTemplate('problem-solving', {
      name: 'Problem Solving',
      description: 'Structured approach to solving complex problems',
      template: `Help solve the following problem using structured methodology:

Problem Statement:
{problem}

{#if context}
Context: {context}
{/if}

{#if constraints}
Constraints: {constraints}
{/if}

Please provide:
1. Problem analysis and breakdown
2. Root cause identification
3. Multiple solution approaches with pros/cons
4. Recommended solution with implementation steps
5. Risk assessment and mitigation strategies
{#if additional_requirements}
6. Additional considerations: {additional_requirements}
{/if}`,
      variables: ['problem', 'context', 'constraints', 'additional_requirements'],
      tags: ['problem-solving', 'methodology']
    });

    // Translation template
    this.registerTemplate('translation', {
      name: 'Translation',
      description: 'Template for translating content',
      template: `Translate the following {source_language} text to {target_language}:

\`\`\`
{text}
\`\`\`

{#if context}
Context: {context}
{/if}

{#if tone}
Maintain tone: {tone}
{/if}

{#if style}
Style preferences: {style}
{/if}

Provide an accurate, natural translation that preserves meaning and tone.
{#if include_explanation}
Include brief explanation of key translation choices.
{/if}`,
      variables: ['source_language', 'target_language', 'text', 'context', 'tone', 'style', 'include_explanation'],
      tags: ['translation', 'language']
    });

    // Research template
    this.registerTemplate('research', {
      name: 'Research Summary',
      description: 'Template for research and information gathering',
      template: `Provide comprehensive research on: {topic}

{#if aspects}
Focus on these aspects:
{aspects}
{/if}

{#if scope}
Scope: {scope}
{/if}

Please provide:
1. Overview and definitions
2. Current state of knowledge
3. Key findings and research
4. Different perspectives and debates
5. Emerging trends
6. Resources for further reading
{#if specific_questions}
Specific questions to address:
{specific_questions}
{/if}`,
      variables: ['topic', 'aspects', 'scope', 'specific_questions'],
      tags: ['research', 'information']
    });

    // Brainstorming template
    this.registerTemplate('brainstorm', {
      name: 'Brainstorming',
      description: 'Creative brainstorming session template',
      template: `Let's brainstorm ideas for: {topic}

{#if goal}
Goal: {goal}
{/if}

{#if constraints}
Constraints: {constraints}
{/if}

{#if inspiration}
Inspiration/references: {inspiration}
{/if}

Please generate:
1. 10+ creative ideas
2. Unconventional perspectives
3. Hybrid approaches combining elements
4. Implementation feasibility assessment
5. Recommendations for top 3 ideas

Use divergent thinking and be as creative as possible.`,
      variables: ['topic', 'goal', 'constraints', 'inspiration'],
      tags: ['brainstorming', 'creative']
    });
  }

  /**
   * Register a custom template
   * @param {string} id - Template identifier
   * @param {Object} config - Template configuration
   */
  registerTemplate(id, config) {
    this.templates.set(id, {
      id,
      ...config,
      createdAt: new Date(),
      usageCount: 0
    });
  }

  /**
   * Get a template by ID
   * @param {string} id - Template identifier
   * @returns {Object|null} Template or null
   */
  getTemplate(id) {
    return this.templates.get(id) || null;
  }

  /**
   * List all templates
   * @returns {Array<Object>} All templates
   */
  listTemplates() {
    return Array.from(this.templates.values());
  }

  /**
   * Render a template with variables
   * @param {string} templateId - Template identifier
   * @param {Object} variables - Variables to substitute
   * @returns {string|null} Rendered prompt or null
   */
  render(templateId, variables = {}) {
    const template = this.templates.get(templateId);
    if (!template) {
      return null;
    }

    let rendered = template.template;

    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      rendered = rendered.replace(regex, value);
    });

    // Process conditional blocks {#if variable}...{/if}
    rendered = this.processConditionals(rendered, variables);

    // Remove any unreplaced variables
    rendered = rendered.replace(/\{[^}]+\}/g, '');

    template.usageCount += 1;
    template.lastUsedAt = new Date();

    return rendered.trim();
  }

  /**
   * Process conditional blocks in template
   * @private
   */
  processConditionals(text, variables) {
    const conditionalRegex = /\{\#if\s+(\w+)\}([\s\S]*?)\{\/if\}/g;
    
    return text.replace(conditionalRegex, (match, varName, content) => {
      return variables[varName] ? content : '';
    });
  }

  /**
   * Create custom template from text
   * @param {string} id - Template identifier
   * @param {string} name - Template name
   * @param {string} templateText - Template text with {variable} placeholders
   * @param {Array<string>} variables - Variable names
   * @param {Array<string>} tags - Template tags
   */
  createTemplate(id, name, templateText, variables = [], tags = []) {
    this.registerTemplate(id, {
      name,
      description: '',
      template: templateText,
      variables,
      tags,
      custom: true
    });
  }

  /**
   * Set a global variable
   * @param {string} key - Variable name
   * @param {*} value - Variable value
   */
  setVariable(key, value) {
    this.variables.set(key, value);
  }

  /**
   * Get a global variable
   * @param {string} key - Variable name
   * @returns {*|null} Variable value or null
   */
  getVariable(key) {
    return this.variables.get(key) || null;
  }

  /**
   * Render template with global variables merged
   * @param {string} templateId - Template identifier
   * @param {Object} localVariables - Local variables (override globals)
   * @returns {string|null} Rendered prompt or null
   */
  renderWithGlobals(templateId, localVariables = {}) {
    const merged = Object.fromEntries(this.variables);
    Object.assign(merged, localVariables);
    return this.render(templateId, merged);
  }

  /**
   * Find templates by tag
   * @param {string} tag - Tag to search
   * @returns {Array<Object>} Matching templates
   */
  findByTag(tag) {
    return Array.from(this.templates.values()).filter(
      template => template.tags && template.tags.includes(tag)
    );
  }

  /**
   * Chain multiple templates
   * @param {Array<string>} templateIds - Template IDs in order
   * @param {Object} variables - Variables for all templates
   * @returns {Array<string>} Rendered prompts
   */
  chain(templateIds, variables = {}) {
    return templateIds.map(id => this.render(id, variables)).filter(Boolean);
  }

  /**
   * Get template statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const templates = Array.from(this.templates.values());
    return {
      totalTemplates: templates.length,
      mostUsed: templates.sort((a, b) => b.usageCount - a.usageCount)[0],
      totalUsage: templates.reduce((sum, t) => sum + t.usageCount, 0)
    };
  }
}

module.exports = { PromptManager };
