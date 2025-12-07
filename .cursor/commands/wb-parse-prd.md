---
description: Parse Product Requirements Document into structured development tasks
---

# Parse PRD into Tasks

## Purpose

This command converts a structured PRD (Product Requirements Document) into organized development tasks, with correct dependencies and priorities.

## When to Use

✅ **Use this command when**:
- Already have a complete PRD created
- Want to start structured development
- Need to generate tasks with automatic dependencies
- Working with existing project and need aligned tasks

❌ **Don't use when**:
- Don't have a PRD yet (use `/wb-create-prd` first)
- Working on small feature (use `/wb-add-task` or its `/wb-tm-add-task` alias)

## Execution Process

### 1. Information Collection

**Ask the user**:

1. **PRD file path**
   - "What is the path to the PRD file?"
   - Example: `docs/feature-x-prd.md` or `.taskmaster/docs/user-auth-prd.md`

2. **Analyze codebase?**
   - "Analyze existing codebase for context? (recommended)"
   - **Yes**: Integrates with current architecture
   - **No**: Creates standalone tasks

3. **Use research mode?**
   - "Use research mode for mentioned technologies?"
   - **Yes**: Researches current best practices
   - **No**: Uses standard knowledge

4. **Number of tasks**
   - "How many tasks approximately? (or leave empty for auto)"
   - Auto: based on PRD complexity
   - Manual: specific number (ex: 12 tasks)

### 2. PRD Validation

**Verify**:
- File exists and is readable
- Contains required sections (Overview, Goals, Features, Tech Stack)
- Tech stack specified with details
- Features described clearly

**If PRD incomplete**:
- Suggest necessary edits
- Or ask if you want to proceed anyway

### 3. Codebase Analysis (Optional)

**If user chose analysis**:

Follow workflow: [@ai_knowledge_base/task-master/workflows/codebase-analysis.md](mdc:modules/capabilities/task-master/workflows/codebase-analysis.md)

**Execute**:
1. **Glob**: Map project structure
2. **Grep**: Search for relevant implementations
3. **Read**: Examine key files
4. **Synthesize**: Understand current architecture

**Integrate into context**:
- Add analysis section to prompt
- Identify what already exists
- Adapt tasks for what's missing
- Align with existing patterns

### 4. Research Mode (Optional)

**If user chose research**:

Follow workflow: [@ai_knowledge_base/task-master/workflows/research-integration.md](mdc:modules/capabilities/task-master/workflows/research-integration.md)

**Research**:
1. Technologies mentioned in PRD
2. Latest stable versions
3. Current best practices (2024)
4. Security considerations
5. Recommended patterns

**Include in prompt**:
- Specific library versions
- Modern approaches
- Security precautions
- Known optimizations

### 5. PRD Parsing

**Apply parse prompt**:

Follow: [@ai_knowledge_base/task-master/prompts/parse-prd-prompt.md](mdc:modules/capabilities/task-master/prompts/parse-prd-prompt.md)

**Prompt System** (adaptado do arquivo):
```
You are an AI assistant specialized in analyzing Product Requirements Documents (PRDs) and generating a structured, logically ordered, dependency-aware and sequenced list of development tasks in JSON format.

Analyze the provided PRD content and generate approximately {{numTasks}} top-level development tasks. Each task should represent a logical unit of work needed to implement the requirements.

**IMPORTANT GUIDELINES**:
1. Each task MUST follow the JSON schema exactly
2. Use sequential IDs starting from {{nextId}}
3. Set status to 'pending', initial dependencies to []
4. Assign priority based on criticality
5. Include detailed implementation guidance
6. Specify clear test strategies
7. STRICTLY ADHERE to technologies and versions mentioned in PRD
8. Fill gaps where PRD isn't fully specified
9. Provide most direct implementation path

**Task Schema**:
{
  "id": number,
  "title": string,
  "description": string,
  "status": "pending",
  "dependencies": number[],
  "priority": "high" | "medium" | "low",
  "details": string,
  "testStrategy": string
}

{{#if hasCodebaseAnalysis}}
## Codebase Analysis Context
{{codebaseContext}}
{{/if}}

{{#if useResearch}}
## Research Mode Enabled
Remember to research current best practices before task breakdown.
{{/if}}
```

**Prompt User**:
```
Parse this PRD into approximately {{numTasks}} tasks:

{{prdContent}}

Generate JSON response with "tasks" array following the schema.
```

### 6. Task Validation

**Verify each task**:
- ✅ Sequential ID
- ✅ All required fields filled
- ✅ Valid dependencies (no circular)
- ✅ Appropriate priorities
- ✅ Actionable details
- ✅ TestStrategy defined

**Validate integrity**:
- No duplicate dependencies
- No self-dependency
- No dependency to non-existent task
- Unique IDs

### 7. Save Tasks

**Write to tasks.json**:
- Location: `.taskmaster/tasks/tasks.json`
- Tag: current (or 'master' if first time)
- Preserve existing tasks
- Update metadata

### 8. Output

**Present**:
```markdown
✅ Tasks generated successfully!

📊 Statistics:
- Total tasks: {{count}}
- High priority tasks: {{high}}
- Tasks with dependencies: {{withDeps}}
- Independent tasks: {{noDeps}}

📝 Generated tasks:
1. [Task 1] - {{title}}
2. [Task 2] - {{title}}
...

🔗 Suggested next steps:
1. Execute `/wb-analyze-complexity` to identify complex tasks
2. Execute `/wb-expand-task` to expand tasks into subtasks
3. Execute wb-next to view next task to work on
```

## Reference Rules

**Main Rules**:
- [@ai_knowledge_base/task-master/prompts/parse-prd-prompt.md](mdc:modules/capabilities/task-master/prompts/parse-prd-prompt.md)
- [@ai_knowledge_base/task-master/prd-creation/prd-parsing-rules.md](mdc:modules/capabilities/task-master/prd-creation/prd-parsing-rules.md)

**Workflows**:
- [@ai_knowledge_base/task-master/workflows/codebase-analysis.md](mdc:modules/capabilities/task-master/workflows/codebase-analysis.md) (se usado)
- [@ai_knowledge_base/task-master/workflows/research-integration.md](mdc:modules/capabilities/task-master/workflows/research-integration.md) (se usado)
- [@ai_knowledge_base/task-master/workflows/complete-workflow.md](mdc:modules/capabilities/task-master/workflows/complete-workflow.md)

**Schema**:
- [@ai_knowledge_base/task-master/task-generation/task-structure.md](mdc:modules/capabilities/task-master/task-generation/task-structure.md)

## Exemplo de Uso

**Comando**: `/wb-parse-prd`

**Perguntas e Respostas**:
```
1. Path do PRD?
   → .taskmaster/docs/user-auth-prd.md

2. Analisar codebase?
   → Sim

3. Usar research mode?
   → Sim

4. Número de tasks?
   → (vazio para auto)
```

**Codebase Analysis**:
```
✅ Stack: Express 4, PostgreSQL 14, Prisma
✅ Existe: authMiddleware básico
✅ Pattern: MVC
✅ Versões: jsonwebtoken@9.0.0, bcrypt@5.1.0
```

**Research**:
```
✅ jsonwebtoken@9.0.2 (latest)
✅ bcrypt@5.1.1 com 12 salt rounds
✅ Refresh token pattern 2024
✅ OWASP password requirements
```

**Tasks Geradas** (exemplo):
```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Setup Prisma with PostgreSQL",
      "description": "Configure Prisma ORM with PostgreSQL database and create initial schema.",
      "status": "pending",
      "dependencies": [],
      "priority": "high",
      "details": "Install Prisma 5.0, setup schema with users and refresh_tokens tables, configure connection pooling",
      "testStrategy": "Verify database connection, test Prisma queries, check schema migrations"
    },
    {
      "id": 2,
      "title": "Implement Password Hashing with bcrypt",
      "description": "Create password hashing utilities using bcrypt@5.1.1 with 12 salt rounds.",
      "status": "pending",
      "dependencies": [1],
      "priority": "high",
      "details": "1. Install bcrypt@5.1.1\n2. Create hashPassword function (12 rounds)\n3. Create comparePassword function\n4. Add validation (min 12 chars, 1 uppercase, 1 number, 1 special)\n5. Never store plain passwords",
      "testStrategy": "Unit tests for hashing, test password validation, verify salt rounds"
    },
    {
      "id": 3,
      "title": "Implement JWT Token Generation",
      "description": "Create JWT access and refresh token generation using jsonwebtoken@9.0.2.",
      "status": "pending",
      "dependencies": [2],
      "priority": "high",
      "details": "1. Install jsonwebtoken@9.0.2\n2. Create generateAccessToken (15min expiry, userId payload)\n3. Create generateRefreshToken (7d expiry)\n4. Configure JWT secrets in env\n5. Implement token verification middleware",
      "testStrategy": "Test token generation, verify payload, test expiration, test verification"
    },
    {
      "id": 4,
      "title": "Create User Registration Endpoint",
      "description": "Implement POST /api/auth/register with validation and password hashing.",
      "status": "pending",
      "dependencies": [1, 2],
      "priority": "high",
      "details": "1. Create register endpoint in routes/auth.js\n2. Validate email format and uniqueness\n3. Validate password (12+ chars, complexity)\n4. Hash password with bcrypt\n5. Create user in database\n6. Return user data (without password)\n7. Handle errors (409 if email exists)",
      "testStrategy": "Test valid registration, test duplicate email, test invalid password, test password hash"
    },
    {
      "id": 5,
      "title": "Create Login Endpoint with JWT",
      "description": "Implement POST /api/auth/login with JWT token generation.",
      "status": "pending",
      "dependencies": [3],
      "priority": "high",
      "details": "1. Create login endpoint\n2. Verify email exists\n3. Compare password with hash\n4. Generate access + refresh tokens\n5. Set refreshToken in httpOnly cookie\n6. Return accessToken and user data\n7. Handle invalid credentials\n8. Implement rate limiting (5 attempts/min)",
      "testStrategy": "Test successful login, test invalid credentials, test token in cookie, test rate limiting"
    },
    {
      "id": 6,
      "title": "Implement Refresh Token Endpoint",
      "description": "Create POST /api/auth/refresh to renew access tokens.",
      "status": "pending",
      "dependencies": [5],
      "priority": "medium",
      "details": "1. Extract refreshToken from cookie\n2. Verify refreshToken signature\n3. Check if token exists in database\n4. Generate new access token\n5. Return new accessToken\n6. Rotate refreshToken (optional security boost)",
      "testStrategy": "Test token refresh, test expired refresh token, test invalid refresh token"
    },
    {
      "id": 7,
      "title": "Implement Password Recovery System",
      "description": "Create forgot/reset password functionality with email verification.",
      "status": "pending",
      "dependencies": [3],
      "priority": "medium",
      "details": "1. Create forgotPassword endpoint\n2. Generate secure reset token\n3. Store token with expiry in database\n4. Send email via Nodemailer\n5. Create resetPassword endpoint\n6. Validate token and expiry\n7. Hash new password and update\n8. Invalidate used token",
      "testStrategy": "Test email sending, test token expiry, test password reset, test invalid token handling"
    }
  ]
}
```

**Output**:
```
✅ 7 tasks geradas com sucesso!

📊 Estatísticas:
- Tasks independentes: 1
- Tasks com dependencies: 6
- High priority: 5
- Medium priority: 2

📋 Tasks geradas:
1. Setup Prisma with PostgreSQL
2. Implement Password Hashing
3. Implement JWT Token Generation
4. Create User Registration Endpoint
5. Create Login Endpoint with JWT
6. Implement Refresh Token Endpoint
7. Implement Password Recovery System

🔗 Próximos passos sugeridos:
   Execute `/wb-analyze-complexity` para identificar tasks complexas a expandir
```

