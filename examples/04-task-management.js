#!/usr/bin/env node

/**
 * Example: Task and Workflow Management
 * 
 * This example demonstrates how to use the task manager for queuing,
 * batch processing, and workflow orchestration.
 */

const { TaskManager } = require('../tools/task-manager');

async function taskExample() {
  console.log('=== Task & Workflow Management Example ===\n');

  const tasks = new TaskManager();

  // Create individual tasks
  console.log('1. Creating tasks:');
  
  const task1 = tasks.createTask({
    name: 'Process Customer Data',
    type: 'processing',
    input: { file: 'customers.json', operation: 'clean' },
    priority: 'high'
  });
  console.log('Created task:', task1.name, '(ID:', task1.id + ')');

  const task2 = tasks.createTask({
    name: 'Generate Report',
    type: 'report',
    input: { template: 'monthly', format: 'pdf' },
    priority: 'normal'
  });
  console.log('Created task:', task2.name, '(ID:', task2.id + ')');

  const task3 = tasks.createTask({
    name: 'Send Notifications',
    type: 'notification',
    input: { recipients: ['user1', 'user2'], template: 'summary' },
    priority: 'low'
  });
  console.log('Created task:', task3.name, '(ID:', task3.id + ')');

  console.log('\n' + '='.repeat(50) + '\n');

  // Queue tasks
  console.log('2. Queuing tasks:');
  tasks.queueTask(task1.id);
  tasks.queueTask(task2.id);
  tasks.queueTask(task3.id);
  console.log('All tasks queued');

  console.log('\n' + '='.repeat(50) + '\n');

  // Get next task (priority-based)
  console.log('3. Processing tasks by priority:');
  const nextTask = tasks.getNextTask();
  console.log('Next task to process:', nextTask.name);
  console.log('Priority:', nextTask.metadata.priority);
  console.log('Status:', nextTask.metadata.status);

  console.log('\n' + '='.repeat(50) + '\n');

  // Simulate task completion
  console.log('4. Completing task:');
  tasks.completeTask(nextTask.id, {
    recordsProcessed: 1500,
    duration: '2.5s',
    status: 'success'
  });
  console.log('Task completed with result');

  console.log('\n' + '='.repeat(50) + '\n');

  // Create a workflow
  console.log('5. Creating a workflow:');
  const workflow = tasks.createWorkflow({
    name: 'Data Processing Pipeline',
    parallel: false,
    steps: [
      { taskId: task1.id },
      { taskId: task2.id },
      { taskId: task3.id }
    ]
  });
  console.log('Workflow created:', workflow.name);
  console.log('Steps:', workflow.steps.length);
  console.log('Execution mode:', workflow.parallel ? 'Parallel' : 'Sequential');

  console.log('\n' + '='.repeat(50) + '\n');

  // Batch create tasks
  console.log('6. Batch creating tasks:');
  const batchConfigs = [
    { name: 'Task A', type: 'batch', input: { data: 'A' } },
    { name: 'Task B', type: 'batch', input: { data: 'B' } },
    { name: 'Task C', type: 'batch', input: { data: 'C' } }
  ];
  
  const batchTasks = tasks.batchCreateTasks(batchConfigs);
  console.log(`Created ${batchTasks.length} tasks in batch`);
  batchTasks.forEach((task, i) => {
    console.log(`  ${i + 1}. ${task.name} (${task.id})`);
  });

  console.log('\n' + '='.repeat(50) + '\n');

  // Batch queue tasks
  console.log('7. Batch queuing tasks:');
  const taskIds = batchTasks.map(t => t.id);
  tasks.batchQueueTasks(taskIds);
  console.log(`Queued ${taskIds.length} tasks`);

  console.log('\n' + '='.repeat(50) + '\n');

  // List all tasks
  console.log('8. Listing all tasks:');
  const allTasks = tasks.listTasks();
  console.log(`Total tasks: ${allTasks.length}\n`);
  allTasks.slice(0, 5).forEach(task => {
    console.log(`${task.name}`);
    console.log(`  ID: ${task.id}`);
    console.log(`  Type: ${task.type}`);
    console.log(`  Status: ${task.metadata.status}`);
    console.log(`  Priority: ${task.metadata.priority}`);
    console.log();
  });

  console.log('='.repeat(50) + '\n');

  // Get queue statistics
  console.log('9. Queue statistics:');
  const stats = tasks.getQueueStats();
  console.log('Total tasks:', stats.totalTasks);
  console.log('Queued:', stats.queuedCount);
  console.log('Pending:', stats.pendingCount);
  console.log('Running:', stats.runningCount);
  console.log('Completed:', stats.completedCount);
  console.log('Workflows:', stats.workflows);

  console.log('\n' + '='.repeat(50) + '\n');

  // Demonstrate task failure
  console.log('10. Handling task failure:');
  const failTask = tasks.createTask({
    name: 'Failing Task',
    type: 'test',
    input: { test: true }
  });
  tasks.queueTask(failTask.id);
  const taskToFail = tasks.getNextTask();
  
  tasks.failTask(taskToFail.id, 'Simulated error: connection timeout');
  console.log('Task failed:', taskToFail.name);
  console.log('Error:', tasks.getTask(taskToFail.id).metadata.error);
}

// Run if executed directly
if (require.main === module) {
  taskExample().catch(console.error);
}

module.exports = { taskExample };
