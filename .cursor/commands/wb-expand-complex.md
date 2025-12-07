---
description: Auto-expand all complex tasks (score >= threshold) into subtasks
---

# Expand Complex Tasks

Automatically expand all tasks with complexity score >= threshold into detailed subtasks.

## Usage

```bash
/wb-expand-complex --threshold 5 --force --research
```

## Parameters

- `--threshold`: Minimum score to expand (default: 5)
- `--force`: Replace existing subtasks
- `--research`: Use research mode for expansion
- `--all`: Expand all tasks regardless of score

## What It Does

1. Reads complexity analysis report
2. Finds tasks with score >= threshold
3. Auto-generates subtasks using AI
4. Uses sequential IDs (1, 2, 3...)
5. Maintains dependencies

## Example

Input: Auth task (score 7)
Output: 6 subtasks created:

```
1. Setup input validation
2. Implement password hashing
3. Generate JWT tokens
4. Create login endpoint
5. Create registration endpoint
6. Add JWT verification middleware
```

## Output

```
✅ Expanded 3 complex tasks

Task 3 (score 7): 6 subtasks created
Task 5 (score 6): 4 subtasks created  
Task 8 (score 9): 8 subtasks created

Total: 18 subtasks added
```

## When to Use

- After running `/wb-analyze-complexity`
- Before syncing to Jira
- When tasks are too vague or large

## Related

- [Complexity Analysis](mdc:modules/capabilities/task-master/task-expansion/complexity-analysis.md)
- [Subtask Generation](mdc:modules/capabilities/task-master/task-expansion/subtask-generation-rules.md)

