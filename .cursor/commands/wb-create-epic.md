---
description: Create a new Jira Epic from feature group
---

# Create Jira Epic

Create a Jira Epic for a feature group that can contain multiple stories.

## Usage

```bash
/wb-create-epic user-authentication --project PROJ --description "Complete auth implementation"
```

## Parameters

- `--project`: Jira project key (required)
- `--description`: Epic description
- `--priority`: high, medium, or low
- `--owner`: Epic owner (optional)

## When to Use

- Starting a new major feature
- Need epic container for multiple stories
- Organizing work by feature group

## Output

```
✅ Epic created successfully

Epic: PROJ-1 - User Authentication
Description: Complete auth implementation including registration, 
login, JWT tokens, and password recovery

Priority: High
Owner: Product Team

Next steps:
- Link stories to this epic
- Or run /wb-prd-to-jira to auto-create all issues
```

## Related

- [Unified Workflow](mdc:modules/practices/agile-methodology/UNIFIED_WORKFLOW.md)
- [WB Commands](mdc:modules/capabilities/task-master/commands/WB_COMMANDS.md)

