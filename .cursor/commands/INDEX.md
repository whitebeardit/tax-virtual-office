# Task Master Commands Index

## 🚀 Quick Start

### To Get Started Quickly
- **[`/wb-quick-start`](wb-quick-start.md)** - Bootstrap project in minutes
  - Automatic basic PRD
  - Initial tasks generated
  - Ideal for: New projects

### For Complete Features
- **[`/wb-new-feature`](wb-new-feature.md)** - Complete structured workflow
  - Detailed PRD → Tasks → Analysis → Expansion
  - Ideal for: Important features

## 🧩 Profile Authoring

- **[`/wb-create-profile`](wb-create-profile.md)** - Build a new Cursor profile via questionnaire
  - Interactive interview collects module requirements
  - Generates `profile.json`, `enabled-modules.txt`, and README
  - Ideal for: Creating bespoke client or stack bundles

## 📝 Documentation Creation

### PRD
- **[`/wb-create-prd`](wb-create-prd.md)** - Create complete PRD
  - Structured template
  - Optional codebase analysis
  - Ideal for: Formal documentation

### Tasks
- **[`/wb-parse-prd`](wb-parse-prd.md)** - Generate tasks from PRD
  - Automatic dependencies
  - Research mode
  - Ideal for: Converting PRD to tasks

- **[`/wb-add-task`](wb-add-task.md)** - Add individual task
  - Auto-detect dependencies
  - Ideal for: Specific tasks
  - Alias: `/wb-tm-add-task` (training shortcut that calls the same workflow)

## 🔍 Analysis and Expansion

### Codebase
- **[`/wb-analyze-codebase`](wb-analyze-codebase.md)** - Analyze structure
  - Glob, Grep, Read
  - Patterns and stack
  - Ideal for: Understanding existing project

### Research
- **[`/wb-research`](wb-research.md)** - Search best practices
  - Current technologies
  - Versions and patterns
  - Ideal for: Technical choices

### Complexity
- **[`/wb-analyze-complexity`](wb-analyze-complexity.md)** - Analyze complexity
  - Score 1-10 per task
  - Recommendations
  - Ideal for: Identifying complex tasks

### Expansion
- **[`/wb-expand-task`](wb-expand-task.md)** - Expand task into subtasks
  - Correct sequential IDs
  - Uses complexity report
  - Ideal for: Detailed breakdown

- **[`/wb-expand-complex`](wb-expand-complex.md)** - Auto-expand complex tasks
  - All tasks with score >= threshold
  - Batch processing
  - Ideal for: Before syncing to Jira

## 🔄 Development Workflow

### Task Management
- **[`/wb-next-task`](wb-next-task.md)** - Show next available task
  - Complete dependencies
  - High priority first
  - Ideal for: Starting work

- **[`/wb-start-task`](wb-start-task.md)** - Start task
  - Mark as in-progress
  - Create git branch
  - Sync to Jira
  - Ideal for: Starting implementation

- **[`/wb-complete-task`](wb-complete-task.md)** - Complete task
  - Mark as done
  - Create commit
  - Sync to Jira
  - Unblock dependencies
  - Ideal for: Finishing work

## 🔄 Jira/ClickUp Synchronization

### Main Sync
- **[`/wb-sync-to-jira`](wb-sync-to-jira.md)** - Sync tasks.json → Jira
  - Create Epics, Stories, Subtasks
  - Dependencies via "Blocked By"
  - External references
  - Ideal for: Sprint planning

- **[`/wb-sync-to-clickup`](wb-sync-to-clickup.md)** - Sync tasks.json → ClickUp
  - Fallback when Jira unavailable
  - Same structure as Jira
  - Ideal for: Teams using ClickUp

- **[`/wb-sync-status`](wb-sync-status.md)** - Bi-directional status update
  - Pull status from Jira/ClickUp
  - Automatic sync
  - Prevents drift
  - Ideal for: Keeping tasks.json updated

- **[`/wb-create-epic`](wb-create-epic.md)** - Create Epic in Jira
  - Feature group container
  - For multiple stories
  - Ideal for: Organizing by feature

## 🚀 Hybrid Workflows (Automatic)

### Complete Pipeline
- **[`/wb-prd-to-jira`](wb-prd-to-jira.md)** - Complete automatic flow
  - PRD → tasks → analysis → expansion → Jira
  - Complete pipeline
  - Ideal for: Automating everything

- **[`/wb-feature-breakdown`](wb-feature-breakdown.md)** - Layer-based breakdown → Jira
  - Story mapping
  - Layer-based tasks
  - Backend or Frontend
  - Ideal for: Layered architecture

## ✅ Quality

### Validation
- **[`/wb-validate-tasks`](wb-validate-tasks.md)** - Validate tasks.json
  - Circular dependencies
  - Duplicate IDs
  - Schema validation
  - Ideal for: Audit

- **[`/wb-validate-prd`](wb-validate-prd.md)** - Validate PRD before parsing
  - Required sections
  - Document quality
  - Recommendations
  - Ideal for: Before generating tasks

## 📊 Typical Flows

### 1️⃣ New Project

```bash
/wb-quick-start → Project created
/wb-analyze-complexity → Identify complex tasks
/wb-expand-task → Expand tasks
```

### 2️⃣ New Feature

```bash
/wb-analyze-codebase → Understand context
/wb-create-prd → Document feature
/wb-parse-prd → Generate tasks
/wb-analyze-complexity → Analyze
/wb-expand-task → Expand
```

### 3️⃣ Complete Workflow

```bash
/wb-new-feature → Everything automatic
(Includes: PRD, Tasks, Analysis, Expansion)
```

### 4️⃣ Specific Task

```bash
/wb-add-task (or /wb-tm-add-task) → Add
```

## 📚 References

- [README](README.md) - Overview
- [Complete Rules](mdc:modules/capabilities/task-master/README.md)
- [Workflows](mdc:modules/capabilities/task-master/workflows/)
- [Prompts](mdc:modules/capabilities/task-master/prompts/)

## ⚙️ Configuration

All commands follow the rules in `modules/capabilities/task-master/`:
- ✅ Task structure schema
- ✅ Dependency management
- ✅ Complexity analysis
- ✅ Subtask generation rules
- ✅ Codebase analysis workflow
- ✅ Research integration
