---
description: Pull status updates from Jira/ClickUp to sync with tasks.json
---

# Sync Status Updates

Pull latest status from Jira/ClickUp and update local tasks.json to prevent drift.

## Usage

```bash
/wb-sync-status --source jira --project PROJ
```

## Parameters

- `--source`: jira or clickup
- `--project`: Jira project key
- `--dry-run`: Preview changes

## What It Does

1. Reads external references from tasks.json
2. Queries Jira/ClickUp for status
3. Updates tasks.json if Jira status is newer
4. Reports conflicts

## Output

```
Synced status updates:
- Task 1: Done ✓
- Task 2: Done ✓
- Task 3: In Progress → Done
- Task 4: Ready (dependencies met) ✓
```

## When to Run

- Daily to prevent status drift
- After task completion
- Before starting new task
- When working with multiple developers

## Related

- [MCP Integration](mdc:modules/capabilities/task-master/workflows/mcp-integration.md)

