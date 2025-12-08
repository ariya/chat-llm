#!/usr/bin/env node

/**
 * Example: Basic Chat with LLM
 * 
 * This example demonstrates basic usage of Chat LLM for simple queries.
 * No API configuration required if using demo mode.
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function basicChatExample() {
  console.log('=== Basic Chat Example ===\n');

  // Example 1: Simple question via pipe
  console.log('1. Simple question via pipe:');
  try {
    const { stdout } = await execPromise('echo "What is the capital of France?" | ./chat-llm.js');
    console.log('Response:', stdout.trim());
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Example 2: Using demo mode
  console.log('2. Using demo mode (no API key required):');
  try {
    const { stdout } = await execPromise('echo "What is the weather like?" | LLM_DEMO_MODE=1 ./chat-llm.js');
    console.log('Response:', stdout.trim());
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Example 3: Translation query
  console.log('3. Translation query:');
  try {
    const { stdout } = await execPromise('echo "Translate \'hello\' to Spanish" | ./chat-llm.js');
    console.log('Response:', stdout.trim());
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run if executed directly
if (require.main === module) {
  basicChatExample().catch(console.error);
}

module.exports = { basicChatExample };
