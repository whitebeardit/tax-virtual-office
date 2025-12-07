---
description: Show next available task to work on (all dependencies met)
---

# Next Task

Find and display the next available task with all dependencies completed.

## Usage

```bash
/wb-next-task
```

## What It Shows

- Task details (title, description, details)
- Acceptance criteria
- Dependencies (with status)
- Estimated complexity
- Suggested implementation approach

## Filters

- All dependencies completed ✓
- Highest priority first
- Foundation tasks before features
- No circular dependencies

## Output

```
Next Task: 5 - Implement JWT Authentication

Description: Create JWT-based authentication system

Complexity: 7/10 (Recommended: 6 subtasks)

Dependencies:
- ✓ Task 1: Setup PostgreSQL
- ✓ Task 2: Setup Express Server

Status: Ready to start

Suggested approach:
1. Follow backend layer breakdown guide
2. Start with Domain layer (User entity)
3. Then Application layer (use cases)
4. Infrastructure layer last

[Start Task] [Show Details]
```

## Related

- [WB Commands](mdc:modules/capabilities/task-master/commands/WB_COMMANDS.md)

