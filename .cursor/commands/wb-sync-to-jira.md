---
description: Sync tasks.json to Jira via Atlassian MCP
---

# Sync Tasks to Jira

Sync tasks.json to Jira creating Epics, Stories, and Subtasks with proper hierarchy and dependencies.

## Usage

```bash
/wb-sync-to-jira --project PROJ --epic-auth
```

## Parameters

- `--project`: Jira project key (e.g., PROJ)
- `--epic-auth`: Create epic for feature group
- `--dry-run`: Preview without creating
- `--force`: Update existing issues

## When to Use

**Use when**:
- Tasks.json is ready with generated tasks
- Need to sync to Jira for sprint planning
- Want automatic hierarchy (Epic → Story → Subtask)

**Don't use when**:
- Tasks.json has circular dependencies (fix first with `/wb-validate-tasks`)
- Tasks.json is incomplete

## Hierarchy Mapping

```
PRD Feature Group → Jira Epic
Task (simple)     → Jira Story
Task (complex)    → Jira Story with Subtasks
Subtask           → Jira Subtask
```

## Field Mappings

- `task.title` → Story/Subtask Title
- `task.description` → Story Description
- `task.details` → Acceptance Criteria
- `task.testStrategy` → Testing Notes
- `task.dependencies` → Blocked By links
- `task.priority` → Priority (high/medium/low)
- `task.status` → Status mapping

## Status Mapping

| tasks.json | Jira |
|------------|------|
| pending | To Do |
| in-progress | In Progress |
| done | Done |
| review | In Review |
| blocked | Blocked |
| deferred | Backlog |

## Process

1. Read `.taskmaster/tasks/tasks.json`
2. Validate structure
3. Group tasks by feature/epic
4. For each feature:
   - Create Epic (if --epic flag)
   - Create Stories from tasks
   - Create Subtasks if expanded
   - Set "Blocked By" dependencies
   - Store external reference: `task-master-task-{id}`
5. Report summary

## Output

```
✅ Synced 12 tasks to Jira

Created:
- Epic: PROJ-1 - User Authentication
  - Story: PROJ-2 - Setup PostgreSQL
  - Story: PROJ-3 - Implement JWT Auth
    - Subtask: PROJ-4 - Input validation
    - Subtask: PROJ-5 - Password hashing
    - Subtask: PROJ-6 - JWT generation
    - Subtask: PROJ-7 - Login endpoint
    - Subtask: PROJ-8 - Register endpoint
  - Story: PROJ-9 - Build Product API
  ...

All dependencies linked via "Blocked By".
```

## Dry Run

Preview what would be created:

```bash
/wb-sync-to-jira --project PROJ --dry-run
```

Shows:
- Epics to create
- Stories to create
- Subtasks to create
- Dependencies to link

## Related Documentation

- [MCP Integration](mdc:modules/capabilities/task-master/workflows/mcp-integration.md)
- [Unified Workflow](mdc:modules/practices/agile-methodology/UNIFIED_WORKFLOW.md)
- [WB Commands Reference](mdc:modules/capabilities/task-master/commands/WB_COMMANDS.md)

