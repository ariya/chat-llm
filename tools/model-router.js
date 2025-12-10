/**
 * Model Router - Intelligent model selection, cost optimization, and fallback chains
 * Routes requests to the most appropriate model based on query complexity and cost
 */

class ModelRouter {
    constructor(models = {}) {
        this.models = {
            'fast': { cost: 0.5, latency: 0.5, quality: 0.6, capabilities: ['text'] },
            'balanced': { cost: 1.0, latency: 1.0, quality: 0.8, capabilities: ['text', 'reasoning'] },
            'powerful': { cost: 2.0, latency: 1.5, quality: 0.95, capabilities: ['text', 'reasoning', 'vision'] },
            ...models
        };

        this.queryClassifier = new QueryClassifier();
        this.costOptimizer = new CostOptimizer();
        this.fallbackChain = [];
        this.routingHistory = [];
    }

    /**
     * Route query to optimal model
     * @param {string} query - User query
     * @param {Object} constraints - Routing constraints (maxLatency, maxCost, requiredCapabilities)
     * @returns {Object} Routing decision with model selection and fallback chain
     */
    route(query, constraints = {}) {
        const complexity = this.queryClassifier.classify(query);
        const candidates = this.selectCandidates(complexity, constraints);
        
        if (candidates.length === 0) {
            throw new Error('No suitable model found for query');
        }

        const selectedModel = this.selectBestModel(candidates, constraints);
        const fallbacks = this.buildFallbackChain(candidates, selectedModel);

        const decision = {
            selectedModel,
            fallbacks,
            complexity,
            reasoning: this.generateReasoning(complexity, selectedModel, constraints),
            estimatedCost: this.models[selectedModel].cost,
            timestamp: new Date().toISOString()
        };

        this.routingHistory.push(decision);
        return decision;
    }

    /**
     * Classify query complexity
     */
    selectCandidates(complexity, constraints) {
        return Object.entries(this.models)
            .filter(([name, model]) => {
                // Check capability requirements
                if (constraints.requiredCapabilities) {
                    const hasRequired = constraints.requiredCapabilities.every(cap => 
                        model.capabilities.includes(cap)
                    );
                    if (!hasRequired) return false;
                }

                // Check latency constraint
                if (constraints.maxLatency) {
                    if (model.latency > constraints.maxLatency) return false;
                }

                // Check cost constraint
                if (constraints.maxCost) {
                    if (model.cost > constraints.maxCost) return false;
                }

                // Match complexity to model quality
                if (complexity === 'simple' && model.quality > 0.7) return false; // Overkill
                if (complexity === 'complex' && model.quality < 0.8) return false; // Underkill

                return true;
            })
            .map(([name]) => name);
    }

    /**
     * Select the best model from candidates
     */
    selectBestModel(candidates, constraints) {
        if (constraints.priority === 'cost') {
            return candidates.reduce((best, current) => 
                this.models[current].cost < this.models[best].cost ? current : best
            );
        }

        if (constraints.priority === 'speed') {
            return candidates.reduce((best, current) => 
                this.models[current].latency < this.models[best].latency ? current : best
            );
        }

        // Default: quality priority
        return candidates.reduce((best, current) => 
            this.models[current].quality > this.models[best].quality ? current : best
        );
    }

    /**
     * Build fallback chain
     */
    buildFallbackChain(candidates, primary) {
        return candidates
            .filter(c => c !== primary)
            .sort((a, b) => this.models[b].quality - this.models[a].quality);
    }

    /**
     * Generate reasoning for routing decision
     */
    generateReasoning(complexity, model, constraints) {
        const modelInfo = this.models[model];
        return {
            queryComplexity: complexity,
            selectedBecause: [
                modelInfo.quality > 0.8 ? 'High quality' : 'Adequate quality',
                modelInfo.cost < 1.5 ? 'Cost-effective' : 'Premium model',
                modelInfo.latency < 1.0 ? 'Fast' : 'Reasonable latency'
            ],
            metrics: {
                quality: modelInfo.quality,
                cost: modelInfo.cost,
                latency: modelInfo.latency
            }
        };
    }

    /**
     * Record routing result for optimization
     */
    recordResult(decision, result) {
        decision.result = {
            success: result.success,
            actualLatency: result.latency,
            actualCost: result.cost,
            quality: result.quality || 0.8,
            timestamp: new Date().toISOString()
        };

        this.costOptimizer.learn(decision);
    }

    /**
     * Get routing statistics
     */
    getStatistics() {
        const stats = {};

        this.routingHistory.forEach(decision => {
            if (!stats[decision.selectedModel]) {
                stats[decision.selectedModel] = {
                    selected: 0,
                    fallbackUsed: 0,
                    avgQuality: 0,
                    totalCost: 0
                };
            }

            stats[decision.selectedModel].selected++;
            if (decision.result) {
                stats[decision.selectedModel].avgQuality += decision.result.quality;
                stats[decision.selectedModel].totalCost += decision.result.actualCost;
            }
        });

        Object.keys(stats).forEach(model => {
            const s = stats[model];
            s.avgQuality = (s.avgQuality / s.selected).toFixed(2);
            s.costPerQuery = (s.totalCost / s.selected).toFixed(2);
        });

        return stats;
    }

    /**
     * Add custom model
     */
    addModel(name, config) {
        this.models[name] = {
            cost: config.cost || 1.0,
            latency: config.latency || 1.0,
            quality: config.quality || 0.8,
            capabilities: config.capabilities || ['text']
        };
    }
}

/**
 * Query Classifier - Classify query complexity
 */
class QueryClassifier {
    classify(query) {
        const complexity = {
            wordCount: query.split(/\s+/).length,
            hasSpecialChars: /[^a-zA-Z0-9\s]/.test(query),
            hasNumbers: /\d/.test(query),
            questionMarks: (query.match(/\?/g) || []).length,
            codeBlocks: (query.match(/```/g) || []).length / 2
        };

        let score = 1;
        if (complexity.wordCount > 50) score += 2;
        if (complexity.hasSpecialChars) score += 1;
        if (complexity.codeBlocks > 0) score += 3;
        if (complexity.questionMarks > 2) score += 2;

        if (score > 6) return 'complex';
        if (score > 3) return 'moderate';
        return 'simple';
    }
}

/**
 * Cost Optimizer - Learn from routing decisions to optimize cost
 */
class CostOptimizer {
    constructor() {
        this.history = [];
        this.patterns = {};
    }

    learn(decision) {
        this.history.push(decision);

        if (decision.result) {
            const key = `${decision.complexity}-${decision.selectedModel}`;
            if (!this.patterns[key]) {
                this.patterns[key] = { count: 0, successRate: 0, totalCost: 0 };
            }

            const pattern = this.patterns[key];
            pattern.count++;
            pattern.successRate = (pattern.successRate * (pattern.count - 1) + 
                (decision.result.success ? 1 : 0)) / pattern.count;
            pattern.totalCost += decision.result.actualCost;
        }
    }

    getCostSavings() {
        let totalSavings = 0;
        let optimizedCount = 0;

        this.history.forEach(decision => {
            if (decision.result && decision.result.quality > 0.7) {
                const potentialCost = Math.max(...decision.fallbacks.map(f => 
                    this.getModelCost(f)
                ));
                totalSavings += potentialCost - decision.result.actualCost;
                optimizedCount++;
            }
        });

        return {
            totalSavings: totalSavings.toFixed(2),
            optimizedQueries: optimizedCount,
            averageSavingsPerQuery: (totalSavings / optimizedCount).toFixed(2)
        };
    }

    getModelCost(model) {
        // This would be overridden with actual model costs
        return parseFloat(model.match(/\d+/)?.[0] || 1);
    }
}

module.exports = { ModelRouter, QueryClassifier, CostOptimizer };
