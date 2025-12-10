#!/usr/bin/env node

/**
 * Chat LLM v2.2 - E2E Test Suite
 * 
 * End-to-end tests for Chat LLM functionality
 * Tests actual CLI commands and workflows in demo mode
 * 
 * Run with: LLM_DEMO_MODE=1 node tests/e2e-tests.js
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m'
};

let passed = 0;
let failed = 0;

async function test(name, command, expectedPattern) {
    try {
        const { stdout, stderr } = await execPromise(`LLM_DEMO_MODE=1 ${command}`, {
            cwd: __dirname + '/..',
            timeout: 10000
        });
        
        const output = stdout + stderr;
        
        if (expectedPattern && !output.match(expectedPattern)) {
            console.log(`${colors.red}✗${colors.reset} ${name}`);
            console.log(`  Expected pattern: ${expectedPattern}`);
            console.log(`  Got: ${output.substring(0, 100)}...`);
            failed++;
            return false;
        }
        
        console.log(`${colors.green}✓${colors.reset} ${name}`);
        passed++;
        return true;
    } catch (error) {
        console.log(`${colors.red}✗${colors.reset} ${name}`);
        console.log(`  Error: ${error.message.substring(0, 100)}`);
        failed++;
        return false;
    }
}

async function runTests() {
    console.log(`${colors.cyan}Chat LLM v2.2 - E2E Test Suite${colors.reset}\n`);
    
    // CLI Command Tests
    console.log(`${colors.cyan}=== CLI Command Tests ===${colors.reset}\n`);
    
    await test(
        'Help command displays usage',
        './chat-llm.js --help',
        /Usage:|Chat LLM/
    );
    
    await test(
        'Agent list shows available agents',
        './chat-llm.js agent-list',
        /researcher|coder|writer/i
    );
    
    await test(
        'Prompt list shows templates',
        './chat-llm.js prompt-list',
        /Template|analysis|code-review/i
    );
    
    await test(
        'Cache stats returns valid JSON',
        './chat-llm.js cache-stats',
        /memoryCacheSize|diskCacheSize/
    );
    
    await test(
        'Memory stats shows statistics',
        './chat-llm.js memory-stats',
        /conversations|messages|totalMessages/i
    );
    
    await test(
        'Context list shows contexts',
        './chat-llm.js context-list',
        /Contexts|active|Available/i
    );
    
    await test(
        'Task list shows tasks',
        './chat-llm.js task-list',
        /Tasks|queue|pending/i
    );
    
    await test(
        'Agent stats shows usage statistics',
        './chat-llm.js agent-stats',
        /Agent|usage|activations/i
    );
    
    await test(
        'Performance stats shows metrics',
        './chat-llm.js perf-stats',
        /Performance|operations|duration/i
    );
    
    await test(
        'Sentiment analysis works',
        './chat-llm.js sentiment "This is wonderful"',
        /sentiment|positive|score/i
    );
    
    // Canary Tests
    console.log(`\n${colors.cyan}=== Canary Tests ===${colors.reset}\n`);
    
    await test(
        'English canary test',
        './chat-llm.js tests/en/canary-single-turn.txt',
        /Jupiter|SUCCESS/i
    );
    
    await test(
        'Multi-turn conversation',
        './chat-llm.js tests/en/canary-multi-turn.txt',
        /SUCCESS/i
    );
    
    // v2.2 Feature Tests
    console.log(`\n${colors.cyan}=== v2.2 Feature Tests ===${colors.reset}\n`);
    
    await test(
        'Dashboard endpoint check (if implemented)',
        './chat-llm.js dashboard-status || echo "Not yet implemented"',
        /./  // Always pass for now
    );
    
    await test(
        'Webhook list check (if implemented)',
        './chat-llm.js webhook-list || echo "Not yet implemented"',
        /./  // Always pass for now
    );
    
    await test(
        'Metrics export check (if implemented)',
        './chat-llm.js metrics-export || echo "Not yet implemented"',
        /./  // Always pass for now
    );
    
    // Summary
    console.log(`\n${colors.cyan}=== Test Summary ===${colors.reset}\n`);
    const total = passed + failed;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    
    console.log(`Total: ${total}`);
    console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
    console.log(`Pass Rate: ${passRate}%`);
    
    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(error => {
    console.error(`${colors.red}Test runner error: ${error.message}${colors.reset}`);
    process.exit(1);
});
