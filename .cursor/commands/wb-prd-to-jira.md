---
description: Complete flow - PRD → tasks.json → Jira sync (automated pipeline)
---

# PRD to Jira Complete Flow

Execute complete workflow: PRD → tasks.json → complexity analysis → expansion → Jira sync.

## Usage

```bash
/wb-prd-to-jira .taskmaster/docs/auth-prd.txt --project PROJ --research
```

## What It Does

1. Validates PRD completeness
2. Parses PRD with AI (research mode enabled)
3. Analyzes task complexity
4. Expands complex tasks (score >= 5)
5. Syncs to Jira with full hierarchy

## Parameters

- `--project`: Jira project key (required)
- `--research`: Enable research mode for best practices
- `--threshold`: Complexity threshold for expansion (default: 5)
- `--dry-run`: Preview without creating Jira issues

## Workflow

```
PRD → [Validate] → [Parse] → [Analyze] → [Expand] → [Sync to Jira]
                      ↓           ↓          ↓            ↓
                  tasks.json  scores   subtasks    Epics/Stories
```

## Output

```
✅ Complete workflow executed

Phase 1: PRD Validation
✓ All required sections present
✓ Tech stack specified
✓ Features clearly defined

Phase 2: Task Generation
✓ 12 tasks generated
✓ Dependencies mapped
✓ Research mode used

Phase 3: Complexity Analysis
✓ 3 tasks flagged as complex (score >= 5)
✓ Recommended expansion counts determined

Phase 4: Task Expansion
✓ Task 3 expanded: 6 subtasks
✓ Task 5 expanded: 4 subtasks
✓ Task 8 expanded: 8 subtasks

Phase 5: Jira Sync
✓ Epic created: PROJ-1 - User Authentication
✓ 12 stories created
✓ 18 subtasks created
✓ All dependencies linked

✅ Ready for sprint planning
```

## When to Use

- Complete automation of PRD → Jira flow
- Want to skip manual steps
- Need consistent structure
- Standard workflow for features

## Related

- [Unified Workflow](mdc:modules/practices/agile-methodology/UNIFIED_WORKFLOW.md)
- [Integration Examples](mdc:modules/capabilities/task-master/workflows/integration-examples.md)

