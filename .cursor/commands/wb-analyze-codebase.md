---
description: Analyze existing codebase structure to understand current implementation patterns
---

# Analyze Codebase

## Purpose

This command performs structured analysis of an existing codebase using Cursor's native tools (Glob, Grep, Read) to understand patterns, architecture and current implementations of the project.

## When to Use

✅ **Use this command when**:
- Starting work on an existing project
- Adding features to an established codebase
- Needing to align new tasks with current architecture
- Understanding project patterns and conventions
- Identifying technical debt

❌ **Don't use when**:
- Project is completely new (no code yet)
- Working on project from scratch

## Execution Process

### 1. Information Collection

**Ask the user**:
1. "Specific directories to analyze? (leave empty for complete project analysis)"
2. "File types of interest? (ex: .ts, .js, .py, or leave empty for all)"
3. "Analysis depth?"
   - **Basic**: Directory structure + main types
   - **Complete**: Structure + grep + key file reading

### 2. Structured Analysis

Follow exactly this 3-step workflow:

#### Step 1: Explore Project Structure (Glob)

**Objective**: Understand project organization

**Do**:
1. Executar Glob para mapear estrutura de diretórios
2. Buscar arquivos principais (package.json, README.md, tsconfig.json, etc.)
3. Identificar pattern de organização

**Exemplos de queries Glob**:
```bash
# Análise básica
**/*.js
**/*.ts
**/*.json
**/README.md

# Análise específica
**/src/**/*
**/tests/**/*
**/docs/**/*
```

**O que procurar**:
- Estrutura de diretórios (src/, lib/, tests/, etc.)
- Convenções de nomenclatura
- Tecnologias usadas (JavaScript, TypeScript, Python, etc.)

#### Step 2: Search Existing Implementations (Grep)

**Objetivo**: Encontrar implementações e padrões existentes

**Fazer**:
1. Buscar keywords relevantes ao projeto
2. Identificar frameworks e bibliotecas em uso
3. Encontrar patterns estabelecidos

**Exemplos de queries Grep**:
```bash
# Frameworks
"Express"
"React"
"Vue"

# Patterns
"async function"
"/api/"
"useState"

# Libraries
"mongoose"
"prisma"
"sequelize"
```

**O que procurar**:
- Implementações similares à task sendo analisada
- Padrões e convenções estabelecidas
- Bibliotecas e frameworks em uso
- Padrões arquiteturais (MVC, componentes, etc.)

#### Step 3: Examine Key Files (Read)

**Objetivo**: Entender detalhes de implementação

**Ler**:
- `package.json` - Dependências e scripts
- `README.md` - Documentação do projeto
- Arquivos de configuração principais
- Entry points (`src/index.js`, `src/app.ts`, etc.)
- Arquivos relacionados à task sendo analisada

**O que aprender**:
- Versões de tecnologias usadas
- Convenções do projeto
- Abstrações existentes
- Utilities disponíveis
- Padrões de configuração

### 3. Consolidação

**Sintetizar em relatório estruturado**:

```markdown
## Análise de Codebase

### Stack Tecnológico
- Backend: Node.js 18+, Express 4
- Frontend: React 19, TypeScript 5
- Database: PostgreSQL 16
- ...

### Estrutura de Diretórios
```
src/
├── components/
├── pages/
├── hooks/
└── utils/
```

### Padrões Identificados
- Componentização: Componentes funcionais com hooks
- Estado: Context API + useState
- Routing: React Router v6
- ...

### Convenções
- Nomenclatura: camelCase para variáveis, PascalCase para componentes
- Organização: Feature folders
- ...

### Arquivos-Chave
- `src/index.tsx` - Entry point
- `src/App.tsx` - Componente raiz
- `src/utils/api.ts` - Configuração de API
```

### 4. Identificar Insights

**Responder**:
1. O que já existe?
2. Quais padrões estão estabelecidos?
3. O que está faltando?
4. Como integrar novas features?
5. Qual é a dívida técnica?

### 5. Output

Apresentar ao usuário:
- **Stack tecnológico** identificado
- **Padrões** e convenções encontradas
- **Arquitetura** atual do projeto
- **Recomendações** para alinhamento
- **Próximos passos** sugeridos

## Regras de Referência

**Regra Principal:**
- [@ai_knowledge_base/task-master/workflows/codebase-analysis.md](mdc:modules/capabilities/task-master/workflows/codebase-analysis.md)

**Workflow de Análise:**
1. Glob → mapeia estrutura
2. Grep → encontra patterns
3. Read → examina detalhes
4. Consolidar → sintetiza findings

## Exemplo de Uso

**Comando**: `/wb-analyze-codebase`

**Perguntas ao usuário**:
- "Análise completa do projeto ou diretório específico?"
- "Tipos de arquivos? (.ts, .js, ou todos)"
- "Profundidade? (básica/completa)"

**Execução**:
```bash
# Step 1: Glob
Glob: "**/*.ts" → encontra 45 arquivos TypeScript
Glob: "**/package.json" → encontra configurações

# Step 2: Grep  
Grep: "React" → encontrado em 30 arquivos
Grep: "useState" → usado em 18 arquivos

# Step 3: Read
Read: package.json → React 19, TypeScript 5
Read: src/App.tsx → Estrutura de componentes
Read: src/utils/api.ts → Configuração de API
```

**Output**:
```
## Análise de Codebase Completa

### Tecnologias Identificadas
✅ React 19.0.0 com TypeScript 5.0.0
✅ React Router v6.8.0
✅ Tailwind CSS 3.4.0
✅ TanStack Query v5

### Estrutura
src/
├── components/ (15 componentes)
├── pages/ (8 páginas)
├── hooks/ (5 custom hooks)
└── utils/ (API, helpers)

### Padrões
- Componentes funcionais com hooks
- API centralizada em utils/
- Custom hooks para lógica reutilizável
- Tailwind para estilização

### Recomendações
- Seguir padrão de componentes existente
- Usar hooks customizados disponíveis
- API já configurada, estender conforme necessário
```

