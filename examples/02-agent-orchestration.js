#!/usr/bin/env node

/**
 * Example: Agent Orchestration
 * 
 * This example demonstrates how to use the agent system to delegate
 * tasks to specialized agents.
 */

const { AgentManager } = require('../tools/agent-manager');

async function agentExample() {
  console.log('=== Agent Orchestration Example ===\n');

  const agents = new AgentManager();

  // List all available agents
  console.log('1. Available agents:');
  const allAgents = agents.listAgents();
  allAgents.forEach(agent => {
    console.log(`  - ${agent.id}: ${agent.name}`);
    console.log(`    ${agent.description}`);
    console.log(`    Capabilities: ${agent.capabilities.join(', ')}`);
    console.log();
  });

  console.log('='.repeat(50) + '\n');

  // Activate a specific agent
  console.log('2. Activating Code Agent:');
  const coder = agents.activateAgent('coder');
  console.log('Activated:', coder.name);
  console.log('Active agent ID:', agents.activeAgent);
  console.log('\nSystem prompt preview:');
  console.log(agents.getSystemPrompt('coder').substring(0, 200) + '...\n');

  console.log('='.repeat(50) + '\n');

  // Register a custom agent
  console.log('3. Registering custom agent:');
  agents.registerAgent('translator', {
    name: 'Translation Agent',
    description: 'Specialized in language translation and localization',
    systemPrompt: `You are a professional translator with expertise in multiple languages.
Your role is to:
- Provide accurate translations
- Maintain tone and context
- Explain cultural nuances
- Support idiomatic expressions`,
    capabilities: ['translation', 'localization', 'cultural-context']
  });
  console.log('Custom agent registered successfully!');
  
  const translator = agents.getAgent('translator');
  console.log('Agent name:', translator.name);
  console.log('Capabilities:', translator.capabilities.join(', '));

  console.log('\n' + '='.repeat(50) + '\n');

  // Update agent statistics (simulated usage)
  console.log('4. Agent usage tracking:');
  agents.updateAgentStats('coder', 1500);
  agents.updateAgentStats('coder', 2000);
  agents.updateAgentStats('researcher', 3000);

  const stats = agents.getStats();
  stats.forEach(stat => {
    console.log(`\n${stat.name} (${stat.id})`);
    console.log(`  Usage count: ${stat.usageCount}`);
    console.log(`  Total tokens: ${stat.totalTokens}`);
  });

  console.log('\n' + '='.repeat(50) + '\n');

  // Get agent by capability
  console.log('5. Finding agents by capability:');
  const researchCapable = allAgents.filter(a => a.capabilities.includes('research'));
  console.log('Agents with research capability:');
  researchCapable.forEach(agent => {
    console.log(`  - ${agent.name}`);
  });
}

// Run if executed directly
if (require.main === module) {
  agentExample().catch(console.error);
}

module.exports = { agentExample };
