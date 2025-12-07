---
description: Create structured Product Requirements Document for new features
---

# Create PRD

## Purpose

This command creates a structured and complete Product Requirements Document (PRD) that can be parsed into tasks by Task Master later.

## When to Use

✅ **Use this command when**:
- Starting a new feature or project
- Needing to structure requirements clearly
- Planning implementation of complex functionalities
- Documenting requirements before starting development

❌ **Don't use when**:
- A complete PRD already exists (use `/wb-parse-prd`)

## Execution Process

### 1. Information Collection

**Ask the user interactively**:

1. **Project/Feature Name**
   - "What is the project or feature name?"
   - Example: "E-Commerce Platform", "User Dashboard", "Payment Integration"

2. **Main Objectives (Goals)**
   - "What are the main objectives?"
   - "What should this project achieve?"
   - Collect 3-5 clear objectives

3. **Main Features**
   - "What are the main features to implement?"
   - Numbered list of functionalities
   - Brief description of each feature

4. **Tech Stack**
   - "What is the desired tech stack?"
   - Backend: (ex: Node.js, Express, Django)
   - Frontend: (ex: React, Vue, Next.js)
   - Database: (ex: PostgreSQL, MongoDB)
   - Others: (ex: Redis, Docker)

5. **Specific Technical Requirements**
   - "Are there specific technical requirements?"
   - Third-party APIs, mandatory libraries, architectural patterns

6. **Analyze Codebase? (if existing project)**
   - "Analyze existing codebase for alignment?"
   - Yes: Executes analysis with Glob/Grep/Read
   - No: Creates standalone PRD

### 2. Codebase Analysis (Optional)

**If user chose analysis**:

1. Execute `/wb-analyze-codebase` or similar analysis
2. Identify current stack
3. Identify existing patterns
4. Align PRD with current architecture
5. Adapt tech stack if necessary

**Integration**:
- Check versions of libraries in use
- Verify established patterns
- Align structure with project conventions

### 3. PRD Generation

**Create structured document following template**:

Use the complete template from: [@ai_knowledge_base/task-master/prd-creation/prd-template.md](mdc:modules/capabilities/task-master/prd-creation/prd-template.md)

**Minimum required structure**:
```markdown
# [Project Name]

## Overview
[Description of what will be built, purpose, audience]

## Goals
1. [Objective 1]
2. [Objective 2]
3. ...

## Features

### Core Features
1. [Feature 1 - Description]
2. [Feature 2 - Description]
3. ...

## Technical Stack

### Backend
- [Technology and version]

### Frontend
- [Technology and version]

### Database
- [Database and version]

### Infrastructure
- [Docker, CI/CD, etc.]
```

**Complete recommended structure** (include if relevant):
- API Endpoints
- Database Schema
- Non-Functional Requirements (Performance, Security, Scalability)
- User Stories (optional)
- Success Criteria (optional)

### 4. Important Specifications

**Sections that MUST be detailed** (based on [prd-template.md](mdc:modules/capabilities/task-master/prd-creation/prd-template.md)):

1. **Tech Stack**: Specify exact versions
   - ✅ "React 19.0.0"
   - ❌ "React"

2. **API Endpoints**: If applicable
   - List all necessary endpoints
   - HTTP methods, paths, request/response

3. **Database Schema**: If applicable
   - Tables, fields, relationships
   - Data types, constraints

4. **Constraints**: Mention limitations
   - Third-party APIs, quotas, restrictions

### 5. Save and Validate

**Save PRD**:
```bash
# Suggested location
.taskmaster/docs/[project-name]-prd.md
# or
docs/[project-name]-prd.md
```

**Validate**:
- All required sections filled
- Specific tech stack (with versions)
- Clear and actionable features
- No vague information

### 6. Output

Present to user:
- ✅ PRD created and validated
- 📁 File location
- 📊 Statistics (sections, features, endpoints)
- 🔗 Suggested next steps:
  - "Now you can use `/wb-parse-prd` to generate tasks"
  - "For adjustments, edit the file at [path]"

## Reference Rules

**Main Rules**:
- [@ai_knowledge_base/task-master/prd-creation/prd-template.md](mdc:modules/capabilities/task-master/prd-creation/prd-template.md)
- [@ai_knowledge_base/task-master/prd-creation/prd-parsing-rules.md](mdc:modules/capabilities/task-master/prd-creation/prd-parsing-rules.md)

**Template and Example**:
- [@ai_knowledge_base/task-master/prd-creation/examples/sample-prd.md](mdc:modules/capabilities/task-master/prd-creation/examples/sample-prd.md)

**Codebase Analysis (if used)**:
- [@ai_knowledge_base/task-master/workflows/codebase-analysis.md](mdc:modules/capabilities/task-master/workflows/codebase-analysis.md)

## Usage Example

**Command**: `/wb-create-prd`

**Questions and Answers**:

```
1. Project name?
   → "User Authentication System"

2. Objectives?
   → - Secure user authentication
   → - Session management
   → - Password recovery

3. Main features?
   → 1. User registration
   → 2. JWT login
   → 3. Refresh tokens
   → 4. Forgot password

4. Tech stack?
   → Backend: Node.js 18+, Express 4
   → Database: PostgreSQL 14
   → Auth: JWT, bcrypt

5. Analyze codebase?
   → Yes
```

**Codebase Analysis**:
```
✅ Current stack: Express 4, PostgreSQL 14, JWT already in use
✅ Pattern: MVC architecture
✅ Exists: Basic auth middleware
📋 Recommendation: Extend, don't rewrite
```

**Generated PRD**:
```markdown
# User Authentication System

## Overview
Implement complete user authentication system with JWT, 
refresh tokens and password recovery for existing project.

## Goals
1. Provide secure authentication via JWT
2. Implement session management with refresh tokens
3. Enable secure password recovery via email

## Features

### Core Features
1. **User Registration** - Account creation with validation
2. **JWT Login** - Authentication with access tokens
3. **Refresh Tokens** - Automatic session renewal
4. **Password Recovery** - Password reset via email

## Technical Stack

### Backend
- Node.js 18+
- Express 4
- jsonwebtoken@9.0.2
- bcrypt@5.1.1

### Database
- PostgreSQL 14
- Prisma ORM 5.0

### Email
- Nodemailer 6.9

## API Endpoints
- POST /api/auth/register - Create account
- POST /api/auth/login - Login and get tokens
- POST /api/auth/refresh - Renew access
- POST /api/auth/forgot-password - Request reset
- POST /api/auth/reset-password - Reset password

## Database Schema
### users table
- id (UUID, PK)
- email (string, unique)
- password_hash (string)
- created_at (timestamp)

### refresh_tokens table
- id (UUID, PK)
- user_id (UUID, FK)
- token (string, unique)
- expires_at (timestamp)

## Non-Functional Requirements
### Security
- Passwords: min 12 chars, 1 uppercase, 1 number, 1 special
- JWT: 15min access, 7d refresh
- HTTPS-only cookies
- Rate limiting: 5 attempts/min

### Performance
- Token generation < 100ms
- DB queries optimized with indexes
```

**Output**:
```
✅ PRD created successfully!

📁 Saved to: .taskmaster/docs/user-auth-prd.md

📊 Statistics:
- 4 Features
- 5 API Endpoints
- 2 Database Tables
- 4 Non-Functional Requirements

🔗 Suggested next step:
   Execute `/wb-parse-prd` to generate tasks from this PRD
```

