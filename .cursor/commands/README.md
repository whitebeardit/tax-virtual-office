# Cursor Commands - Task Master (Whitebeard)

This directory contains Cursor slash commands for complete Task Master integration, based on structured rules in `modules/capabilities/task-master/`.

## 📋 Available Commands

### Complete Workflows

#### `/wb-new-feature`
**Complete workflow**: PRD → Tasks → Analysis → Expansion
- Creates structured PRD
- Generates tasks with analysis
- Analyzes complexity
- Automatically expands complex tasks
- **Usage**: Complete new feature with structured planning

#### `/wb-quick-start`
**Quick workflow**: Quickly start a project
- Automatically creates basic PRD
- Generates initial tasks
- Minimal configuration
- **Usage**: Quick bootstrap of new projects

### Creation Commands

#### `/wb-create-prd`
**Create structured and complete PRD**
- Complete template
- Detailed sections
- Optional codebase analysis
- **Usage**: Formal requirements documentation

#### `/wb-parse-prd`
**Parse PRD into structured tasks**
- Generates tasks with dependencies
- Optional codebase analysis
- Optional research mode
- **Usage**: Convert PRD into actionable tasks

### Analysis Commands

#### `/wb-analyze-codebase`
**Complete codebase analysis**
- Glob, Grep, Read
- Identifies stack and patterns
- Aligns with existing architecture
- **Usage**: Understanding existing project

#### `/wb-analyze-complexity`
**Analyze task complexity**
- Score 1-10 per task
- Subtask recommendations
- Expansion prompts
- **Usage**: Identify which tasks need expansion

#### `/wb-expand-task`
**Expand task into detailed subtasks**
- Correct sequential IDs
- Uses complexity report
- Optional research mode
- **Usage**: Breaking down complex tasks

### Support Commands

#### `/wb-add-task`
**Add individual task**
- Auto-detect dependencies
- Optional codebase analysis
- Automatic validation
- **Usage**: Add specific task
- **Alias**: `/wb-tm-add-task` (training shorthand that executes the same workflow)

#### `/wb-research`
**Research best practices**
- Current technologies
- Versions and patterns
- Recommended implementations
- **Usage**: Search best practices

#### `/wb-validate-tasks`
**Validate tasks.json integrity**
- Circular dependencies
- Duplicate IDs
- Schema validation
- **Usage**: Task audit

## 🔄 Typical Workflows

### Workflow 1: Complete New Feature

```bash
/wb-new-feature
→ Describes feature
→ Analyze codebase? Yes
→ Research mode? Yes
→ Number of tasks? Auto

Result:
- Complete PRD created
- Tasks generated with research
- Complexity analysis
- Complex tasks expanded
- Ready to implement
```

### Workflow 2: Quick Start

```bash
/wb-quick-start
→ Project name
→ Brief description
→ Tech stack

Result:
- Basic PRD
- Initial tasks
- Complete bootstrap
```

### Workflow 3: Adding to Existing Project

```bash
/wb-analyze-codebase (optional)
/wb-create-prd
→ Feature info
→ Analyze codebase? Yes

/wb-parse-prd
→ PRD path
→ Analyze codebase? Yes
→ Research? Yes

/wb-analyze-complexity
→ Threshold: 5

/wb-expand-task --id=<complexTask>
→ For each complex task

Result:
- Feature aligned with project
- Detailed and expanded tasks
```

## 📚 Reference Rules

All commands are based on complete rules in `modules/capabilities/task-master/`:

### Directory Structure
- `prd-creation/` - Templates and rules for PRDs
- `task-generation/` - Task creation and structure
- `task-expansion/` - Expansion into subtasks
- `prompts/` - System prompts for AI
- `workflows/` - Complete workflows

### Main Documentation
- [Complete Workflow](mdc:modules/capabilities/task-master/workflows/complete-workflow.md)
- [Task Structure](mdc:modules/capabilities/task-master/task-generation/task-structure.md)
- [PRD Template](mdc:modules/capabilities/task-master/prd-creation/prd-template.md)

## 🎯 When to Use Each Command

### For New Projects
1. `/wb-quick-start` - Quick bootstrap
2. `/wb-analyze-complexity` - Check complexity
3. `/wb-expand-task` - Expand complex tasks

### For Features in Existing Project
1. `/wb-analyze-codebase` - Understand context
2. `/wb-create-prd` - Document feature
3. `/wb-parse-prd` - Generate tasks
4. `/wb-analyze-complexity` - Analyze complexity
5. `/wb-expand-task` - Expand tasks

### For Specific Tasks
1. `/wb-add-task` or `/wb-tm-add-task` - Add individual task

### For Audit
1. `/wb-validate-tasks` - Check integrity
2. `/wb-analyze-complexity` - Complexity review

## 💡 Tips

1. **Always analyze complexity** after generating tasks
2. **Use research mode** for modern technologies
3. **Analyze codebase** when working on existing projects
4. **Validate tasks** periodically
5. **Expand complex tasks** before starting implementation

## 🏷️ Tag System

All commands respect the Task Master tag system:
- Tasks isolated by context
- Tags: master, feature-*, experiment-*, v*
- Manual context switching
- No interference between tags

## ⚠️ Critical Rules

### Subtask IDs
- **NEVER** use parent task ID (ex: 5.1)
- **ALWAYS** use sequential: 1, 2, 3, ...
- **ALWAYS** start from `nextSubtaskId`

### Dependencies
- No circular dependencies
- No self-dependency
- No references to non-existent tasks

### Schema
- All required fields present
- Correct types
- Valid enums

## 📖 Additional Resources

For more details on each aspect:
- [Task Master Rules](mdc:modules/capabilities/task-master/README.md)
- [Complete Workflow Guide](mdc:modules/capabilities/task-master/workflows/complete-workflow.md)
- [Dependency Management](mdc:modules/capabilities/task-master/task-generation/dependency-management.md)

