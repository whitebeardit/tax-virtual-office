---
description: Validate integrity of tasks.json for dependency and schema issues
---

# Validate Tasks

## Purpose

This command validates the integrity of `tasks.json`, checking for circular dependencies, duplicate IDs, schema structure and invalid references.

## When to Use

✅ **Use this command when**:
- Suspect problems in tasks.json structure
- After manual file manipulation
- After merging branches with conflicts
- Before starting development (good practice)
- For periodic project audit

## Execution Process

### 1. Information Collection

**Ask the user**:
1. **Tag to validate**
   - "Which tag to validate? (or 'all' for all tags)"

### 2. Validations Executed

Execute multiple validations on `tasks.json`:

#### Validation 1: Schema Validation

Verify structure of each task according to: [@ai_knowledge_base/task-master/task-generation/task-structure.md](mdc:modules/capabilities/task-master/task-generation/task-structure.md)

**Verify**:
- ✅ All required fields present
- ✅ Correct types (number, string, array)
- ✅ Valid enums (status, priority)
- ✅ No empty fields in required fields
- ✅ Subtasks follow same schema

#### Validation 2: ID Uniqueness

**Verify**:
- ✅ Unique IDs in each tag
- ✅ No duplicate IDs
- ✅ IDs are positive numbers
- ✅ Subtasks IDs independent of parent

#### Validation 3: Dependency Validation

Follow: [@ai_knowledge_base/task-master/task-generation/dependency-management.md](mdc:modules/capabilities/task-master/task-generation/dependency-management.md)

**Verify**:
- ✅ No circular dependency
- ✅ Dependencies reference existing tasks
- ✅ Task doesn't depend on itself
- ✅ Dependencies are valid numbers

**Circular dependency detection algorithm**:
```javascript
function findCircularDependencies(tasks) {
  // DFS para detectar ciclos
  // Retorna lista de dependencies que causam ciclos
}
```

#### Validation 4: Task References

**Verify**:
- ✅ Valid dependencies (point to existing tasks)
- ✅ Valid subtask dependencies (intra-subtasks)
- ✅ No reference to non-existent ID
- ✅ Dependencies never skip beyond highest ID

#### Validation 5: Subtask Structure

**Verify**:
- ✅ Subtask IDs are sequential (1, 2, 3...)
- ✅ Subtask dependencies are valid (only within parent task)
- ✅ Subtasks follow same schema as main tasks
- ✅ No subtask with invalid ID (0, negative, etc.)

### 3. Problem Report

**Categorize problems**:
- **Critical errors**: Block execution (circular deps, duplicate IDs)
- **Warnings**: Problems that may cause issues (deps to non-existent tasks)
- **Info**: Statistics and suggestions (tasks without dependencies, etc.)

**Formato de saída**:
```markdown
## Validação de Tasks

### ✅ Passou: Schema Validation
- Todas tasks têm campos obrigatórios
- Todos tipos estão corretos

### ❌ FALHA: ID Uniqueness
- **Erro**: Tasks com IDs duplicados
- Task 5: ID 5 (duplicado)
- Task 7: ID 5 (duplicado)
- **Ação**: Corrigir IDs manualmente

### ❌ FALHA: Circular Dependencies
- **Erro**: Dependência circular detectada
- Task 3 → depende de Task 5
- Task 5 → depende de Task 8
- Task 8 → depende de Task 3 ← CICLO
- **Ação**: Remover uma das dependencies

### ⚠️ AVISO: Invalid Dependencies
- Task 12: depende de Task 50 (inexistente)
- Task 15: depende de Task 25 (inexistente)
- **Ação**: Corrigir ou remover dependencies inválidas

### ℹ️ INFO: Estatísticas
- Total tasks: 20
- Tasks sem dependencies: 3
- Tasks com 1 dependency: 5
- Tasks com 2+ dependencies: 12
- Tasks com subtasks: 8
- Total subtasks: 35
```

### 4. Sugestões de Correção

**Propor correções** (quando apropriado):
- Remover dependencies inválidas
- Sugerir reordenação de IDs
- Identificar task que quebra ciclo
- Sugerir dependencies alternativas

### 5. Output

**Apresentar resultado**:

**Se sem problemas**:
```markdown
✅ Validação passou sem problemas!

📊 Estatísticas:
- Tasks analisadas: 20
- Subtasks: 35
- Dependencies: 45
- Schema: ✅ Válido
- IDs: ✅ Únicos
- Dependencies: ✅ Sem ciclos
- References: ✅ Todas válidas

🎉 tasks.json está íntegro!
```

**Se com problemas**:
```markdown
❌ Validação encontrou {{count}} problemas

### Problemas Críticos
{{#each criticalErrors}}
- {{description}}
  Localização: Task {{taskId}}
  Ação: {{suggestion}}
{{/each}}

### Avisos
{{#each warnings}}
- {{description}}
  Impacto: {{impact}}
{{/each}}

### Estatísticas
- Tasks: {{total}}
- Válidas: {{valid}}
- Problemáticas: {{invalid}}

🔧 Use `/wb-validate-tasks --fix` (se implementado) ou corrija manualmente
```

## Regras de Referência

**Regras Principais**:
- [@ai_knowledge_base/task-master/task-generation/task-structure.md](mdc:modules/capabilities/task-master/task-generation/task-structure.md)
- [@ai_knowledge_base/task-master/task-generation/dependency-management.md](mdc:modules/capabilities/task-master/task-generation/dependency-management.md)

## Exemplo de Uso

**Comando**: `/wb-validate-tasks`

**Perguntas**:
```
1. Tag a validar?
   → master
```

**Validação Executada**:
```javascript
// Ler tasks.json
const tasks = loadTasks('master');

// Validação 1: Schema
validateSchema(tasks); // ✅ PASS

// Validação 2: IDs
validateIDs(tasks); 
// ❌ FAIL: Task 3 tem ID=3, Task 8 tem ID=3 (duplicado)

// Validação 3: Dependencies
detectCircularDependencies(tasks);
// ❌ FAIL: Task 3→5→8→3 (ciclo)

// Validação 4: References
validateDependencyReferences(tasks);
// ⚠️ WARNING: Task 12 depende de Task 50 (inexistente)

// Validação 5: Subtasks
validateSubtasks(tasks);
// ✅ PASS
```

**Output**:
```markdown
❌ Validação encontrou 3 problemas

### ❌ Problemas Críticos

1. IDs Duplicados
   - Task 3: ID 3
   - Task 8: ID 3 (DUPLICADO)
   - Ação: Renumerar Task 8 para ID 9

2. Dependência Circular
   - Task 3 → Task 5 → Task 8 → Task 3 ← CICLO
   - Ação: Remover Task 5 → Task 8 ou Task 8 → Task 3

### ⚠️ Avisos

3. Dependency Inválida
   - Task 12: depende de Task 50 (inexistente)
   - Impacto: Task 12 nunca será trabalhável
   - Ação: Verificar se Task 50 existe ou remover dependency

### Estatísticas

📊 Análise:
- Total tasks: 20
- Válidas: 17
- Com problemas: 3
- Schema: ✅ OK
- Subtasks: ✅ OK (12 tasks, 32 subtasks)

### Próximos Passos

1. Corrigir ID duplicado (Task 8 → ID 9)
2. Quebrar ciclo (remover Task 8 → Task 3 ou Task 5 → Task 8)
3. Corrigir dependency inválida (Task 12)
4. Executar validação novamente
```

