# Auditoria de Documentação - Tax Virtual Office

**Data da Análise**: 2025-01-16  
**Escopo**: Verificação de consistência entre documentação (arquivos `.md`) e código implementado

## Resumo Executivo

Foram identificadas **8 discrepâncias principais** entre a documentação e o código implementado:

1. ✅ **Modelos de AI**: Documentação menciona modelos que podem não existir (`gpt-5.1`, `gpt-5.1-pro`)
2. ✅ **Vector Stores**: Documentação descreve estrutura antiga vs. nova estrutura implementada
3. ✅ **Ferramentas MCP**: Algumas ferramentas mencionadas não estão implementadas
4. ✅ **Fluxos de Trabalho**: Alguns detalhes de implementação diferem da documentação
5. ✅ **Limitações Conhecidas**: Algumas limitações documentadas foram resolvidas
6. ✅ **Estrutura de Respostas**: Formato de resposta documentado vs. implementado
7. ✅ **Configuração de Agentes**: Detalhes de configuração podem estar desatualizados
8. ✅ **Exemplos de Código**: Alguns exemplos não refletem a implementação atual

---

## 1. Modelos de AI

### Discrepância

**Documentação** (`docs/AGENTS.md`):
- Menciona modelos `gpt-5.1` e `gpt-5.1-pro` para todos os agentes
- Especialista de legislação usa `gpt-5.1-pro`
- Uploader usa `4o-mini`

**Código Implementado** (`agents/agents.yaml`):
- Todos os agentes configurados com `gpt-5.1` ou `gpt-5.1-pro`
- Uploader configurado com `4o-mini`

**Status**: ⚠️ **POTENCIAL PROBLEMA**

**Análise**:
- Os modelos `gpt-5.1` e `gpt-5.1-pro` podem não existir na API da OpenAI
- A documentação menciona que `invokeSpecialist()` usa modelo hardcoded `gpt-4o-mini`, mas o código atual usa `createOpenAIAgent()` que lê do registry
- A documentação em `docs/AGENTS.md` linha 606-616 menciona uma limitação que pode não ser mais válida

**Recomendação**:
1. Verificar se os modelos `gpt-5.1` e `gpt-5.1-pro` existem na API da OpenAI
2. Se não existirem, atualizar `agents.yaml` e documentação para modelos válidos (ex: `gpt-4o`, `gpt-4o-mini`)
3. Remover ou atualizar a seção "Limitações Conhecidas" em `docs/AGENTS.md` sobre modelo hardcoded

---

## 2. Vector Stores - Estrutura Antiga vs. Nova

### Discrepância

**Documentação Antiga** (`docs/AGENTS.md` linhas 205-228):
- Menciona apenas 5 vector stores:
  - `legislacao-nacional-ibs-cbs-is`
  - `normas-tecnicas-nfe-nfce-cte`
  - `documentos-estaduais-ibc-cbs`
  - `jurisprudencia-tributaria`
  - `legis-nfe-exemplos-xml`

**Documentação Nova** (`docs/VECTOR_STORES.md`):
- Descreve estrutura completa com 30+ vector stores organizados por categoria
- Inclui tabelas compartilhadas, específicas, normas técnicas, manuais, etc.

**Código Implementado** (`agents/vectorstores.yaml`):
- Contém 30 vector stores organizados por categoria
- Estrutura alinhada com `docs/VECTOR_STORES.md`

**Status**: ✅ **DOCUMENTAÇÃO DESATUALIZADA**

**Análise**:
- `docs/AGENTS.md` ainda menciona a estrutura antiga de vector stores
- `docs/VECTOR_STORES.md` está atualizado e correto
- O código está alinhado com `docs/VECTOR_STORES.md`

**Recomendação**:
1. Atualizar `docs/AGENTS.md` seção "Vector Stores" (linhas 205-228) para referenciar `docs/VECTOR_STORES.md`
2. Remover lista detalhada de vector stores de `docs/AGENTS.md` e manter apenas referência
3. Atualizar exemplos em `docs/AGENTS.md` para usar os novos IDs de vector stores

---

## 3. Ferramentas MCP - Implementação vs. Documentação

### Discrepância

**Documentação** (`docs/AGENTS.md` linhas 229-280):
- Lista 10 ferramentas MCP:
  1. `file-search` ✅
  2. `web` ✅
  3. `http-fetch` ✅
  4. `http-download` ✅
  5. `kv-state` ⚠️
  6. `vector-stores-metadata` ✅
  7. `file-search-upload` ⚠️
  8. `storage` ⚠️
  9. `logger` ✅
  10. `task-queue` ⚠️

**Código Implementado**:
- `file-search`: ✅ Implementado em `src/mcp/fileSearchTool.ts`
- `web`: ✅ Implementado em `src/agents/tools.ts` (parcial - placeholder)
- `http-fetch`: ✅ Implementado em `src/mcp/httpFetchTool.ts`
- `http-download`: ⚠️ Não encontrado como MCP tool separado (usado via `httpFetch`)
- `kv-state`: ⚠️ Não encontrado como MCP tool (estado gerenciado em `portal-state.json`)
- `vector-stores-metadata`: ✅ Implementado em `src/mcp/vectorStoresMetadataTool.ts`
- `file-search-upload`: ⚠️ Não encontrado
- `storage`: ⚠️ Não encontrado como MCP tool (salvamento direto em `maintenance.ts`)
- `logger`: ✅ Implementado em `src/agents/tools.ts`
- `task-queue`: ⚠️ Não encontrado

**Status**: ⚠️ **FERRAMENTAS NÃO IMPLEMENTADAS**

**Análise**:
- Algumas ferramentas mencionadas na documentação não existem como MCP tools
- Funcionalidades podem estar implementadas de forma diferente (ex: `storage` é feito diretamente em `uploadDocument()`)
- `web` tool está implementado mas é um placeholder

**Recomendação**:
1. Atualizar `docs/AGENTS.md` para refletir quais ferramentas são realmente MCP tools vs. funcionalidades internas
2. Documentar que `http-download`, `kv-state`, `storage` são funcionalidades internas, não MCP tools
3. Remover ou marcar como "planejado" ferramentas não implementadas (`file-search-upload`, `task-queue`)
4. Completar implementação do `web` tool ou documentar como placeholder

---

## 4. Fluxos de Trabalho - Detalhes de Implementação

### Discrepância 1: Classificação de Documentos

**Documentação** (`docs/AGENTS.md` linhas 153-188):
- Menciona que o classifier usa heurísticas e `vector-stores-metadata`
- Não menciona uso de agente LLM

**Código Implementado** (`src/agents/maintenance.ts` linhas 109-165):
- `classifyDocument()` primeiro tenta usar agente LLM (`invokeClassifierAgent`)
- Fallback para heurísticas se o agente falhar

**Status**: ⚠️ **DOCUMENTAÇÃO INCOMPLETA**

**Recomendação**:
1. Atualizar `docs/AGENTS.md` para mencionar que o classifier usa agente LLM primeiro
2. Documentar o fallback para heurísticas

### Discrepância 2: Upload de Documentos

**Documentação** (`docs/AGENTS.md` linhas 189-204):
- Menciona que o uploader usa `http-download`, `file-search-upload`, `storage`
- Não menciona que usa `httpFetch` diretamente

**Código Implementado** (`src/agents/maintenance.ts` linhas 267-298):
- `uploadDocument()` usa `httpFetch` diretamente (não `http-download`)
- Salva arquivo diretamente (não usa MCP tool `storage`)
- Não usa `file-search-upload`

**Status**: ⚠️ **DOCUMENTAÇÃO DESATUALIZADA**

**Recomendação**:
1. Atualizar `docs/AGENTS.md` para refletir implementação real
2. Documentar que `uploadDocument()` usa `httpFetch` e salva diretamente

---

## 5. Limitações Conhecidas - Resolvidas

### Discrepância

**Documentação** (`docs/AGENTS.md` linhas 603-616):
- Menciona limitação: "Modelo Hardcoded em invokeSpecialist"
- Diz que especialistas sempre usam `gpt-4o-mini` ignorando configuração

**Código Implementado**:
- `src/agents/coordinator.ts` e `src/workflows/user-query.ts` não usam `invokeSpecialist()`
- Usam `createOpenAIAgent()` que lê do registry
- Não há mais modelo hardcoded

**Status**: ✅ **LIMITAÇÃO RESOLVIDA**

**Recomendação**:
1. Remover ou atualizar seção "Limitações Conhecidas" em `docs/AGENTS.md`
2. Marcar como resolvida ou remover completamente

---

## 6. Estrutura de Respostas

### Discrepância

**Documentação** (`docs/AGENTS.md` linhas 406-424):
- Descreve formato de resposta estruturado com seções markdown
- Menciona "Resumo de alto nível", "Análise técnica detalhada", etc.

**Código Implementado** (`src/agents/coordinator.ts` linhas 42-52):
- Retorna apenas `answer` (string), `plan`, `sources`, `agentTraces`
- Não estrutura a resposta em seções markdown

**Status**: ⚠️ **DOCUMENTAÇÃO DESCREVE COMPORTAMENTO ESPERADO, NÃO IMPLEMENTADO**

**Análise**:
- A documentação descreve o formato ideal de resposta
- O código atual retorna resposta simples
- O agente LLM pode estruturar a resposta, mas não é garantido

**Recomendação**:
1. Clarificar que a estrutura documentada é o formato esperado/ideal
2. Adicionar nota de que a estruturação depende do prompt do agente
3. Ou atualizar código para garantir estruturação

---

## 7. Configuração de Agentes

### Discrepância

**Documentação** (`docs/AGENTS.md` linhas 348-369):
- Descreve estrutura de `agents.yaml` corretamente
- Menciona cache em memória

**Código Implementado** (`src/agents/registry.ts`):
- Implementação alinhada com documentação
- Cache funciona como descrito

**Status**: ✅ **CONSISTENTE**

**Sem ação necessária**

---

## 8. Exemplos de Código

### Discrepância

**Documentação** (`docs/AGENTS.md` linhas 480-512):
- Exemplo mostra uso de `createOpenAIAgent()` e `run()`
- Exemplo está correto

**Código Implementado**:
- Alinhado com exemplo

**Status**: ✅ **CONSISTENTE**

**Sem ação necessária**

---

## 9. Documentação de Vector Stores

### Status

**Documentação** (`docs/VECTOR_STORES.md`):
- ✅ Completa e atualizada
- ✅ Alinhada com `agents/vectorstores.yaml`
- ✅ Descreve classificação corretamente

**Código Implementado**:
- ✅ Alinhado com documentação

**Status**: ✅ **CONSISTENTE**

**Sem ação necessária**

---

## 10. Documentação de Workflows

### Status

**Documentação** (`docs/WORKFLOWS.md`):
- ✅ Descreve fluxos corretamente
- ✅ Alinhada com implementação
- ✅ Exemplos de requisições corretos

**Código Implementado**:
- ✅ Alinhado com documentação

**Status**: ✅ **CONSISTENTE**

**Sem ação necessária**

---

## 11. Documentação de Testes

### Status

**Documentação** (`docs/TESTING.md`):
- ✅ Descreve testes corretamente
- ✅ Exemplos de uso válidos
- ✅ Alinhada com estrutura do projeto

**Status**: ✅ **CONSISTENTE**

**Sem ação necessária**

---

## 12. README.md

### Status

**Documentação** (`README.md`):
- ✅ Descreve estrutura do projeto corretamente
- ✅ Menciona endpoints básicos
- ✅ Alinhada com implementação

**Status**: ✅ **CONSISTENTE**

**Sem ação necessária**

---

## Resumo de Ações Recomendadas

### Prioridade Alta

1. **Verificar modelos de AI** (`gpt-5.1`, `gpt-5.1-pro`)
   - Arquivo: `agents/agents.yaml`, `docs/AGENTS.md`
   - Ação: Validar se modelos existem ou atualizar para modelos válidos

2. **Atualizar seção Vector Stores em AGENTS.md**
   - Arquivo: `docs/AGENTS.md` linhas 205-228
   - Ação: Referenciar `docs/VECTOR_STORES.md` e remover lista desatualizada

3. **Atualizar documentação de ferramentas MCP**
   - Arquivo: `docs/AGENTS.md` linhas 229-280
   - Ação: Clarificar quais são MCP tools vs. funcionalidades internas

### Prioridade Média

4. **Atualizar limitações conhecidas**
   - Arquivo: `docs/AGENTS.md` linhas 603-616
   - Ação: Remover ou atualizar limitação sobre modelo hardcoded

5. **Documentar classificação com LLM**
   - Arquivo: `docs/AGENTS.md` linhas 153-188
   - Ação: Adicionar informação sobre uso de agente LLM

6. **Atualizar documentação de upload**
   - Arquivo: `docs/AGENTS.md` linhas 189-204
   - Ação: Refletir implementação real (httpFetch, salvamento direto)

### Prioridade Baixa

7. **Clarificar estrutura de respostas**
   - Arquivo: `docs/AGENTS.md` linhas 406-424
   - Ação: Notar que estruturação depende do prompt do agente

---

## Conclusão

A documentação está **majoritariamente consistente** com o código implementado. As principais discrepâncias são:

1. **Modelos de AI**: Necessário validar se `gpt-5.1` e `gpt-5.1-pro` existem
2. **Vector Stores**: `docs/AGENTS.md` precisa ser atualizado para refletir nova estrutura
3. **Ferramentas MCP**: Algumas ferramentas mencionadas não são MCP tools, são funcionalidades internas
4. **Limitações**: Algumas limitações documentadas foram resolvidas

A documentação em `docs/VECTOR_STORES.md`, `docs/WORKFLOWS.md`, `docs/TESTING.md` e `README.md` está **correta e atualizada**.

---

**Próximos Passos**:
1. Validar modelos de AI com a API da OpenAI
2. Atualizar `docs/AGENTS.md` conforme recomendações acima
3. Revisar e atualizar exemplos de código se necessário
