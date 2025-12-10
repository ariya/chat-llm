#!/usr/bin/env node

/**
 * Example: Context Management
 * 
 * This example demonstrates how to use the context manager to organize
 * and work with custom data and knowledge bases.
 */

const { ContextManager } = require('../tools/context-manager');

async function contextExample() {
  console.log('=== Context Management Example ===\n');

  const context = new ContextManager('./examples/context-data');

  // Create a new context
  console.log('1. Creating a research context:');
  const researchCtx = context.createContext('ai-research', {}, {
    topic: 'Artificial Intelligence',
    started: new Date().toISOString()
  });
  console.log('Context created:', researchCtx.name);
  console.log('Metadata:', researchCtx.metadata);

  console.log('\n' + '='.repeat(50) + '\n');

  // Add documents to the context
  console.log('2. Adding documents:');
  
  const paper1 = `Neural networks are computing systems inspired by biological neural networks.
They consist of interconnected nodes (neurons) that process information using a connectionist approach.
Deep learning uses multiple layers of neural networks to progressively extract higher-level features.`;

  const paper2 = `Machine learning is a subset of artificial intelligence that enables systems to learn
and improve from experience without being explicitly programmed. It focuses on developing algorithms
that can access data and use it to learn for themselves.`;

  context.addDocument('ai-research', 'neural-networks.txt', paper1, {
    author: 'AI Researcher',
    year: 2024
  });
  
  context.addDocument('ai-research', 'machine-learning.txt', paper2, {
    author: 'ML Expert',
    year: 2024
  });

  console.log('Added 2 documents to context');

  console.log('\n' + '='.repeat(50) + '\n');

  // Add tags for organization
  console.log('3. Adding tags:');
  context.addTags('ai-research', ['ai', 'machine-learning', 'deep-learning']);
  console.log('Tags added: ai, machine-learning, deep-learning');

  console.log('\n' + '='.repeat(50) + '\n');

  // List all contexts
  console.log('4. Listing all contexts:');
  const allContexts = context.listContexts();
  allContexts.forEach(ctx => {
    console.log(`\n${ctx.name}`);
    console.log(`  Documents: ${ctx.documents}`);
    console.log(`  Tags: ${ctx.tags.join(', ')}`);
    console.log(`  Size: ${ctx.size} bytes`);
  });

  console.log('\n' + '='.repeat(50) + '\n');

  // Retrieve a specific document
  console.log('5. Retrieving a document:');
  const doc = context.getDocument('ai-research', 'neural-networks.txt');
  console.log('Document:', doc.id);
  console.log('Content preview:', doc.content.substring(0, 100) + '...');
  console.log('Metadata:', doc.metadata);

  console.log('\n' + '='.repeat(50) + '\n');

  // Search by tags
  console.log('6. Searching by tags:');
  const mlContexts = context.searchByTags(['machine-learning']);
  console.log(`Found ${mlContexts.length} context(s) with 'machine-learning' tag:`);
  mlContexts.forEach(ctx => {
    console.log(`  - ${ctx.name}`);
  });

  console.log('\n' + '='.repeat(50) + '\n');

  // Get context statistics
  console.log('7. Context statistics:');
  const stats = context.getStats();
  console.log('Total contexts:', stats.totalContexts);
  console.log('Total documents:', stats.totalDocuments);
  console.log('Total size:', stats.totalSize, 'bytes');
  console.log('Active context:', stats.activeContext || 'none');

  console.log('\n' + '='.repeat(50) + '\n');

  // Export context
  console.log('8. Exporting context:');
  const exportedJSON = context.exportContext('ai-research', 'json');
  console.log('Exported to JSON format');
  console.log('Preview:', exportedJSON.substring(0, 150) + '...');
}

// Run if executed directly
if (require.main === module) {
  contextExample().catch(console.error);
}

module.exports = { contextExample };
