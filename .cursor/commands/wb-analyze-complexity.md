---
description: Analyze task complexity to determine which tasks need expansion into subtasks
---

# Analyze Complexity

## Purpose

This command analyzes existing tasks and determines which need to be expanded into subtasks based on complexity (score 1-10) and provides recommendations on how many subtasks each task should have.

## When to Use

✅ **Use this command when**:
- Just parsed a PRD and generated tasks
- Tasks seem vague or too complex
- Want to identify which tasks need breakdown
- Preparing to expand tasks into subtasks

❌ **Don't use when**:
- Tasks are already well detailed
- Project is very simple

## Execution Process

### 1. Information Collection

**Ask the user**:

1. **Tag to analyze**
   - "Which tag to analyze? (master or other)"
   - Default: master

2. **Complexity threshold**
   - "Minimum threshold to expand? (1-10, default: 5)"
   - Tasks with score ≥ threshold are recommended for expansion

3. **Use research for analysis?**
   - "Use research mode for more accurate analysis?"
   - **Yes**: Considers current best practices
   - **No**: Analysis based on standard complexity

### 2. Complexity Analysis

**Apply analysis prompt**:

Follow: [@ai_knowledge_base/task-master/prompts/analyze-complexity-prompt.md](mdc:modules/capabilities/task-master/prompts/analyze-complexity-prompt.md)

**Prompt System**:
```
You are an AI assistant specialized in analyzing software development task complexity. Analyze each task and provide a complexity score (1-10) with detailed reasoning.

**Complexity Analysis Schema**:
{
  "taskId": number,
  "taskTitle": string,
  "complexityScore": number,  // 1-10
  "recommendedSubtasks": number,
  "expansionPrompt": string,  // Guidance for expansion
  "reasoning": string  // Detailed explanation
}

**Scoring Guidelines**:
- 1-3: Simple, straightforward, 1 person can do quickly
- 4-6: Moderate, some planning needed, may need a few subtasks
- 7-8: Complex, requires detailed breakdown, should have 5-8 subtasks
- 9-10: Very complex, needs significant subtask expansion, 8-12 subtasks

**For each task, provide**:
1. Complexity score with justification
2. Recommended number of subtasks (0 if simple enough)
3. Specific guidance for subtask breakdown
4. Detailed reasoning

{{#if useResearch}}
## Research Mode Enabled
Consider current best practices and industry standards when assessing complexity.
{{/if}}
```

**Prompt User**:
```
Analyze these tasks for complexity:

{{tasksList}}

{{#if useResearch}}
Remember to consider current best practices in your analysis.
{{/if}}
```

### 3. Generate Complexity Report

**Expected Output** (JSON):
```json
{
  "analysis": [
    {
      "taskId": 1,
      "taskTitle": "Setup Prisma with PostgreSQL",
      "complexityScore": 4,
      "recommendedSubtasks": 3,
      "expansionPrompt": "Break into: Install dependencies, Configure connection, Run migrations",
      "reasoning": "Moderate complexity. Requires 3 distinct steps: installation, configuration, and migration setup."
    },
    {
      "taskId": 5,
      "taskTitle": "Create Login Endpoint with JWT",
      "complexityScore": 7,
      "recommendedSubtasks": 6,
      "expansionPrompt": "Break into: Validate input, Verify credentials, Generate tokens, Set cookies, Handle errors, Add rate limiting",
      "reasoning": "High complexity. Involves multiple steps: validation, authentication, token generation, security, error handling, and rate limiting. Needs detailed breakdown."
    }
  ]
}
```

### 4. Identify Tasks to Expand

**Filter by threshold**:
- Score ≥ threshold → EXPAND
- Score < threshold → Keep as is

**Prioritize expansion**:
1. High priority tasks first
2. Foundation tasks (1-5)
3. Complex tasks that block others
4. Advanced features last

### 5. Save Complexity Report

**Location**:
```
.taskmaster/reports/task-complexity-report.json
// ou
.taskmaster/reports/task-complexity-report_{{tag}}.json
```

**Format**:
```json
{
  "generatedAt": "2024-01-15T10:30:00Z",
  "tag": "master",
  "threshold": 5,
  "tasksAnalyzed": 7,
  "recommendedForExpansion": 4,
  "analysis": [...]
}
```

### 6. Output

**Present formatted report**:

```markdown
## Complexity Report

📊 Tasks analyzed: {{count}}

### Tasks Recommended for Expansion (≥{{threshold}})
{{#each highComplexityTasks}}
- [Task {{id}}] {{title}}
  - Complexity: {{score}}/10
  - Suggested subtasks: {{subtasks}}
  - Reason: {{reasoning}}
{{/each}}

### Appropriate Tasks (<{{threshold}})
{{#each lowComplexityTasks}}
- [Task {{id}}] {{title}} ({{score}}/10)
{{/each}}

### Recommendations
1. Expand tasks with score ≥{{threshold}}
2. Priority: {{#each byPriority}}{{id}}, {{/each}}
3. Total estimated subtasks: ~{{totalSubtasks}}

🔗 Next step:
   Execute `/wb-expand-task --id={{firstId}}` to start expansion
```

## Reference Rules

**Main Rules**:
- [@ai_knowledge_base/task-master/prompts/analyze-complexity-prompt.md](mdc:modules/capabilities/task-master/prompts/analyze-complexity-prompt.md)
- [@ai_knowledge_base/task-master/task-expansion/complexity-analysis.md](mdc:modules/capabilities/task-master/task-expansion/complexity-analysis.md)

**Workflows**:
- [@ai_knowledge_base/task-master/workflows/complete-workflow.md](mdc:modules/capabilities/task-master/workflows/complete-workflow.md)

## Usage Example

**Command**: `/wb-analyze-complexity`

**Questions and Answers**:
```
1. Tag?
   → master

2. Threshold?
   → 5

3. Research mode?
   → Yes
```

**Analysis Executed** (example):
```json
{
  "analysis": [
    {
      "taskId": 1,
      "taskTitle": "Setup Prisma with PostgreSQL",
      "complexityScore": 4,
      "recommendedSubtasks": 3,
      "expansionPrompt": "Break into: Install Prisma and setup, Create schema.prisma, Run migrations",
      "reasoning": "Moderate complexity. Simple setup requires 3 distinct steps but straightforward."
    },
    {
      "taskId": 5,
      "taskTitle": "Create Login Endpoint with JWT",
      "complexityScore": 8,
      "recommendedSubtasks": 7,
      "expansionPrompt": "Break into: Validate email and password, Check user exists, Compare hashed password, Generate access token (15min), Generate refresh token (7d), Set refreshToken cookie (httpOnly), Add error handling and rate limiting",
      "reasoning": "High complexity. Involves multiple security checks, token generation, cookie management, error handling, and rate limiting. Needs detailed step-by-step breakdown."
    },
    {
      "taskId": 7,
      "taskTitle": "Implement Password Recovery System",
      "complexityScore": 7,
      "recommendedSubtasks": 6,
      "expansionPrompt": "Break into: Generate secure reset token, Store token with expiry, Send email via Nodemailer, Validate token in reset endpoint, Hash new password, Invalidate used token",
      "reasoning": "High complexity. Password reset requires token generation, secure storage, email delivery, validation, password update, and token invalidation. Multiple moving parts need careful sequencing."
    }
  ]
}
```

**Output**:
```markdown
## Complexity Report

📊 Tasks analyzed: 7

### Tasks Recommended for Expansion (≥5)
- [Task 5] Create Login Endpoint with JWT
  - Complexity: 8/10 🔴
  - Suggested subtasks: 7
  - Reason: High complexity. Multiple security checks, token generation, cookie management
  
- [Task 7] Implement Password Recovery System
  - Complexity: 7/10 🟠
  - Suggested subtasks: 6
  - Reason: Requires token generation, secure storage, email delivery, validation

### Appropriate Tasks (<5)
- [Task 1] Setup Prisma with PostgreSQL (4/10)
- [Task 2] Implement Password Hashing (3/10)
- [Task 3] Implement JWT Token Generation (6/10 - consider)
- [Task 4] Create User Registration Endpoint (6/10 - consider)
- [Task 6] Implement Refresh Token Endpoint (5/10)

### Recommendations
1. Expand tasks with score ≥5: 5 and 7 are priorities
2. Expansion priority:
   - Task 5 (critical path, high complexity)
   - Task 7 (important feature)
   - Task 3, 4 (consider if necessary)
3. Total estimated subtasks: ~19

🔗 Next steps:
   Execute `/wb-expand-task --id=5` to expand login task
   Execute `/wb-expand-task --id=7` to expand password recovery
```

