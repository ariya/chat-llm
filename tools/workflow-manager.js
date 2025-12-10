/**
 * Workflow Manager - Advanced workflow orchestration and automation
 * Handles complex multi-step workflows with branching logic and error handling
 * 
 * @module WorkflowManager
 * @author yonikashi432
 * @version 2.0.0
 */

class WorkflowManager {
  /**
   * Initialize the Workflow Manager
   */
  constructor() {
    this.workflows = new Map();
    this.executions = new Map();
    this.executionId = 0;
    this.hooks = new Map();
    this.registerDefaultWorkflows();
  }

  /**
   * Register default workflows for common scenarios
   */
  registerDefaultWorkflows() {
    // Research and Report Workflow
    this.registerWorkflow('research-report', {
      name: 'Research & Report',
      description: 'Gather research, analyze data, and generate comprehensive report',
      steps: [
        {
          id: 'gather',
          agent: 'researcher',
          task: 'Gather information on the topic',
          timeout: 30000,
          retryCount: 2
        },
        {
          id: 'analyze',
          agent: 'analyst',
          task: 'Analyze gathered information',
          dependsOn: ['gather'],
          timeout: 25000
        },
        {
          id: 'report',
          agent: 'writer',
          task: 'Write comprehensive report',
          dependsOn: ['analyze'],
          timeout: 30000
        }
      ],
      errorHandler: 'fallback',
      timeout: 90000
    });

    // Code Development Workflow
    this.registerWorkflow('code-development', {
      name: 'Code Development',
      description: 'Design, implement, test, and document code',
      steps: [
        {
          id: 'design',
          agent: 'coder',
          task: 'Design solution architecture',
          timeout: 20000
        },
        {
          id: 'implement',
          agent: 'coder',
          task: 'Implement the solution',
          dependsOn: ['design'],
          timeout: 30000,
          retryCount: 2
        },
        {
          id: 'test',
          agent: 'solver',
          task: 'Test and validate the implementation',
          dependsOn: ['implement'],
          timeout: 20000
        },
        {
          id: 'document',
          agent: 'writer',
          task: 'Document the code and decisions',
          dependsOn: ['test'],
          timeout: 15000
        }
      ],
      errorHandler: 'retry',
      timeout: 120000
    });

    // Customer Support Escalation Workflow
    this.registerWorkflow('support-escalation', {
      name: 'Support Escalation',
      description: 'Handle customer issues with escalation path',
      steps: [
        {
          id: 'initial-response',
          agent: 'support',
          task: 'Provide initial support response',
          timeout: 15000
        },
        {
          id: 'investigate',
          agent: 'analyst',
          task: 'Investigate issue deeper',
          dependsOn: ['initial-response'],
          timeout: 25000,
          condition: 'issue_severity === "high"'
        },
        {
          id: 'solution',
          agent: 'solver',
          task: 'Develop solution',
          dependsOn: ['investigate'],
          timeout: 30000
        }
      ],
      errorHandler: 'escalate',
      timeout: 75000
    });
  }

  /**
   * Register a custom workflow
   * @param {string} id - Unique workflow identifier
   * @param {Object} config - Workflow configuration
   * @returns {void}
   */
  registerWorkflow(id, config) {
    this.workflows.set(id, {
      id,
      ...config,
      createdAt: new Date(),
      executionCount: 0,
      averageExecutionTime: 0
    });
  }

  /**
   * Execute a workflow
   * @param {string} workflowId - Workflow identifier
   * @param {Object} context - Execution context and inputs
   * @returns {Promise<Object>} Execution result
   */
  async executeWorkflow(workflowId, context = {}) {
    if (!this.workflows.has(workflowId)) {
      throw new Error(`Workflow '${workflowId}' not found`);
    }

    const workflow = this.workflows.get(workflowId);
    const executionId = ++this.executionId;
    const execution = {
      id: executionId,
      workflowId,
      status: 'running',
      startTime: Date.now(),
      steps: new Map(),
      context,
      results: {},
      errors: []
    };

    this.executions.set(executionId, execution);

    try {
      // Trigger workflow start hook
      await this.triggerHook('workflow:start', { workflowId, executionId });

      // Execute steps with dependency resolution
      for (const step of workflow.steps) {
        await this.executeStep(execution, workflow, step);
      }

      execution.status = 'completed';
      execution.endTime = Date.now();

      // Trigger workflow complete hook
      await this.triggerHook('workflow:complete', { executionId, duration: execution.endTime - execution.startTime });

      return execution;
    } catch (error) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.endTime = Date.now();

      // Trigger error hook
      await this.triggerHook('workflow:error', { executionId, error: error.message });

      throw error;
    }
  }

  /**
   * Execute a single step in the workflow
   * @private
   */
  async executeStep(execution, workflow, step) {
    // Check dependencies
    if (step.dependsOn) {
      for (const depId of step.dependsOn) {
        const depStep = execution.steps.get(depId);
        if (!depStep || depStep.status !== 'completed') {
          throw new Error(`Dependency '${depId}' not completed for step '${step.id}'`);
        }
      }
    }

    // Check condition
    if (step.condition) {
      if (!this.evaluateCondition(step.condition, execution.context)) {
        execution.steps.set(step.id, { ...step, status: 'skipped' });
        return;
      }
    }

    const stepExecution = {
      id: step.id,
      status: 'running',
      startTime: Date.now(),
      agent: step.agent,
      task: step.task
    };

    try {
      // Trigger step start hook
      await this.triggerHook('step:start', { stepId: step.id });

      // Simulate step execution (in real implementation, this calls agent)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));

      stepExecution.status = 'completed';
      stepExecution.endTime = Date.now();
      stepExecution.duration = stepExecution.endTime - stepExecution.startTime;
      stepExecution.result = `Completed by ${step.agent}: ${step.task}`;

      execution.results[step.id] = stepExecution.result;
      execution.steps.set(step.id, stepExecution);

      // Trigger step complete hook
      await this.triggerHook('step:complete', { stepId: step.id, duration: stepExecution.duration });
    } catch (error) {
      stepExecution.status = 'failed';
      stepExecution.error = error.message;

      // Handle retries
      if (step.retryCount && step.retryCount > 0) {
        step.retryCount--;
        await this.executeStep(execution, workflow, step);
      } else {
        // Handle workflow error
        switch (workflow.errorHandler) {
          case 'fallback':
            execution.results[step.id] = 'Fallback result';
            stepExecution.status = 'fallback';
            break;
          case 'escalate':
            throw new Error(`Step '${step.id}' escalation required`);
          default:
            throw error;
        }
      }

      execution.steps.set(step.id, stepExecution);
    }
  }

  /**
   * Evaluate a condition string
   * @private
   */
  evaluateCondition(condition, context) {
    try {
      // Simple condition evaluation - in production, use safer evaluation
      const conditionFn = new Function('context', `return ${condition}`);
      return conditionFn(context);
    } catch {
      return true; // Default to true if condition evaluation fails
    }
  }

  /**
   * Register a workflow hook
   * @param {string} event - Hook event name
   * @param {Function} callback - Hook callback function
   */
  registerHook(event, callback) {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }
    this.hooks.get(event).push(callback);
  }

  /**
   * Trigger a workflow hook
   * @private
   */
  async triggerHook(event, data) {
    if (!this.hooks.has(event)) return;
    for (const callback of this.hooks.get(event)) {
      try {
        await callback(data);
      } catch (error) {
        console.error(`Hook error for '${event}':`, error.message);
      }
    }
  }

  /**
   * Get workflow statistics
   * @param {string} workflowId - Workflow identifier
   * @returns {Object} Workflow statistics
   */
  getWorkflowStats(workflowId) {
    if (!this.workflows.has(workflowId)) {
      throw new Error(`Workflow '${workflowId}' not found`);
    }

    const workflow = this.workflows.get(workflowId);
    const executions = Array.from(this.executions.values())
      .filter(e => e.workflowId === workflowId);

    const completedExecutions = executions.filter(e => e.status === 'completed');
    const failedExecutions = executions.filter(e => e.status === 'failed');

    const executionTimes = completedExecutions.map(e => e.endTime - e.startTime);
    const averageTime = executionTimes.length > 0
      ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
      : 0;

    return {
      workflowId,
      name: workflow.name,
      totalExecutions: executions.length,
      completedExecutions: completedExecutions.length,
      failedExecutions: failedExecutions.length,
      successRate: executions.length > 0 ? (completedExecutions.length / executions.length) * 100 : 0,
      averageExecutionTime: averageTime,
      lastExecution: executions[executions.length - 1]?.endTime || null
    };
  }

  /**
   * List all workflows
   * @returns {Array<Object>} List of workflows
   */
  listWorkflows() {
    return Array.from(this.workflows.values()).map(w => ({
      id: w.id,
      name: w.name,
      description: w.description,
      stepCount: w.steps.length,
      createdAt: w.createdAt
    }));
  }

  /**
   * Get execution history
   * @param {string} workflowId - Optional workflow filter
   * @param {number} limit - Maximum results
   * @returns {Array<Object>} Execution history
   */
  getExecutionHistory(workflowId = null, limit = 10) {
    let executions = Array.from(this.executions.values());
    if (workflowId) {
      executions = executions.filter(e => e.workflowId === workflowId);
    }
    return executions.slice(-limit).reverse();
  }

  /**
   * Cancel a running workflow
   * @param {number} executionId - Execution identifier
   * @returns {void}
   */
  cancelExecution(executionId) {
    if (!this.executions.has(executionId)) {
      throw new Error(`Execution '${executionId}' not found`);
    }
    const execution = this.executions.get(executionId);
    if (execution.status === 'running') {
      execution.status = 'cancelled';
      execution.endTime = Date.now();
    }
  }
}

module.exports = { WorkflowManager };
