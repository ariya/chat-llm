# Contributing to Chat LLM

Thank you for your interest in contributing to Chat LLM! This document provides guidelines and instructions for contributing to the project.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Documentation](#documentation)
- [Submitting Changes](#submitting-changes)
- [Feature Requests](#feature-requests)
- [Bug Reports](#bug-reports)

---

## Code of Conduct

### Our Standards
- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Accept criticism gracefully
- Prioritize the community's best interests

### Unacceptable Behavior
- Harassment or discriminatory language
- Trolling or inflammatory comments
- Personal attacks
- Publishing others' private information
- Other unprofessional conduct

---

## Getting Started

### Prerequisites
- Node.js v18 or higher (or Bun)
- Git
- Text editor (VS Code recommended)
- Basic understanding of JavaScript/Node.js

### Quick Setup
```bash
# Clone the repository
git clone https://github.com/yonikashi432/chat-llm.git
cd chat-llm

# No dependencies to install!

# Run the application
./chat-llm.js

# Or with Bun
bun chat-llm.js
```

---

## Development Setup

### Environment Configuration

Create a `.env` file (do NOT commit this):
```bash
LLM_API_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=your-api-key-here
LLM_CHAT_MODEL=gpt-5-nano
LLM_DEBUG=1
```

### Directory Structure
```
chat-llm/
├── chat-llm.js          # Main application
├── index.html           # Web interface
├── tools/               # Core modules
│   ├── agent-manager.js
│   ├── context-manager.js
│   ├── prompt-manager.js
│   ├── memory-manager.js
│   ├── task-manager.js
│   ├── sentiment_analyzer.js
│   ├── request-logger.js
│   ├── response-cache.js
│   ├── config-manager.js
│   └── performance-monitor.js
├── tests/               # Test files
├── config/              # Configuration files
├── cache/               # Response cache (auto-generated)
├── logs/                # Request logs (auto-generated)
├── memory/              # Conversation memory (auto-generated)
└── context-data/        # Context storage (auto-generated)
```

---

## Project Structure

### Architecture Overview

Chat LLM follows a modular architecture with clear separation of concerns:

1. **Core Layer** (`chat-llm.js`)
   - Main application logic
   - CLI command handling
   - HTTP server
   - Integration point

2. **Tool Layer** (`tools/`)
   - Independent, reusable modules
   - Each tool is self-contained
   - Exported as classes or functions

3. **Storage Layer**
   - File-based persistence
   - JSON for structured data
   - JSONL for logs
   - Disk cache for responses

### Module Dependencies

```
chat-llm.js
├── agent-manager
├── context-manager
├── prompt-manager
├── memory-manager
├── task-manager
├── sentiment_analyzer
├── request-logger
├── response-cache
├── config-manager
└── performance-monitor
```

All tools are independent with no inter-dependencies.

---

## Coding Standards

### JavaScript Style Guide

#### General Rules
- Use ES6+ features (const/let, arrow functions, async/await)
- No semicolons (consistent with existing code)
- 2-space indentation
- Single quotes for strings
- Meaningful variable names

#### Example
```javascript
const processTask = async (taskId) => {
  const task = tasks.getTask(taskId)
  if (!task) {
    throw new Error('Task not found')
  }
  
  const result = await executeTask(task)
  return result
}
```

### JSDoc Comments

All public functions and classes should have JSDoc comments:

```javascript
/**
 * Creates a new conversation in memory.
 * 
 * @param {string} id - Unique conversation identifier
 * @param {Object} metadata - Optional metadata for the conversation
 * @param {string} metadata.user - User identifier
 * @param {string} metadata.topic - Conversation topic
 * @returns {Object} Created conversation object
 * @throws {Error} If conversation ID already exists
 * 
 * @example
 * const conv = memory.createConversation('session-1', {
 *   user: 'alice',
 *   topic: 'Support'
 * });
 */
createConversation(id, metadata = {}) {
  // implementation
}
```

### File Organization

#### Module Structure
```javascript
// 1. Module header comment
/**
 * Module Name - Brief description
 * More detailed description
 * 
 * @module ModuleName
 * @author yourname
 * @version 2.0.0
 */

// 2. Requires (if any)
const fs = require('fs')
const path = require('path')

// 3. Class/Function definitions
class MyClass {
  // ...
}

// 4. Exports
module.exports = { MyClass }
```

### Naming Conventions

- **Classes**: PascalCase (`AgentManager`)
- **Functions**: camelCase (`createAgent`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Files**: kebab-case (`agent-manager.js`)
- **Private methods**: Prefix with underscore (`_validate`)

### Error Handling

Always provide meaningful error messages:

```javascript
// Good
if (!context.exists(name)) {
  throw new Error(`Context '${name}' not found. Use context-list to see available contexts.`)
}

// Bad
if (!context.exists(name)) {
  throw new Error('Not found')
}
```

---

## Making Changes

### Branching Strategy

- `main` - Production-ready code
- `v2` - Current development branch
- `feature/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `docs/update-name` - Documentation updates

### Workflow

1. **Create a branch**
```bash
git checkout -b feature/my-new-feature
```

2. **Make changes**
- Follow coding standards
- Add tests if applicable
- Update documentation

3. **Test your changes**
```bash
# Run the application
./chat-llm.js

# Test specific commands
./chat-llm.js agent-list
./chat-llm.js cache-stats

# Test evaluation
./chat-llm.js tests/english.txt
```

4. **Commit changes**
```bash
git add .
git commit -m "[FEAT] Add new agent type for X"
```

### Commit Message Format

Use the following prefixes:

- `[FEAT]` - New feature
- `[FIX]` - Bug fix
- `[DOCS]` - Documentation update
- `[REFACTOR]` - Code refactoring
- `[TEST]` - Test additions/updates
- `[PERF]` - Performance improvement
- `[STYLE]` - Code style changes

**Examples:**
```
[FEAT] Add semantic caching for similar queries
[FIX] Resolve memory leak in conversation storage
[DOCS] Update API documentation for task manager
[REFACTOR] Extract prompt rendering logic
[TEST] Add tests for context manager
[PERF] Optimize cache lookup performance
```

---

## Testing

### Manual Testing

Test your changes manually:

```bash
# CLI commands
./chat-llm.js agent-list
./chat-llm.js context-create test
./chat-llm.js prompt-list
./chat-llm.js task-stats

# Interactive mode
./chat-llm.js

# Web interface
HTTP_PORT=5000 ./chat-llm.js

# Evaluation tests
./chat-llm.js tests/english.txt
```

### Test Files

Create test files in the `tests/` directory:

```
User: What is the capital of France?
Assistant: /Paris/

User: What is 2 + 2?
Assistant: /4/
```

### Testing Checklist

Before submitting:
- [ ] Feature works as expected
- [ ] No console errors
- [ ] CLI commands work
- [ ] Web interface works (if applicable)
- [ ] Demo mode works
- [ ] Documentation updated
- [ ] No breaking changes (or documented)

---

## Documentation

### What to Document

1. **New Features**
   - Add to README.md
   - Update FEATURES.md
   - Add to API.md if programmatic
   - Update QUICK_START.md with examples

2. **Code Changes**
   - JSDoc comments on functions
   - Inline comments for complex logic
   - README updates if behavior changes

3. **Breaking Changes**
   - Document in CHANGELOG.md
   - Update migration guide
   - Add version notes

### Documentation Style

- Use clear, concise language
- Include code examples
- Provide use cases
- Link to related documentation

---

## Submitting Changes

### Pull Request Process

1. **Prepare PR**
```bash
git push origin feature/my-new-feature
```

2. **Create Pull Request**
- Go to GitHub repository
- Click "New Pull Request"
- Select your branch
- Fill out the PR template

3. **PR Description Template**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested manually
- [ ] Added tests
- [ ] All tests pass

## Checklist
- [ ] Code follows style guidelines
- [ ] JSDoc comments added
- [ ] Documentation updated
- [ ] No console errors
- [ ] Backward compatible

## Screenshots (if applicable)
```

4. **Review Process**
- Maintainer will review
- Address feedback
- Make requested changes
- PR will be merged when approved

---

## Feature Requests

### Submitting Feature Requests

1. Check if already requested in Issues
2. Create new issue with "Feature Request" label
3. Provide:
   - Clear description
   - Use case
   - Expected behavior
   - Possible implementation (optional)

### Feature Request Template
```markdown
**Feature Description**
A clear description of the feature

**Use Case**
Why is this feature needed?

**Proposed Solution**
How could this be implemented?

**Alternatives Considered**
Other approaches considered

**Additional Context**
Any other relevant information
```

---

## Bug Reports

### Submitting Bug Reports

1. Check if already reported
2. Create issue with "Bug" label
3. Provide reproduction steps

### Bug Report Template
```markdown
**Describe the Bug**
Clear description of what's wrong

**To Reproduce**
Steps to reproduce:
1. Run command '...'
2. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g., macOS 14]
- Node version: [e.g., v20.0.0]
- Chat LLM version: [e.g., 2.0.0]

**Error Messages**
```
Paste any error messages
```

**Additional Context**
Any other relevant information
```

---

## Development Tips

### Debugging

Enable debug mode:
```bash
LLM_DEBUG=1 ./chat-llm.js
```

View all requests:
```javascript
// In chat-llm.js, the logger captures all requests
logger.logRequest(operation, input, output, duration)
```

### Performance Testing

Monitor performance:
```javascript
const start = Date.now()
// ... operation ...
const duration = Date.now() - start
console.log(`Operation took ${duration}ms`)
```

### Local Testing

Test with demo mode (no API required):
```bash
LLM_DEMO_MODE=1 ./chat-llm.js
```

---

## Code Review Guidelines

### For Contributors

- Be open to feedback
- Explain your reasoning
- Keep discussions focused on code
- Update PR based on feedback

### For Reviewers

- Be constructive and respectful
- Explain why changes are needed
- Suggest alternatives
- Recognize good work

---

## Release Process

(For maintainers)

1. Update version in package.json (if applicable)
2. Update CHANGELOG.md
3. Update RELEASE_NOTES_V2.md
4. Create git tag
5. Push to main branch
6. Create GitHub release

---

## Resources

### Documentation
- [README.md](README.md) - Main documentation
- [API.md](API.md) - API reference
- [FEATURES.md](FEATURES.md) - Feature overview
- [QUICK_START.md](QUICK_START.md) - Quick reference
- [DEVELOPMENT.md](DEVELOPMENT.md) - Development notes
- [ROADMAP.md](ROADMAP.md) - Future plans

### Tools
- [Node.js Documentation](https://nodejs.org/docs)
- [VS Code](https://code.visualstudio.com)
- [Git](https://git-scm.com)

### Community
- GitHub Issues - Bug reports and features
- GitHub Discussions - Questions and ideas

---

## Recognition

Contributors will be recognized in:
- GitHub Contributors page
- Release notes (for significant contributions)
- Documentation (for major features)

---

## Questions?

If you have questions:
1. Check existing documentation
2. Search closed issues
3. Open a new issue with "Question" label

---

**Thank you for contributing to Chat LLM!**

We appreciate your time and effort in making this project better.

---

**Version:** 2.0.0  
**Last Updated:** December 8, 2025
