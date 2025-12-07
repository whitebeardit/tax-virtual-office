---
description: Quick start workflow for new projects - creates basic PRD and generates initial tasks
---

# Quick Start

## Purpose

This command provides a quick workflow to start new projects, creating a basic PRD and automatically generating initial tasks.

## When to Use

✅ **Use this command when**:
- Starting a new project from scratch
- Want to start quickly without extensive PRD
- Already have a clear idea of what to build
- Need quick task bootstrap

❌ **Don't use when**:
- Project already exists and has tasks
- Need detailed and formal PRD (use `/wb-create-prd`)
- Working on feature for existing project

## Execution Process

### 1. Basic Information Collection

**Ask the user (simple)**:

1. **Project name**
   - "What is the project name?"
   - Example: "E-Commerce Platform", "Task Manager"

2. **Brief description**
   - "Describe the project in 1-2 sentences"
   - Example: "E-commerce platform with authentication, product catalog and checkout"

3. **Main tech stack**
   - "What are the main technologies?"
   - Backend: Node.js, Express, Django, etc.
   - Frontend: React, Vue, Next.js, etc.
   - Database: PostgreSQL, MongoDB, etc.

### 2. Automatic PRD Creation

**Create basic PRD** using simplified template:

Follow structure from: [@ai_knowledge_base/task-master/prd-creation/prd-template.md](mdc:modules/capabilities/task-master/prd-creation/prd-template.md)

**Simplified Template**:
```markdown
# {{projectName}}

## Overview
{{description}}

## Goals
1. Implement core functionality
2. Ensure security and best practices
3. Deliver working solution

## Features
{{auto-generate based on description}}

## Technical Stack
{{techStackProvided}}

## API Endpoints
{{auto-generate based on features}}

## Database Schema
{{auto-generate based on features}}
```

**Required sections** (minimum):
- Overview: Based on description
- Goals: Standards (implement core, security, functional solution)
- Features: Auto-generated based on description
- Tech Stack: Use the one provided by user

**Optional sections** (if relevant):
- API Endpoints: If backend
- Database Schema: If database mentioned
- Non-Functional: Basic performance

### 3. Automatic PRD Parsing

**Apply `/wb-parse-prd` automatically**:

Default settings:
- Num tasks: Auto (based on estimated complexity)
- Analyze codebase: No (new project)
- Research mode: Yes (for best practices)
- Force: True (overwrite tasks.json)

**Generate tasks** using: [@ai_knowledge_base/task-master/prompts/parse-prd-prompt.md](mdc:modules/capabilities/task-master/prompts/parse-prd-prompt.md)

### 4. Initial Validation

**Verify**:
- ✅ PRD created and saved
- ✅ Tasks generated
- ✅ No circular dependencies
- ✅ Valid schema
- ✅ Files in correct location

### 5. Output

**Present complete result**:

```markdown
🎉 Project started successfully!

### Files Created
📄 PRD: .taskmaster/docs/{{projectName}}-prd.md
📄 Tasks: .taskmaster/tasks/tasks.json

### PRD Summary
- Name: {{projectName}}
- Features: {{featureCount}}
- Tech Stack: {{techStack}}

### Tasks Generated
📊 Total tasks: {{taskCount}}
- High priority: {{highCount}}
- Medium priority: {{mediumCount}}
- Low priority: {{lowCount}}

📝 Initial tasks:
{{#each tasks}}
{{id}}. {{title}} ({{priority}})
{{/each}}

### Recommended Next Steps

1. **Complexity Analysis**
   Execute `/wb-analyze-complexity` to identify complex tasks

2. **Expand Tasks**
   Execute `/wb-expand-task --id={{complexId}}` for tasks with score ≥5

3. **Start Development**
   Execute next task after analysis and expansion

### Useful Commands
- `/wb-list` - View all tasks
- `/wb-next` - View next task to work on
- `/wb-show {{id}}` - View details of a task
- `/wb-analyze-complexity` - Analyze complexity

🚀 Ready to start!
```

## Reference Rules

**Main Rules**:
- [@ai_knowledge_base/task-master/prd-creation/prd-template.md](mdc:modules/capabilities/task-master/prd-creation/prd-template.md)
- [@ai_knowledge_base/task-master/prd-creation/examples/sample-prd.md](mdc:modules/capabilities/task-master/prd-creation/examples/sample-prd.md)
- [@ai_knowledge_base/task-master/prompts/parse-prd-prompt.md](mdc:modules/capabilities/task-master/prompts/parse-prd-prompt.md)

**Workflows**:
- [@ai_knowledge_base/task-master/workflows/complete-workflow.md](mdc:modules/capabilities/task-master/workflows/complete-workflow.md)
- [@ai_knowledge_base/task-master/workflows/research-integration.md](mdc:modules/capabilities/task-master/workflows/research-integration.md)

## Usage Example

**Command**: `/wb-quick-start`

**Questions and Answers**:
```
1. Project name?
   → "Task Manager App"

2. Brief description?
   → "Task management app with authentication, task CRUD, and filters"

3. Tech stack?
   → Backend: Node.js, Express, PostgreSQL
   → Frontend: React, TypeScript
```

**Automatic Execution**:
```
1. Creating basic PRD...
2. Saving to .taskmaster/docs/task-manager-app-prd.md
3. Parsing PRD with research mode...
4. Generating tasks...
5. Saving tasks...
```

**Generated PRD** (abbreviated example):
```markdown
# Task Manager App

## Overview
Task management app with JWT authentication, complete task CRUD, 
and status and priority filters. Built with Node.js/Express backend 
and React/TypeScript frontend.

## Goals
1. Implement secure user authentication
2. Enable complete task CRUD
3. Provide task filters and search
4. Deliver responsive and modern interface

## Features
1. User Authentication - JWT-based login and registration
2. Task CRUD - Create, read, update and delete tasks
3. Task Filters - Filter by status, priority and date
4. Task Search - Search tasks by title and description

## Technical Stack

### Backend
- Node.js 18+
- Express 4
- PostgreSQL 16
- Prisma ORM 5.0
- jsonwebtoken 9.0.2

### Frontend
- React 19
- TypeScript 5
- React Router 6.8
- TanStack Query 5
- Tailwind CSS 3.4

## API Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET /api/tasks
- POST /api/tasks
- PUT /api/tasks/:id
- DELETE /api/tasks/:id
```

**Tasks Geradas** (exemplo):
```json
{
  "tasks": [
    {"id": 1, "title": "Setup Project Structure", "dependencies": [], "priority": "high"},
    {"id": 2, "title": "Configure PostgreSQL with Prisma", "dependencies": [1], "priority": "high"},
    {"id": 3, "title": "Implement User Authentication", "dependencies": [2], "priority": "high"},
    {"id": 4, "title": "Create Task CRUD Endpoints", "dependencies": [3], "priority": "high"},
    {"id": 5, "title": "Setup React Frontend", "dependencies": [1], "priority": "high"},
    {"id": 6, "title": "Implement Task List UI", "dependencies": [5], "priority": "high"},
    {"id": 7, "title": "Implement Task Filters", "dependencies": [6], "priority": "medium"},
    {"id": 8, "title": "Implement Task Search", "dependencies": [6], "priority": "medium"}
  ]
}
```

**Final Output**:
```
🎉 Project started successfully!

### Files Created
📄 PRD: .taskmaster/docs/task-manager-app-prd.md
📄 Tasks: .taskmaster/tasks/tasks.json

### Generated Tasks
📊 Total: 8 tasks
- High priority: 6
- Medium priority: 2

📝 Tasks:
1. Setup Project Structure (high)
2. Configure PostgreSQL with Prisma (high)
3. Implement User Authentication (high)
4. Create Task CRUD Endpoints (high)
5. Setup React Frontend (high)
6. Implement Task List UI (high)
7. Implement Task Filters (medium)
8. Implement Task Search (medium)

### Next Steps

1. Execute `/wb-analyze-complexity` to identify complex tasks
2. Execute `/wb-expand-task --id=3` (authentication needs expansion)
3. Execute `/wb-expand-task --id=4` (CRUD needs expansion)
4. Start with Task 1 (no dependencies)!

🚀 Ready to start!
```

