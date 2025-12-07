---
description: Validate PRD completeness before parsing into tasks
---

# Validate PRD

Check PRD for completeness, required sections, and quality before parsing.

## Usage

```bash
/wb-validate-prd .taskmaster/docs/auth-prd.txt
```

## What It Checks

- All required sections present
- Features clearly defined
- Tech stack specified
- NFRs included (if applicable)

## Required Sections

- Project Overview
- Goals/Objectives
- Features List
- Technical Stack (with versions)
- API Endpoints (if applicable)
- Database Schema (if applicable)

## Output

```
✅ PRD Validation Complete

Sections found:
✓ Overview
✓ Goals
✓ Features (4 features)
✓ Technical Stack
✓ API Endpoints (5 endpoints)
✓ Database Schema (2 tables)

Quality score: 95/100

Recommendations:
- Add non-functional requirements
- Specify JWT expiration times
- Add rate limiting details

Ready to parse: Yes ✓
```

## When to Run

- After creating PRD with `/wb-create-prd`
- Before parsing with `/wb-parse-prd`
- When reviewing PRD quality

## Related

- [PRD Template](mdc:modules/capabilities/task-master/prd-creation/prd-template.md)
- [PRD Parsing Rules](mdc:modules/capabilities/task-master/prd-creation/prd-parsing-rules.md)

