---
description: Expand complex task into detailed subtasks for implementation
---

# Expand Task

## Purpose

This command breaks a complex task into detailed and actionable subtasks, facilitating implementation and progress tracking.

## When to Use

✅ **Use this command when**:
- Task has high complexity (score ≥5 in analysis)
- Task seems vague or too broad
- Needs detailed step-by-step implementation
- Task blocks other tasks

❌ **Don't use when**:
- Task is already specific and clear
- Complexity score < 5
- Is a simple and straightforward implementation

## Execution Process

### 1. Information Collection

**Ask the user**:

1. **Task ID**
   - "What is the ID of the task to expand?"
   - Example: "5" for Task 5

2. **Use complexity report?**
   - "Use existing complexity report? (if available)"
   - **Yes**: Uses subtask recommendation from report
   - **No**: Uses default number or asks

3. **Number of subtasks** (if not using report)
   - "How many subtasks? (or leave empty for auto)"
   - Auto: based on own complexity analysis
   - Manual: specific number (ex: 6 subtasks)

4. **Use research mode?**
   - "Use research mode for implementation?"
   - **Yes**: Searches for current best practices
   - **No**: Uses standard knowledge

5. **Additional context?**
   - "Any additional context about the task?"
   - Example: "Use current pad-lib", "Integrate with API X"

### 2. Carregar Task e Contexto

**Carregar task**:
```javascript
// Exemplo
const task = {
  id: 5,
  title: "Create Login Endpoint with JWT",
  description: "Implement POST /api/auth/login with JWT token generation.",
  status: "pending",
  dependencies: [3],
  priority: "high",
  details: "1. Create login endpoint\n2. Verify email exists\n3. Compare password with hash\n4. Generate access + refresh tokens\n5. Set refreshToken in httpOnly cookie\n6. Return accessToken and user data",
  testStrategy: "Test successful login, test invalid credentials, test token in cookie, test rate limiting"
};
```

**Verificar complexity report** (se disponível):
- Procura `.taskmaster/reports/task-complexity-report.json`
- Encontra entry para task.id
- Usa `recommendedSubtasks` e `expansionPrompt`

### 3. Determinar Número de Subtasks

**Cenário 1**: Complexity report disponível
```javascript
// Usar do relatório
const subtaskCount = analysisEntry.recommendedSubtasks;
const expansionPrompt = analysisEntry.expansionPrompt;
```

**Cenário 2**: Manual ou Auto
```javascript
// Análise própria da complexidade
// Baseado em:
// - Tamanho do campo "details" 
// - Número de steps mencionados
// - Prioridade e complexidade aparente
const subtaskCount = estimateSubtaskCount(task);
```

### 4. Expansão da Task

**Aplicar prompt de expansão**:

Seguir: [@ai_knowledge_base/task-master/prompts/expand-task-prompt.md](mdc:modules/capabilities/task-master/prompts/expand-task-prompt.md)

**⚠️ CRÍTICO**: IDs de subtasks DEVEM ser sequenciais começando de `{{nextSubtaskId}}`

Seguir: [@ai_knowledge_base/task-master/task-expansion/subtask-generation-rules.md](mdc:modules/capabilities/task-master/task-expansion/subtask-generation-rules.md)

**Prompt System**:
```
You are an AI assistant helping with task breakdown. Generate exactly {{subtaskCount}} subtasks based on the provided context.

**CRITICAL**: Each subtask must include ALL of the following fields:
- id: MUST be sequential integers starting EXACTLY from {{nextSubtaskId}}. First subtask id={{nextSubtaskId}}, second id={{nextSubtaskId}}+1, etc. DO NOT use any other numbering pattern!
- title: A clear, actionable title (5-200 characters)
- description: A detailed description (minimum 10 characters)
- dependencies: An array of subtask IDs this subtask depends on (can be empty [])
- details: Implementation details (minimum 20 characters)
- status: Must be "pending" for new subtasks
- testStrategy: Testing approach (can be null)

{{#if useResearch}}
## Research Mode Enabled
Research current best practices for implementing {{taskTitle}}.
Consider latest versions, security recommendations, and modern patterns.
{{/if}}

{{#if hasCodebaseAnalysis}}
## Codebase Analysis Context
Analyze existing code patterns before generating subtasks.
Project Root: {{projectRoot}}
{{/if}}

{{#if expansionPrompt}}
{{expansionPrompt}}
{{/if}}
```

**Prompt User**:
```
Break down the following task into exactly {{subtaskCount}} subtasks:

Parent Task:
ID: {{task.id}}
Title: {{task.title}}
Description: {{task.description}}
Details: {{task.details}}

{{#if expansionPrompt}}
Expansion Guidance:
{{expansionPrompt}}
{{/if}}

{{#if additionalContext}}
Additional Context:
{{additionalContext}}
{{/if}}

Generate exactly {{subtaskCount}} subtasks with sequential IDs starting from {{nextSubtaskId}}.
```

### 5. Validação das Subtasks

**Verificar cada subtask**:
- ✅ ID sequencial correto (começando de nextSubtaskId)
- ✅ Todos campos obrigatórios preenchidos
- ✅ Dependencies válidas (só IDs de subtasks desta task)
- ✅ Details acionáveis e específicos
- ✅ TestStrategy definido (ou null explicitamente)
- ✅ Nenhum ID duplicado

**Regras críticas de IDs**:
```javascript
// ✅ CORRETO
subtask.id = 1  // primeiro subtask
subtask.id = 2  // segundo subtask
subtask.id = 3  // terceiro subtask

// ❌ INCORRETO - NUNCA FAZER
subtask.id = 5.1  // NÃO usar parent ID
subtask.id = 0    // NÃO começar de zero
subtask.id = 3    // Pular números (se nextSubtaskId=1)
```

### 6. Salvar Subtasks

**Atualizar task**:
- Adicionar array de subtasks à task
- Preservar tasks existentes
- Salvar tasks.json

### 7. Output

**Apresentar resultado**:

```markdown
✅ Task expandida com sucesso!

📋 Task: {{task.title}}

📊 Subtasks geradas: {{count}}

### Subtasks:
1. [{{subtasks.0.id}}] {{subtasks.0.title}}
   Dependencies: {{subtasks.0.dependencies}}
   Status: {{subtasks.0.status}}

2. [{{subtasks.1.id}}] {{subtasks.1.title}}
   ...

🔗 Próximos passos:
   1. Execute `/wb-list` para ver todas as tasks
   2. Execute `/wb-next` para ver próxima task a trabalhar
   3. Comece com subtask {{firstSubtaskId}} (sem dependencies)
```

## Regras de Referência

**Regras Principais**:
- [@ai_knowledge_base/task-master/prompts/expand-task-prompt.md](mdc:modules/capabilities/task-master/prompts/expand-task-prompt.md)
- [@ai_knowledge_base/task-master/task-expansion/subtask-generation-rules.md](mdc:modules/capabilities/task-master/task-expansion/subtask-generation-rules.md)

**Workflows**:
- [@ai_knowledge_base/task-master/task-expansion/complexity-analysis.md](mdc:modules/capabilities/task-master/task-expansion/complexity-analysis.md)

## Exemplo de Uso

**Comando**: `/wb-expand-task`

**Perguntas e Respostas**:
```
1. ID da task?
   → 5

2. Usar complexity report?
   → Sim

3. Research mode?
   → Sim

4. Contexto adicional?
   → vazio
```

**Task carregada**:
```json
{
  "id": 5,
  "title": "Create Login Endpoint with JWT",
  "description": "Implement POST /api/auth/login with JWT token generation.",
  "status": "pending",
  "dependencies": [3],
  "priority": "high",
  "details": "1. Create login endpoint\n2. Verify email exists\n3. Compare password with hash\n4. Generate access + refresh tokens\n5. Set refreshToken in httpOnly cookie",
  "testStrategy": "..."
}
```

**Complexity Report Entry**:
```json
{
  "taskId": 5,
  "recommendedSubtasks": 7,
  "expansionPrompt": "Break into: Validate input, Verify credentials, Compare password hash, Generate tokens, Set cookies, Handle errors, Add rate limiting"
}
```

**Subtasks Geradas**:
```json
{
  "subtasks": [
    {
      "id": 1,
      "title": "Validate Login Input",
      "description": "Validate email format and password presence before processing.",
      "status": "pending",
      "dependencies": [],
      "priority": "high",
      "details": "1. Extract email and password from request body\n2. Validate email format (regex)\n3. Check password exists and not empty\n4. Return 400 error if invalid",
      "testStrategy": "Test with invalid email, missing password, empty fields"
    },
    {
      "id": 2,
      "title": "Verify User Exists in Database",
      "description": "Query database to verify user exists before password check.",
      "status": "pending",
      "dependencies": [1],
      "priority": "high",
      "details": "1. Query database for user with email\n2. Use Prisma findUnique({ where: { email } })\n3. Check if user exists\n4. Return 401 if user not found",
      "testStrategy": "Test with non-existent user, test database query performance"
    },
    {
      "id": 3,
      "title": "Compare Password with Hash",
      "description": "Use bcrypt to verify password matches stored hash.",
      "status": "pending",
      "dependencies": [2],
      "priority": "high",
      "details": "1. Extract password_hash from user\n2. Use bcrypt.compare(password, password_hash)\n3. Return 401 if password doesn't match\n4. Proceed if match",
      "testStrategy": "Test with correct password, test with wrong password, test timing attacks"
    },
    {
      "id": 4,
      "title": "Generate Access and Refresh Tokens",
      "description": "Generate JWT tokens with proper expiry and payload.",
      "status": "pending",
      "dependencies": [3],
      "priority": "high",
      "details": "1. Import jsonwebtoken\n2. Generate accessToken (15min, userId payload)\n3. Generate refreshToken (7d, userId payload)\n4. Return both tokens",
      "testStrategy": "Verify token structure, verify payload, test expiry"
    },
    {
      "id": 5,
      "title": "Set Refresh Token in httpOnly Cookie",
      "description": "Store refresh token securely in httpOnly cookie.",
      "status": "pending",
      "dependencies": [4],
      "priority": "high",
      "details": "1. Use res.cookie() with options:\n   - httpOnly: true\n   - secure: true (production)\n   - sameSite: 'strict'\n   - maxAge: 7 days\n2. Set refreshToken value",
      "testStrategy": "Verify cookie is set, verify httpOnly flag, verify secure flag"
    },
    {
      "id": 6,
      "title": "Return Tokens and User Data",
      "description": "Send access token and user data in response.",
      "status": "pending",
      "dependencies": [4, 5],
      "priority": "high",
      "details": "1. Return JSON with accessToken\n2. Include user data (id, email, role)\n3. Exclude password_hash\n4. Status code 200",
      "testStrategy": "Verify response format, verify user data, verify no password in response"
    },
    {
      "id": 7,
      "title": "Add Error Handling and Rate Limiting",
      "description": "Implement error handling and rate limiting for login endpoint.",
      "status": "pending",
      "dependencies": [6],
      "priority": "medium",
      "details": "1. Wrap in try-catch\n2. Return 401 for invalid credentials\n3. Add express-rate-limit (5 attempts/min)\4. Log failed attempts\n5. Handle database errors",
      "testStrategy": "Test error handling, test rate limiting (6 attempts), test timeout"
    }
  ]
}
```

**Output**:
```
✅ Task 5 expandida com sucesso!

📋 Task: Create Login Endpoint with JWT

📊 Subtasks geradas: 7

### Subtasks:
1. [1] Validate Login Input (no deps)
2. [2] Verify User Exists in Database (depends on 1)
3. [3] Compare Password with Hash (depends on 2)
4. [4] Generate Access and Refresh Tokens (depends on 3)
5. [5] Set Refresh Token in httpOnly Cookie (depends on 4)
6. [6] Return Tokens and User Data (depends on 4, 5)
7. [7] Add Error Handling and Rate Limiting (depends on 6)

🔗 Próximo passo:
   Comece com subtask 1.1 (sem dependencies)
```

