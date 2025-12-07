---
description: Mark task done, sync to Jira, create commit, unblock dependencies
---

# Complete Task

Mark task as done, sync to Jira/ClickUp, create commit, and unblock dependent tasks.

## Usage

```bash
/wb-complete-task --id 5 --commit --push
```

## Parameters

- `--commit`: Create git commit with task details
- `--push`: Push branch to remote
- `--pr`: Open Pull Request (future)

## What It Does

1. Marks task as `done` in tasks.json
2. Syncs status to Jira/ClickUp
3. Creates commit with task details (if --commit)
4. Unblocks dependent tasks
5. Shows next available task

## Commit Message Format

```
feat(task-5): Implement JWT Authentication

- Setup input validation
- Implement password hashing with bcrypt
- Generate JWT tokens with user payload
- Create login endpoint
- Create registration endpoint
- Add JWT verification middleware

Complexity: 7/10
Task 5: Implement JWT Authentication
Dependencies: Task 1, Task 2
```

## Output

```
✅ Task 5 marked as done

Synced to Jira: PROJ-10 status → Done

Created commit: feat(task-5): Implement JWT Authentication

Unblocked dependent tasks:
- Task 7: Build Dashboard (ready to start)

Next available: Task 7
```

## Related

- [Git Workflow](mdc:modules/capabilities/automation/cursor/rules/git_workflow.mdc)
- [Unified Workflow](mdc:modules/practices/agile-methodology/UNIFIED_WORKFLOW.md)

