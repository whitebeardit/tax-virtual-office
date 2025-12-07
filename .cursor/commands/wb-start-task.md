---
description: Mark task in-progress, create git branch, sync to Jira
---

# Start Task

Mark task as in-progress, create feature branch, and sync status to Jira/ClickUp.

## Usage

```bash
/wb-start-task --id 5
```

## What It Does

1. Marks task as `in-progress` in tasks.json
2. Creates git branch: `task-005-<slug>`
3. Syncs status to Jira/ClickUp
4. Shows layer breakdown guide

## Output

```
✅ Task 5 marked as in-progress

Branch created: task-005-implement-jwt-authentication

Synced to Jira: PROJ-10 status → In Progress

Suggested layer breakdown:
- Domain: User entity, Email value object
- Application: RegisterUser use case
- Infrastructure: UserRepository
- Presentation: Auth controller

[Continue] [Show Layer Guide]
```

## Related

- [Git Workflow](mdc:modules/capabilities/automation/cursor/rules/git_workflow.mdc)
- [Layer Breakdown](mdc:modules/practices/agile-methodology/task-decomposition/backend-layer-breakdown.md)

