/**
 * Task Manager - Comprehensive task and workflow management
 * Enables batch processing, task queuing, scheduling, and execution
 * 
 * @module TaskManager
 * @author yonikashi432
 * @version 2.0.0
 */

class TaskManager {
  /**
   * Initialize the Task Manager
   */
  constructor() {
    this.tasks = new Map();
    this.workflows = new Map();
    this.executionQueue = [];
    this.completedTasks = [];
    this.maxQueueSize = 1000;
    this.taskIdCounter = 0;
  }

  /**
   * Create a new task
   * @param {Object} taskConfig - Task configuration
   * @param {string} taskConfig.name - Task name
   * @param {string} taskConfig.type - Task type (prompt|code|analysis|custom)
   * @param {Object} taskConfig.input - Task input/parameters
   * @param {Object} taskConfig.metadata - Task metadata
   * @param {string} taskConfig.priority - Priority level (low|normal|high)
   * @returns {Object} Created task
   */
  createTask(taskConfig) {
    const taskId = `task-${++this.taskIdCounter}`;
    
    const task = {
      id: taskId,
      name: taskConfig.name,
      type: taskConfig.type || 'custom',
      input: taskConfig.input || {},
      metadata: {
        ...taskConfig.metadata,
        createdAt: new Date(),
        priority: taskConfig.priority || 'normal',
        status: 'pending',
        attempts: 0,
        maxRetries: 3
      },
      results: null,
      error: null,
      startedAt: null,
      completedAt: null
    };

    this.tasks.set(taskId, task);
    return task;
  }

  /**
   * Queue a task for execution
   * @param {string} taskId - Task ID
   * @returns {boolean} Success
   */
  queueTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    if (this.executionQueue.length >= this.maxQueueSize) {
      return false;
    }

    task.metadata.status = 'queued';
    this.executionQueue.push(taskId);
    return true;
  }

  /**
   * Get next task from queue
   * @returns {Object|null} Next task or null
   */
  getNextTask() {
    if (this.executionQueue.length === 0) {
      return null;
    }

    // Sort by priority: high > normal > low
    const priorityMap = { high: 3, normal: 2, low: 1 };
    
    let nextIndex = 0;
    let maxPriority = 0;

    for (let i = 0; i < this.executionQueue.length; i++) {
      const taskId = this.executionQueue[i];
      const task = this.tasks.get(taskId);
      const priority = priorityMap[task.metadata.priority] || 2;

      if (priority > maxPriority) {
        maxPriority = priority;
        nextIndex = i;
      }
    }

    const taskId = this.executionQueue[nextIndex];
    const task = this.tasks.get(taskId);
    task.metadata.status = 'running';
    task.startedAt = new Date();
    
    return task;
  }

  /**
   * Mark task as completed
   * @param {string} taskId - Task ID
   * @param {*} results - Task results
   * @returns {boolean} Success
   */
  completeTask(taskId, results) {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    task.results = results;
    task.metadata.status = 'completed';
    task.completedAt = new Date();
    
    this.executionQueue = this.executionQueue.filter(id => id !== taskId);
    this.completedTasks.push(taskId);

    return true;
  }

  /**
   * Mark task as failed
   * @param {string} taskId - Task ID
   * @param {Error} error - Error object
   * @returns {boolean} Success
   */
  failTask(taskId, error) {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    task.error = error.message;
    task.metadata.attempts += 1;

    if (task.metadata.attempts >= task.metadata.maxRetries) {
      task.metadata.status = 'failed';
      this.executionQueue = this.executionQueue.filter(id => id !== taskId);
      this.completedTasks.push(taskId);
    } else {
      task.metadata.status = 'pending';
      // Re-queue for retry
      this.executionQueue.push(taskId);
    }

    return true;
  }

  /**
   * Create a workflow from multiple tasks
   * @param {Object} workflowConfig - Workflow configuration
   * @returns {Object} Created workflow
   */
  createWorkflow(workflowConfig) {
    const workflowId = `workflow-${Date.now()}`;
    
    const workflow = {
      id: workflowId,
      name: workflowConfig.name,
      description: workflowConfig.description || '',
      steps: workflowConfig.steps || [],
      metadata: {
        createdAt: new Date(),
        status: 'created',
        parallelExecution: workflowConfig.parallel || false,
        currentStep: 0
      },
      results: []
    };

    this.workflows.set(workflowId, workflow);
    return workflow;
  }

  /**
   * Execute a workflow
   * @param {string} workflowId - Workflow ID
   * @returns {string|null} Workflow ID if started, null if not found
   */
  executeWorkflow(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return null;
    }

    workflow.metadata.status = 'running';
    workflow.metadata.startedAt = new Date();

    // Queue all tasks based on execution mode
    if (workflow.metadata.parallelExecution) {
      workflow.steps.forEach(step => this.queueTask(step.taskId));
    } else {
      if (workflow.steps.length > 0) {
        this.queueTask(workflow.steps[0].taskId);
      }
    }

    return workflowId;
  }

  /**
   * Process next workflow step
   * @param {string} workflowId - Workflow ID
   * @returns {boolean} Success
   */
  processNextWorkflowStep(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return false;
    }

    workflow.metadata.currentStep += 1;

    if (workflow.metadata.currentStep >= workflow.steps.length) {
      workflow.metadata.status = 'completed';
      workflow.metadata.completedAt = new Date();
      return true;
    }

    if (!workflow.metadata.parallelExecution) {
      const nextStep = workflow.steps[workflow.metadata.currentStep];
      this.queueTask(nextStep.taskId);
    }

    return true;
  }

  /**
   * Get task status
   * @param {string} taskId - Task ID
   * @returns {Object|null} Task status or null
   */
  getTaskStatus(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      return null;
    }

    return {
      id: task.id,
      name: task.name,
      status: task.metadata.status,
      progress: task.metadata.status === 'running' ? '...' : '100%',
      startedAt: task.startedAt,
      completedAt: task.completedAt,
      error: task.error
    };
  }

  /**
   * Get workflow status
   * @param {string} workflowId - Workflow ID
   * @returns {Object|null} Workflow status or null
   */
  getWorkflowStatus(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return null;
    }

    return {
      id: workflow.id,
      name: workflow.name,
      status: workflow.metadata.status,
      currentStep: workflow.metadata.currentStep,
      totalSteps: workflow.steps.length,
      progress: `${workflow.metadata.currentStep}/${workflow.steps.length}`
    };
  }

  /**
   * Batch create tasks
   * @param {Array<Object>} taskConfigs - Array of task configurations
   * @returns {Array<Object>} Created tasks
   */
  batchCreateTasks(taskConfigs) {
    return taskConfigs.map(config => this.createTask(config));
  }

  /**
   * Batch queue tasks
   * @param {Array<string>} taskIds - Task IDs to queue
   * @returns {number} Number of successfully queued tasks
   */
  batchQueueTasks(taskIds) {
    return taskIds.reduce((count, taskId) => {
      return this.queueTask(taskId) ? count + 1 : count;
    }, 0);
  }

  /**
   * Get queue statistics
   * @returns {Object} Queue statistics
   */
  getQueueStats() {
    const pendingCount = Array.from(this.tasks.values())
      .filter(t => t.metadata.status === 'pending').length;
    const runningCount = Array.from(this.tasks.values())
      .filter(t => t.metadata.status === 'running').length;

    return {
      totalTasks: this.tasks.size,
      queuedCount: this.executionQueue.length,
      pendingCount,
      runningCount,
      completedCount: this.completedTasks.length,
      workflows: this.workflows.size
    };
  }

  /**
   * Get task by ID
   * @param {string} taskId - Task ID
   * @returns {Object|null} Task or null
   */
  getTask(taskId) {
    return this.tasks.get(taskId) || null;
  }

  /**
   * List all tasks
   * @param {string} status - Optional status filter
   * @returns {Array<Object>} Tasks
   */
  listTasks(status = null) {
    let tasks = Array.from(this.tasks.values());
    if (status) {
      tasks = tasks.filter(t => t.metadata.status === status);
    }
    return tasks;
  }

  /**
   * Cancel a task
   * @param {string} taskId - Task ID
   * @returns {boolean} Success
   */
  cancelTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    task.metadata.status = 'cancelled';
    this.executionQueue = this.executionQueue.filter(id => id !== taskId);
    this.completedTasks.push(taskId);
    return true;
  }

  /**
   * Clear completed tasks
   * @returns {void}
   */
  clearCompleted() {
    this.completedTasks.forEach(taskId => {
      this.tasks.delete(taskId);
    });
    this.completedTasks = [];
  }

  /**
   * Export task results
   * @param {string} taskId - Task ID
   * @returns {Object|null} Task results or null
   */
  exportResults(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      return null;
    }

    return {
      taskId: task.id,
      name: task.name,
      type: task.type,
      status: task.metadata.status,
      results: task.results,
      error: task.error,
      duration: task.completedAt && task.startedAt 
        ? task.completedAt.getTime() - task.startedAt.getTime()
        : null
    };
  }
}

module.exports = { TaskManager };
