---
description: Sync tasks.json to ClickUp via ClickUp MCP (fallback)
---

# Sync Tasks to ClickUp

Sync tasks.json to ClickUp as fallback when Jira is unavailable.

## Usage

```bash
/wb-sync-to-clickup --list "Feature Name" --space-id 12345
```

## Parameters

- `--list`: ClickUp list name
- `--space-id`: ClickUp space ID
- `--dry-run`: Preview only
- `--force`: Update existing

## Hierarchy

```
Feature → List
Task → Task
Subtask → Subtask/Checklist
```

## When to Use

- Jira is unavailable
- Team prefers ClickUp
- Fallback option

## Related

- See `/wb-sync-to-jira` for full documentation
- [MCP Integration](mdc:modules/capabilities/task-master/workflows/mcp-integration.md)

