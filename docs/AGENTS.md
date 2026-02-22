# Arquitetura de Agentes - Tax Virtual Office

## Visão Geral

O Tax Virtual Office utiliza uma arquitetura baseada em **agentes especializados** que trabalham em conjunto para processar consultas tributárias e automatizar a ingestão de documentos fiscais. A arquitetura segue o padrão **coordinator-specialist** com ferramentas MCP (Model Context Protocol) para acesso a fontes de dados.

## Tipos de Agentes

### 1. Agente Coordenador (`coordinator`)

**Responsabilidade**: Orquestrar especialistas e ferramentas para responder consultas do usuário.

**Características**:
- **Modelo**: `gpt-5.1`
- **Ferramentas**: `file-search`, `web`, `logger`
- **Prompt**: `agents/prompts/coordinator.system.md`

**Fluxo de Trabalho**:
1. Recebe pergunta do usuário via `/query`
2. Analisa domínio (NF-e, NFC-e, CT-e, IBS/CBS, Misto)
3. Consulta `file-search` em vector stores prioritários
4. Planeja execução com especialistas e ferramentas
5. Aciona especialistas apropriados
6. Consolida respostas com fontes e traces

**Políticas**:
- **SEMPRE** consultar `file-search` antes de responder
- **NUNCA** inventar números de lei, artigos, NTs ou prazos sem base documental
- Explicitar limitações quando não houver base suficiente
- Citar fontes formais (lei, decreto, NT, manual, schema)

**Vector Stores (12 stores por capacidade/família)**:
O coordinator consulta os **12 vector stores** definidos em [docs/VECTOR_STORES.md](VECTOR_STORES.md): `vs_specs_mercadorias`, `vs_specs_transporte`, `vs_schemas_xsd`, `vs_tabelas_fiscais`, `vs_legal_federal`, `vs_legal_confaz`, `vs_legal_estados`, `vs_jurisprudencia`, etc. O coordinator pode delegar ao **Triage/Router** e ao **Source Planner** para classificar a intenção e escolher os stores, e aos **especialistas por capacidade** (spec-mercadorias, spec-transporte, legislacao-ibs-cbs).

#### 1.1. Trusted Sources Enricher (`trusted-sources-enricher`)

**Responsabilidade**: Pós-processar a resposta do coordinator para **enriquecer** com pesquisa restrita a **fontes confiáveis** (ex.: CGIBS e relatório oficial Pré‑CGIBS), mantendo rastreabilidade.

**Características**:
- **Modelo**: `gpt-5.1`
- **Ferramentas**: `file-search`, `web`, `logger`
- **Prompt**: `agents/prompts/trusted-sources-enricher.system.md`

**Como é acionado**:
- Não é handoff do coordinator; é invocado como etapa adicional no workflow (`src/workflows/user-query.ts`) quando a pergunta indica IBS/CBS/CGIBS/reforma tributária (gating determinístico) ou quando a trilha é Legislação.

### 2. Triage/Router e Source Planner

#### 2.1. Triage / Router (`triage-router`)

**Responsabilidade**: Classificar a intenção da pergunta (trilha: Documento, Integração, Legislação, etc.) e definir família + doc_type quando aplicável.

**Características**:
- **Modelo**: `gpt-5.1`
- **Ferramentas**: `vector-stores-metadata`, `logger`
- **Prompt**: `agents/prompts/triage-router.system.md`

#### 2.2. Source Planner (`source-planner`)

**Responsabilidade**: Dado trilha + família + doc_type, indicar quais dos 12 vector stores consultar e em que ordem (primário → secundário).

**Características**:
- **Modelo**: `gpt-5.1`
- **Ferramentas**: `logger`
- **Prompt**: `agents/prompts/source-planner.system.md`

### 3. Especialistas por Capacidade

#### 3.1. Spec Mercadorias (`spec-mercadorias`)
**Responsabilidade**: Especificações NF-e (modelo 55) e NFC-e (modelo 65).

**Características**:
- **Modelo**: `gpt-5.1`
- **Ferramentas**: `file-search`, `logger`
- **Prompt**: `agents/prompts/spec-mercadorias.system.md`

**Vector Stores**: `vs_specs_mercadorias`, `vs_schemas_xsd`, `vs_tabelas_fiscais`, (opcional `vs_legal_confaz`).

#### 3.2. Spec Transporte (`spec-transporte`)
**Responsabilidade**: Especificações CT-e, MDF-e, BP-e.

**Características**:
- **Modelo**: `gpt-5.1`
- **Ferramentas**: `file-search`, `logger`
- **Prompt**: `agents/prompts/spec-transporte.system.md`

**Vector Stores**: `vs_specs_transporte`, `vs_schemas_xsd`, `vs_tabelas_fiscais`, `vs_legal_confaz`.

### 4. Matriz de responsabilidade (objetivo → agente → stores)

- **Dúvidas técnicas NF-e/NFC-e**: spec-mercadorias; stores: `vs_specs_mercadorias`, `vs_schemas_xsd`, `vs_tabelas_fiscais`.
- **Dúvidas técnicas CT-e/MDF-e/BP-e**: spec-transporte; stores: `vs_specs_transporte`, `vs_schemas_xsd`, `vs_tabelas_fiscais`, `vs_legal_confaz`.
- **Reforma tributária (IBS/CBS/IS)**: legislacao-ibs-cbs; stores: `vs_legal_federal`, `vs_tabelas_fiscais`, `vs_jurisprudencia`, `vs_legal_estados`.
- **Dúvidas legais genéricas (ICMS, PIS/COFINS, Convênios, jurisprudência)**: coordinator + source planner; stores: `vs_legal_confaz`, `vs_legal_estados`, `vs_jurisprudencia`, `vs_legal_federal`.
- **Cálculos tributários (alíquotas, CFOP, NCM, base)**: coordinator + source planner; stores: `vs_tabelas_fiscais`, `vs_legal_federal` / `vs_legal_estados` quando regras de cálculo.

Todos os ids são os 12 `vs_*` definidos em [docs/VECTOR_STORES.md](VECTOR_STORES.md) e no contrato com o tax-agent-hub.

### 5. Especialista em Legislação (`legislacao-ibs-cbs`)

**Responsabilidade**: Responder questões sobre reforma tributária (IBS/CBS/IS).

**Características**:
- **Modelo**: `gpt-5.1-pro` (modelo mais avançado)
- **Ferramentas**: `file-search`, `logger`
- **Prompt**: `agents/prompts/legislacao-ibs-cbs.system.md`

**Escopo**:
- EC 132/2023 (Emenda Constitucional da Reforma Tributária)
- LC 214/2025 (Lei Complementar IBS/CBS/IS)
- Transição 2026-2033
- Decretos e regulamentos relacionados
- Impactos sobre documentos fiscais eletrônicos

**Vector Stores**: `vs_legal_federal`, `vs_legal_confaz`, `vs_legal_estados`, `vs_jurisprudencia`, `vs_tabelas_fiscais`. Ver [docs/VECTOR_STORES.md](VECTOR_STORES.md).

### 6. Agentes de Manutenção

#### 6.1. Monitor de Portais (`tax-portal-watcher`)

**Responsabilidade**: Monitorar portais fiscais e detectar novos documentos.

**Características**:
- **Modelo**: `gpt-5.1`
- **Ferramentas MCP**: `logger` (via Agents SDK, se usado)
- **Funcionalidades Internas**: Usa `httpFetch()` diretamente e gerencia estado via arquivo JSON
- **Prompt**: `agents/prompts/tax-portal-watcher.system.md`

**Fluxo de Trabalho**:
1. Lê configuração de portais em `agents/portals.yaml`
2. Faz fetch das páginas de listagem via `httpFetch()` (função interna em `src/mcp/httpFetchTool.ts`)
3. Extrai links e metadados (título, data, URL) via regex HTML
4. Carrega estado anterior do MongoDB (collection `tvo-portal-state`) via `PortalStateRepository`
5. Filtra apenas documentos novos (deduplicação por `contentHash`)
6. Gera `contentHash` para cada documento novo (SHA256 de `portalId:url:title`)
7. Atualiza estado no MongoDB (`tvo-portal-state`) com novos hashes
8. Retorna array de `PortalDocument[]` com novos documentos

**Implementação**: `watchPortals()` em `src/agents/maintenance.ts`

**Formato de Saída**:
```json
{
  "items": [
    {
      "portalId": "string",
      "portalType": "nacional|estadual",
      "title": "string",
      "url": "string",
      "publishedAt": "YYYY-MM-DDTHH:mm:ssZ|null",
      "detectedAt": "YYYY-MM-DDTHH:mm:ssZ",
      "contentHash": "string"
    }
  ]
}
```

**Portais Monitorados** (configurados em `agents/portals.yaml`):
- Portal Nacional NF-e
- CONFAZ Ajustes SINIEF
- SEFAZ-SP NFC-e
- SEFAZ-MG NF-e
- SVRS (múltiplos documentos: NF-e, NFC-e, CT-e, MDF-e, etc. — Notícias, Documentos, Legislação por documento)

#### 6.2. Classificador de Documentos (`tax-document-classifier`)

**Responsabilidade**: Decidir para qual vector store cada documento deve ser enviado.

**Características**:
- **Modelo**: `gpt-5.1`
- **Ferramentas MCP**: `vector-stores-metadata`, `logger` (via Agents SDK)
- **Prompt**: `agents/prompts/tax-document-classifier.system.md`

**Fluxo de Trabalho**:
1. Recebe metadados do documento (portal, título, URL, datas, metadados do crawler quando disponíveis)
2. **Primeiro**: Invoca agente LLM (`invokeClassifierAgent`) que consulta `vector-stores-metadata` para ler `agents/vectorstores.yaml`
3. **Fallback**: Se o agente falhar, usa heurísticas baseadas em:
   - Título (keywords: "NT", "Nota Técnica", "Lei Complementar", etc.)
   - Portal de origem (`portalId`, `portalType`)
   - URL (padrões: `/nt/`, `/lei/`, `/ajuste/`, `/schema/`)
   - Metadados do crawler (`domain`, `natureza`, `modelo`, `assuntos`, `fileName`)
4. Calcula `confidenceScore` (0.0 a 1.0)
5. Gera `rationale` explicando a decisão
6. Retorna classificação com `vectorStoreId`, `tags`, `confidenceScore` e `rationale`

**Implementação**: `classifyDocument()` em `src/agents/maintenance.ts` (usa agente LLM primeiro, fallback para heurísticas)

**Formato de Saída**:
```json
{
  "targetVectorStoreId": "string",
  "tags": ["string"],
  "confidenceScore": 0.0,
  "rationale": "string"
}
```

**Heurísticas de Classificação** (Fallback): retornam um dos **12 store ids** (ex.: `vs_specs_mercadorias`, `vs_schemas_xsd`, `vs_legal_confaz`). Ids legados são mapeados para os novos em `maintenance.ts` (`LEGACY_TO_NEW_STORE_ID`).

**Nota**: O classifier usa agente LLM primeiro, que considera metadados do crawler quando disponíveis. As heurísticas são usadas apenas como fallback.

#### 6.3. Uploader de Documentos (`tax-document-uploader`)

**Responsabilidade**: Baixar, armazenar e catalogar documentos fiscais.

**Características**:
- **Modelo**: `4o-mini` (modelo mais leve para tarefas simples)
- **Ferramentas MCP**: `logger` (via Agents SDK)
- **Funcionalidades Internas**: Usa `httpFetch()` diretamente e salva arquivos via `fs.writeFileSync()`
- **Prompt**: `agents/prompts/tax-document-uploader.system.md`

**Fluxo de Trabalho**:
1. Recebe documento classificado (URL, vector store, tags)
2. Baixa conteúdo via `httpFetch()` (função interna, não MCP tool)
3. Salva em `agents/.cache/downloads/` com nome padronizado usando `fs.writeFileSync()`
4. Registra destino e tags no vector store
5. **Nota**: `file-search-upload` não está implementado - funcionalidade pode ser adicionada no futuro

**Implementação**: `uploadDocument()` em `src/agents/maintenance.ts`

## Vector Stores

Os vector stores são repositórios de conhecimento especializados definidos em `agents/vectorstores.yaml`.

**📚 Documentação Completa**: Para informações detalhadas sobre todos os vector stores disponíveis, organização por categoria, classificação de documentos e uso pelos agentes, consulte [docs/VECTOR_STORES.md](VECTOR_STORES.md).

### Resumo

O sistema utiliza **12 vector stores** por capacidade/família (ver [docs/VECTOR_STORES.md](VECTOR_STORES.md)): specs (mercadorias, transporte, utilities, plataformas, declaracoes), schemas XSD, legal (federal, confaz, estados), jurisprudência, tabelas fiscais, changelog normativo. O coordinator delega a triage-router, source-planner e especialistas (spec-mercadorias, spec-transporte, legislacao-ibs-cbs), que consultam os stores via `file-search`.

## Ferramentas MCP (Model Context Protocol)

As ferramentas MCP são integradas com o OpenAI Agents SDK e permitem que os agentes interajam com fontes de dados externas e realizem operações específicas.

### Ferramentas MCP Implementadas (Tools do Agents SDK)

#### 1. `file-search` ✅
- **Tipo**: MCP Tool (Agents SDK)
- **Uso**: Busca em vector stores e arquivos locais.
- **Agentes**: coordinator, specialists, classifier
- **Prioridade**: Fonte primária de informação
- **Implementação**: `src/agents/tools.ts` → `src/mcp/fileSearchTool.ts`

#### 2. `web` ✅
- **Tipo**: MCP Tool (Agents SDK)
- **Uso**: Consultas a sites oficiais (apenas domínios `.gov.br`, `.fazenda.gov.br`, etc.).
- **Agentes**: coordinator
- **Restrição**: Apenas para dados objetivos (datas, números de lei, URLs oficiais)
- **Validação**: Valida URLs usando websearch/HTTP fetch antes de retornar ao usuário
- **Status**: Implementado com validação de URLs e suporte a URLs alternativas
- **Implementação**: `src/agents/tools.ts`

#### 3. `vector-stores-metadata` ✅
- **Tipo**: MCP Tool (Agents SDK)
- **Uso**: Ler configuração de vector stores disponíveis.
- **Agentes**: tax-document-classifier
- **Fonte**: `agents/vectorstores.yaml`
- **Implementação**: `src/agents/tools.ts` → `src/mcp/vectorStoresMetadataTool.ts`

#### 4. `logger` ✅
- **Tipo**: MCP Tool (Agents SDK)
- **Uso**: Registrar decisões, chamadas de ferramentas e traces.
- **Agentes**: Todos
- **Implementação**: `src/agents/tools.ts` → `src/utils/logger.ts`

### Funcionalidades Internas (Não são MCP Tools)

As seguintes funcionalidades são implementadas diretamente no código e **não** são MCP tools expostas aos agentes:

#### `http-fetch`
- **Tipo**: Função interna
- **Uso**: Obter HTML de páginas de portais fiscais.
- **Agentes**: tax-portal-watcher (via código, não via tool)
- **Implementação**: `src/mcp/httpFetchTool.ts`
- **Nota**: Usado internamente por `watchPortals()` em `src/agents/maintenance.ts`

#### `http-download`
- **Tipo**: Funcionalidade interna (usa `http-fetch`)
- **Uso**: Baixar conteúdo de documentos fiscais.
- **Agentes**: tax-document-uploader (via código, não via tool)
- **Implementação**: `uploadDocument()` em `src/agents/maintenance.ts` usa `httpFetch()` diretamente
- **Nota**: Não existe como MCP tool separado - o upload usa `httpFetch` e salva diretamente

#### `kv-state`
- **Tipo**: Funcionalidade interna (gerenciamento de estado)
- **Uso**: Armazenar estado de documentos já processados (deduplicação).
- **Agentes**: tax-portal-watcher (via código, não via tool)
- **Armazenamento**: MongoDB (collection `tvo-portal-state`) via `PortalStateRepository` em `src/repositories/portal-state.repository.ts`
- **Implementação**: `watchPortals()` em `src/agents/maintenance.ts` usa `portalStateRepository.findState()` e `portalStateRepository.upsertSeen()` para deduplicação por `contentHash`
- **Nota**: Não é um MCP tool - é gerenciamento de estado interno via repositório MongoDB

#### `storage`
- **Tipo**: Funcionalidade interna (salvamento de arquivos)
- **Uso**: Persistir arquivos baixados.
- **Agentes**: tax-document-uploader (via código, não via tool)
- **Localização**: `agents/.cache/downloads/`
- **Implementação**: `uploadDocument()` em `src/agents/maintenance.ts` salva arquivos diretamente usando `fs.writeFileSync()`
- **Nota**: Não é um MCP tool - salvamento é feito diretamente no código

### Ferramentas Planejadas (Não Implementadas)

#### `file-search-upload`
- **Tipo**: Planejado (não implementado)
- **Uso**: Enviar documentos para File Search após processamento.
- **Agentes**: tax-document-uploader
- **Status**: ⏸️ Não implementado - funcionalidade pode ser adicionada no futuro

#### `task-queue`
- **Tipo**: Planejado (não implementado)
- **Uso**: Enfileirar documentos para processamento posterior.
- **Agentes**: tax-portal-watcher (opcional)
- **Status**: ⏸️ Não implementado - funcionalidade pode ser adicionada no futuro

### Resumo por Tipo

| Ferramenta | Tipo | Status | Implementação |
|------------|------|--------|---------------|
| `file-search` | MCP Tool | ✅ Implementado | `src/agents/tools.ts` |
| `web` | MCP Tool | ✅ Implementado | `src/agents/tools.ts` |
| `vector-stores-metadata` | MCP Tool | ✅ Implementado | `src/agents/tools.ts` |
| `logger` | MCP Tool | ✅ Implementado | `src/agents/tools.ts` |
| `http-fetch` | Função interna | ✅ Implementado | `src/mcp/httpFetchTool.ts` |
| `http-download` | Função interna | ✅ Implementado | Via `httpFetch` em `maintenance.ts` |
| `kv-state` | Estado interno | ✅ Implementado | `maintenance.ts` + MongoDB (`tvo-portal-state`) |
| `storage` | Função interna | ✅ Implementado | `maintenance.ts` (fs) |
| `file-search-upload` | Planejado | ⏸️ Não implementado | - |
| `task-queue` | Planejado | ⏸️ Não implementado | - |

## Fluxos de Trabalho

### 1. Fluxo de Consulta do Usuário (`/query`)

```mermaid
flowchart TD
    A[Usuário: POST /query] --> B[runUserQueryWorkflow]
    B --> C[invokeCoordinator]
    C --> D[Handoffs: triage-router, source-planner, spec-mercadorias, spec-transporte, legislacao-ibs-cbs]
    D --> E[Consulta file-search nos 12 stores]
    E --> F[Consolidação de Respostas]
    F --> G[Resposta com sources e traces]
```

**Etapas**:
1. Usuário envia pergunta via `POST /query`
2. `runUserQueryWorkflow()` é acionado
3. `invokeCoordinator()` analisa a pergunta e consulta `file-search`
4. Coordinator pode acionar triage-router, source-planner e especialistas (spec-mercadorias, spec-transporte, legislacao-ibs-cbs) via handoffs
5. pickSpecialistsFromTriage() (workflow) identifica especialistas para plano/traces a partir do resultado do triage (spec-mercadorias, spec-transporte, legislacao-ibs-cbs)
6. Resposta consolidada retorna com:
   - `answer`: Resposta final
   - `plan`: Plano de execução
   - `sources`: Fontes consultadas
   - `agentTraces`: Traces de agentes e ferramentas

### 2. Fluxo de Varredura Diária (`/admin/run-daily`)

```mermaid
flowchart TD
    A[Trigger: Cron/Admin] --> B[runDailyPortalsScan]
    B --> C[watchPortals]
    C --> D[Carrega portals.yaml]
    D --> E[Para cada portal]
    E --> F[httpFetch: página de listagem]
    F --> G[parsePortalListing: extrai links]
    G --> H[Carrega estado do MongoDB (tvo-portal-state)]
    H --> I{Deduplicação}
    I -->|Novo| J[classifyDocument]
    I -->|Já visto| K[Ignora]
    J --> L[uploadDocument]
    L --> M[Salva em .cache/downloads]
    M --> N[Atualiza estado no MongoDB]
```

**Etapas**:
1. Trigger via cron ou `POST /admin/run-daily`
2. `runDailyPortalsScan()` é executado
3. `watchPortals()`:
   - Lê `agents/portals.yaml`
   - Faz fetch de cada portal via `httpFetch`
   - Extrai documentos via regex HTML
   - Deduplica por `contentHash` usando MongoDB (collection `tvo-portal-state`)
4. Para cada documento novo:
   - `classifyDocument()` decide vector store e tags
   - `uploadDocument()` baixa e salva o arquivo
5. Estado atualizado no MongoDB (collection `tvo-portal-state`)

## Registro de Agentes

Os agentes são registrados em `agents/agents.yaml` e carregados dinamicamente via `src/agents/registry.ts`.

**Estrutura de Definição**:
```yaml
agents:
  - id: coordinator
    name: Tax Virtual Office Coordinator
    model: gpt-5.1
    instructions_file: ./prompts/coordinator.system.md
    tools:
      - file-search
      - web
      - logger
```

**Carregamento**:
- `getAgentDefinition(agentId)` lê `agents.yaml`
- Carrega prompt do arquivo `instructions_file`
- Cache em memória para performance
- Validação de estrutura YAML

## Políticas de Alucinação

Todos os agentes seguem políticas rigorosas para evitar alucinações:

### Regras Gerais

**NUNCA inventar**:
- Números de lei, artigos, incisos, parágrafos ou datas
- Trechos de XML, nomes de tags, campos de schema
- Códigos de rejeição ou mensagens de erro
- Prazos (cancelamento, inutilização, contingência) sem base documental

**SEMPRE**:
- Consultar `file-search` antes de responder
- Citar fontes formais quando fizer afirmações normativas
- Explicitar limitações quando não houver base suficiente
- Declarar "**Não localizei documentação oficial interna suficiente**" quando apropriado

### Políticas por Agente

**Coordinator**:
- Prioriza `file-search` sobre `web`
- Usa `web` apenas para dados objetivos em domínios oficiais
- Explicita escopo (nacional vs estadual, NF-e vs NFC-e)

**Specialists**:
- Consulta vector stores técnicos antes de responder
- Cita documento oficial exato (NT, MOC, schema)
- Explicita versão de layout ou NT

**Classifier**:
- Baseia decisão apenas em metadados (não inventa conteúdo)
- Usa `confidenceScore` conservador quando ambíguo
- Nunca inventa vector stores que não existam

## Política de URLs

Todos os agentes seguem uma política rigorosa para validação e apresentação de URLs:

### Validação de URLs
- **SEMPRE** validar URLs usando a tool `web` antes de enviar ao usuário
- A tool `web` valida automaticamente:
  1. Se a URL é de um domínio oficial permitido
  2. Se a URL está acessível (usando HTTP fetch)
  3. Se não estiver acessível, fornece URL alternativa do site oficial

### Inclusão de URLs do Arquivo Original
- **SEMPRE** incluir a URL do arquivo original armazenado quando disponível nos metadados retornados por `file-search`
- Os metadados dos documentos contêm o campo `fonte_oficial` com a URL original de onde o documento foi baixado
- Apresente essa URL ao usuário como "URL do documento original" ou "Fonte oficial do documento"

### Apresentação de URLs ao Usuário
Quando incluir URLs na resposta:

1. **URL do arquivo original armazenado** (quando disponível nos metadados):
   ```
   📄 **Documento original**: [URL do fonte_oficial]
   ```

2. **URL validada via web tool**:
   - Se a URL for válida e acessível: inclua normalmente na resposta
   - Se a URL não for acessível: **NÃO** inclua a URL inválida. Em vez disso, recomende:
     ```
     ⚠️ A URL original não está acessível no momento.
     📌 **Recomendação**: Acesse o site oficial diretamente: [URL alternativa do site oficial]
     ```

3. **Sites oficiais permitidos** (use apenas estes):
   - `*.gov.br` (todos os domínios do governo brasileiro)
   - `*.fazenda.gov.br` (Ministério da Fazenda)
   - `*.fazenda.sp.gov.br` (SEFAZ-SP)
   - `*.fazenda.mg.gov.br` (SEFAZ-MG)
   - `dfe-portal.svrs.rs.gov.br` (SVRS - SEFAZ Virtual RS)
   - `confaz.fazenda.gov.br` (CONFAZ)

4. **Portais principais**:
   - Portal Nacional NF-e: `https://www.nfe.fazenda.gov.br/portal`
   - SVRS NF-e/NFC-e/CT-e/MDF-e: `https://dfe-portal.svrs.rs.gov.br`
   - CONFAZ: `https://www.confaz.fazenda.gov.br`

### Regras de URLs
- **NUNCA** envie URLs ao usuário sem validar primeiro usando a tool `web`
- **NUNCA** inclua URLs de domínios não oficiais (blogs, consultorias privadas, etc.)
- **SEMPRE** inclua a URL do arquivo original (`fonte_oficial`) quando disponível nos metadados
- **SEMPRE** forneça URL alternativa do site oficial quando a URL original não estiver acessível
- **SEMPRE** recomende consultar o site oficial diretamente quando a URL não for válida

### Exemplo de Formato
```
**Fontes consultadas:**

| Fonte | Tipo | Referência | URL Original |
|-------|------|------------|--------------|
| normas-tecnicas-nfe | vector store | NT 2019.001, seção C.2 | https://www.nfe.fazenda.gov.br/portal/... |
| legislacao-nacional-ibs-cbs-is | vector store | LC 214/2025, arts. 43–50 | https://www.planalto.gov.br/... |

📄 **URLs dos documentos originais:**
- NT 2019.001: https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?...
- LC 214/2025: https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm
```

## Formato de Respostas

### Resposta do Coordinator

```typescript
interface UserQueryResponse {
  answer: string;                    // Resposta consolidada
  sources?: string[];                // Fontes consultadas
  plan?: string[];                   // Plano de execução
  agentTraces?: AgentTraceExample[]; // Traces de agentes
}
```

**Estrutura da Resposta**:
1. **Resumo de alto nível** (2-4 frases)
2. **Análise técnica detalhada** (requisitos legais, regras de negócio)
3. **Plano de ação sugerido** (quando aplicável)
4. **Fontes consultadas** (tabela com tipo, vector store, referência)
5. **Limitações e incertezas** (quando não houver base suficiente)

### Resposta do Portal Watcher

```json
{
  "items": [
    {
      "portalId": "encat-nfce",
      "portalType": "nacional",
      "title": "Nota Técnica 2025.001",
      "url": "https://...",
      "publishedAt": "2025-01-15T10:00:00Z",
      "detectedAt": "2025-01-16T08:30:00Z",
      "contentHash": "sha256..."
    }
  ]
}
```

### Resposta do Classifier

A API `POST /admin/classify-document` retorna um objeto com `vectorStoreId`, `tags`, `rationale` e `score` (e opcionalmente `confidenceScore` quando a classificação vem do agente LLM). Apenas um dos 12 ids de `agents/vectorstores.yaml` é retornado (ex.: `vs_specs_mercadorias`).

```json
{
  "vectorStoreId": "vs_specs_mercadorias",
  "tags": ["portal:svrs-nfce-documentos", "tipo:nota-tecnica", "ano:2025", "documento:nfce"],
  "score": 85,
  "rationale": "Título menciona 'Nota Técnica' e 'NFC-e'; portal especializado em NFC-e. Metadados do crawler indicam domain='nfce' e natureza='NOTA_TECNICA'."
}
```

## Configuração

### Arquivos de Configuração

1. **`agents/agents.yaml`**: Catálogo de agentes
2. **`agents/portals.yaml`**: Portais fiscais monitorados
3. **`agents/vectorstores.yaml`**: Vector stores disponíveis
4. **`agents/prompts/*.system.md`**: Prompts de sistema versionados

### Variáveis de Ambiente

- `OPENAI_API_KEY`: Chave da API OpenAI
- `APP_MODE`: `api` ou `daily-portals-scan`
- `PORT`: Porta do servidor HTTP (padrão: 3000)

### Cache e Estado

- **MongoDB (collection `tvo-portal-state`)**: Estado de documentos já processados (deduplicação por `contentHash`); acessado via `PortalStateRepository`
- **`agents/.cache/downloads/`**: Arquivos baixados dos portais
- **Cache em memória**: Definições YAML carregadas uma vez

## Integração com OpenAI Agents SDK

Todos os agentes usam o **OpenAI Agents SDK** (`@openai/agents`), que fornece tracing automático e suporte a tools e handoffs:

```typescript
import { run } from "@openai/agents";
import { createOpenAIAgent } from "../config/openai-agents.js";

// Criar agente usando o Agents SDK
const agent = createOpenAIAgent("coordinator");

// Executar agente com tracing automático
const result = await run(agent, userPrompt);

// Extrair resposta final
const answer = result.finalOutput || "";
```

**Estrutura de Agente**:
```typescript
import { Agent, handoff } from "@openai/agents";

const agent = new Agent({
  name: definition.name,
  instructions: definition.instructions,
  model: definition.model,
  tools: coordinatorTools,      // file-search, web, logger
  handoffs: handoffs,           // handoffs para especialistas
});
```

**Tracing Automático**:
- Todas as chamadas são automaticamente rastreadas
- Traces aparecem em: https://platform.openai.com/logs
- Inclui inputs, outputs, tokens, latência, tools e handoffs
- Não requer configuração adicional além de `OPENAI_API_KEY`

## Monitoramento e Logging

### Logger Tool

Todos os agentes usam `logger` para registrar:
- Especialistas acionados
- Vector stores consultados
- Queries principais
- Ausência de base documental
- Decisões de encaminhamento

### Traces de Agentes

Cada resposta inclui `agentTraces` com:
- `agentId`: ID do agente
- `calledTools`: Ferramentas utilizadas
- `sample`: Exemplo de trace
- `note`: Observações

## Extensibilidade

### Adicionar Novo Agente

1. Criar prompt em `agents/prompts/[agent-id].system.md`
2. Adicionar entrada em `agents/agents.yaml`:
   ```yaml
   - id: novo-agente
     name: Nome do Agente
     model: gpt-5.1
     instructions_file: ./prompts/novo-agente.system.md
     tools:
       - file-search
       - logger
   ```
3. Adicionar `AgentId` em `src/agents/types.ts`
4. Implementar lógica específica (se necessário) em `src/agents/`

### Adicionar Novo Portal

1. Adicionar entrada em `agents/portals.yaml`:
   ```yaml
   - id: novo-portal
     name: Nome do Portal
     baseUrl: "https://..."
     listingPath: "/caminho"
     type: "nacional|estadual"
   ```

### Adicionar Novo Vector Store

1. Adicionar entrada em `agents/vectorstores.yaml`:
   ```yaml
   - id: novo-vector-store
     description: "Descrição do propósito"
   ```

## Limitações Conhecidas

Esta seção documenta limitações técnicas e comportamentos conhecidos da arquitetura atual:

### 1. Parsing HTML via Regex

**Limitação**: O `tax-portal-watcher` usa regex para extrair links de páginas HTML (`parsePortalListing()` em `src/agents/maintenance.ts`).

**Impacto**:
- Pode falhar com HTML complexo ou malformado
- Não lida bem com JavaScript dinâmico (SPAs)
- Pode perder links em estruturas HTML aninhadas

**Workaround**:
- Portais com HTML simples funcionam bem
- Para portais complexos, considerar usar biblioteca de parsing HTML (ex.: `cheerio`, `jsdom`)

**Código Afetado**: `src/agents/maintenance.ts:192-236`

### 2. Cache em Memória sem Invalidação

**Limitação**: Definições YAML (agentes, portais, vector stores) são carregadas uma vez e mantidas em cache em memória.

**Impacto**:
- Mudanças em `agents.yaml`, `portals.yaml` ou `vectorstores.yaml` requerem restart do processo
- Não há hot-reload automático de configurações

**Workaround**:
- Reiniciar o serviço após alterar configurações YAML
- Para desenvolvimento, usar `ts-node-dev` que reinicia automaticamente

**Código Afetado**: 
- `src/agents/registry.ts:24` (cache de agentes)
- `src/agents/maintenance.ts:38-40` (cache de portais e vector stores)

### 3. Modelo Hardcoded em invokeSpecialist

**Limitação**: A função `invokeSpecialist()` em `src/agents/specialist.ts` usa modelo hardcoded `gpt-4o-mini` em vez de usar o modelo definido no registry.

**Impacto**:
- Especialistas sempre usam `gpt-4o-mini`, ignorando o modelo configurado em `agents.yaml`
- Inconsistência entre configuração e execução

**Workaround**:
- Atualmente, todos os especialistas usam `gpt-4o-mini` independente da configuração
- Para usar modelos diferentes, modificar `src/agents/specialist.ts:12` para ler do registry

**Código Afetado**: `src/agents/specialist.ts:12`

### 4. Heurística Simples de Seleção de Especialistas

**Limitação**: `pickSpecialistsFromTriage()` usa o resultado do triage (trilha, família, doc_type) para selecionar especialistas (spec-mercadorias, spec-transporte, legislacao-ibs-cbs); a seleção é determinística, não semântica.

**Impacto**:
- Pode selecionar especialistas incorretos para perguntas ambíguas
- Não considera contexto semântico da pergunta
- Pode acionar múltiplos especialistas desnecessariamente

**Workaround**:
- Perguntas específicas funcionam bem
- Para perguntas genéricas, todos os especialistas são acionados (comportamento conservador)

**Código Afetado**: `src/workflows/user-query.ts:50-75`

### 5. Deduplicação Baseada em Hash

**Limitação**: Deduplicação de documentos usa `contentHash` baseado em `portalId:url:title`.

**Impacto**:
- Se o título mudar, o mesmo documento pode ser processado novamente
- URLs com parâmetros de query diferentes são tratadas como documentos diferentes
- Não detecta documentos duplicados com títulos diferentes

**Workaround**:
- Funciona bem para a maioria dos casos
- Para melhor deduplicação, considerar usar hash do conteúdo HTML completo

**Código Afetado**: `src/agents/maintenance.ts:252-257`

### 6. Falta de Tratamento de Erros em Alguns Pontos

**Limitação**: Algumas funções não têm tratamento explícito de erros (ex.: `httpFetch` pode falhar silenciosamente).

**Impacto**:
- Erros de rede podem não ser propagados adequadamente
- Falhas em um portal podem interromper o processamento de outros portais

**Workaround**:
- Adicionar try/catch em pontos críticos
- Implementar retry logic para requisições HTTP

**Código Afetado**: `src/mcp/httpFetchTool.ts`, `src/workflows/daily-portals-scan.ts`

## Exemplos Práticos

### Exemplo 1: Fluxo Completo de Consulta

**Cenário**: Usuário pergunta sobre prazo de cancelamento de NF-e.

**Request**:
```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Qual o prazo para cancelar uma NF-e?",
    "context": "Empresa precisa cancelar nota emitida há 2 dias"
  }'
```

**Fluxo Interno**:
1. `runUserQueryWorkflow()` recebe a requisição
2. Triage classifica a pergunta (trilha, família, doc_type); source-planner define stores; retrieval executa file-search
3. `invokeCoordinator()` recebe contexto pré-recuperado e consolida a resposta
4. `pickSpecialistsFromTriage()` identifica especialistas (ex.: família "mercadorias" ou doc_type "nfe" → `spec-mercadorias`)
5. Coordinator consulta `file-search` em vector stores relevantes (ex: `vs_specs_mercadorias`, `vs_schemas_xsd`)
6. Resposta consolidada é retornada

**Response** (exemplo):
```json
{
  "answer": "O prazo para cancelamento de NF-e é de até 30 dias corridos a partir da data de autorização, conforme estabelecido na Nota Técnica 2019.001, seção 8.2. Após esse prazo, a nota não pode ser cancelada e deve ser emitida uma Carta de Correção Eletrônica (CCe) se houver necessidade de ajuste...",
  "plan": [
    "Carregar instruções do coordinator e mapear especialistas disponíveis.",
    "Consultar file-search em docs/ e agents/prompts para recuperar legislações relevantes.",
    "Acionar web/http-fetch apenas quando necessário, priorizando portais oficiais.",
    "Distribuir follow-ups para especialistas adequados (spec-mercadorias) com contexto extraído.",
    "Consolidar resposta com referências explícitas e anexar trace resumindo ferramentas usadas.",
    "Especialistas sugeridos (trilha Documento): Spec Mercadorias (NF-e / NFC-e).",
    "Ferramentas previstas: file-search, logger."
  ],
  "sources": [
    "agents/prompts/coordinator.system.md",
    "docs/WORKFLOWS.md",
    "docs/PORTAIS.md",
    "Spec Mercadorias (NF-e / NFC-e)",
    "docs/AGENTS.md",
    "docs/WORKFLOWS.md"
  ],
  "agentTraces": [
    {
      "agentId": "coordinator",
      "calledTools": ["file-search:docs/WORKFLOWS.md", "web:portal-fazenda"],
      "sample": "[coordinator] file-search → encontrou manual de NF-e em docs/PORTAIS.md; web → validou versão do layout no portal da SEFAZ; despacho para spec-mercadorias.",
      "note": "Trace mostra decisões do coordinator com fontes locais e externas."
    },
    {
      "agentId": "spec-mercadorias",
      "calledTools": ["file-search"],
      "sample": "[spec-mercadorias] file-search → extraiu regras de cancelamento de NF-e do FAQ do portal; consolidou notas e citou seção específica na resposta final.",
      "note": "Usado como exemplo de trace para auditar as decisões do especialista."
    }
  ]
}
```

### Exemplo 2: Resposta do Coordinator (Estruturada)

**Pergunta**: "Como funciona o cálculo de ICMS na NF-e com a nova reforma tributária?"

**Resposta Estruturada** (exemplo do formato esperado):

```markdown
## Resumo de Alto Nível

O cálculo de ICMS na NF-e continua seguindo as regras atuais até a transição completa para IBS/CBS, prevista para 2026-2033. A Emenda Constitucional 132/2023 estabelece o cronograma de transição, mas as regras técnicas de preenchimento da NF-e permanecem inalteradas no curto prazo.

## Análise Técnica Detalhada

### Requisitos Legais

Segundo a **Lei Complementar 214/2025, art. 43**, o ICMS continuará sendo calculado e informado na NF-e durante o período de transição. O campo `<vICMS>` na tag `<ICMSTot>` deve ser preenchido conforme as regras estaduais vigentes.

### Regras de Negócio

- **CST/CSOSN**: Mantém-se a codificação atual (00, 10, 20, etc. para CST ou 101, 102, etc. para CSOSN)
- **Base de Cálculo**: Continua sendo o valor da operação, conforme **NT 2019.001, seção C.5.2**
- **Alíquota**: Aplicada conforme legislação estadual de origem

### Impactos por Tipo de Documento

- **NF-e (modelo 55)**: Mantém estrutura atual de ICMS
- **NFC-e (modelo 65)**: Similar à NF-e, com algumas simplificações
- **CT-e**: ICMS sobre transporte segue regras específicas

## Plano de Ação Sugerido

1. Verificar se o ambiente de homologação está atualizado para a versão mais recente do layout NF-e
2. Confirmar com a SEFAZ da UF de origem as alíquotas vigentes
3. Revisar a NT mais recente sobre transição tributária (consultar portal nacional)
4. Monitorar comunicados sobre mudanças no período de transição

## Fontes Consultadas

| Fonte                          | Tipo         | Referência                                       |
|--------------------------------|--------------|--------------------------------------------------|
| vs_specs_mercadorias           | vector store | NT 2019.001, seção C.5.2, Projeto NF-e         |
| vs_legal_federal               | vector store | LC 214/2025, arts. 43–50, Ministério da Fazenda |
| spec-mercadorias               | especialista | Análise técnica de campos XML                    |
| legislacao-ibs-cbs             | especialista | EC 132/2023, cronograma de transição             |

## Limitações e Incertezas

**Não localizei documentação oficial interna suficiente sobre**:
- Alíquotas específicas de ICMS por UF (varia por estado)
- Prazos exatos de implementação de mudanças por UF

**Recomendações**:
- Consultar diretamente o portal da SEFAZ da UF de origem
- Verificar comunicados recentes no Portal Nacional da NF-e
```

### Exemplo 3: Documento Classificado pelo Classifier

**Input** (documento detectado pelo watcher):
```json
{
  "portalId": "encat-nfce",
  "portalType": "nacional",
  "title": "Nota Técnica 2025.001 - Atualização do Layout NFC-e",
  "url": "https://www.encat.org.br/nfce-documentos/nt-2025-001",
  "publishedAt": "2025-01-15T10:00:00Z",
  "detectedAt": "2025-01-16T08:30:00Z",
  "contentHash": "a1b2c3d4e5f6..."
}
```

**Processamento**:
1. `classifyDocument()` recebe o documento
2. Analisa título: contém "Nota Técnica" e "NFC-e"
3. Analisa portal: `encat-nfce` é especializado em NFC-e
4. Consulta `vectorstores.yaml` para opções disponíveis
5. Agente LLM analisa metadados e calcula scores:
   - `normas-tecnicas-nfce`: score alto (domain='nfce', natureza='NOTA_TECNICA')
   - `normas-tecnicas-nfe`: score baixo (documento é NFC-e, não NF-e)
   - `legislacao-nacional-ibs-cbs-is`: score 0 (não relacionado)
   - Outros: scores menores

**Output** (classificação):
```json
{
  "targetVectorStoreId": "normas-tecnicas-nfce",
  "tags": [
    "portal:encat-nfce",
    "tipo:nota-tecnica",
    "ano:2025",
    "documento:nfce"
  ],
  "confidenceScore": 0.85,
  "rationale": "Metadados do crawler indicam domain='nfce' e natureza='NOTA_TECNICA'. Título menciona 'Nota Técnica' e 'NFC-e'; portal é especializado em NFC-e (encat-nfce)."
}
```

**Próximos Passos**:
1. `uploadDocument()` baixa o conteúdo da URL via `httpFetch()`
2. Salva em `agents/.cache/downloads/normas-tecnicas-nfce-a1b2c3d4e5f6.html`
3. Registra no vector store com as tags fornecidas
4. Opcionalmente envia para File Search

## Métricas e Observabilidade

### Monitoramento de Performance

#### 1. Logs Estruturados

Todos os agentes usam `logger` tool para registrar eventos. Os logs são escritos via `console.info()` e `console.error()`.

**Formato de Log**:
```typescript
// Info logs
logInfo("Portal varrido", {
  portalId: "encat-nfce",
  parsed: 15,
  novos: 3
});

// Error logs
logError("Falha ao processar portal", {
  portalId: "encat-nfce",
  error: error.message
});
```

**Localização**: Logs são escritos no stdout/stderr do processo.

**Melhorias Futuras**:
- Integrar com sistema de logging estruturado (ex.: Winston, Pino)
- Adicionar correlation IDs para rastrear requisições
- Exportar logs para sistema centralizado (ex.: ELK, Datadog)

#### 2. Métricas de Agentes

**Métricas Disponíveis** (via logs):
- **Portal Watcher**:
  - Número de portais processados
  - Documentos encontrados vs novos
  - Taxa de sucesso por portal
- **Classifier**:
  - Distribuição de classificações por vector store
  - Confidence scores médios
  - Tempo de classificação
- **Coordinator**:
  - Especialistas acionados por consulta
  - Vector stores consultados
  - Tempo de resposta

**Exemplo de Métricas** (extraídas de logs):
```json
{
  "timestamp": "2025-01-16T10:30:00Z",
  "agent": "tax-portal-watcher",
  "metrics": {
    "portals_processed": 5,
    "documents_found": 23,
    "new_documents": 7,
    "success_rate": 1.0
  }
}
```

#### 3. Estado de Processamento

**Arquivo de Estado**: `agents/.cache/portal-state.json`

**Estrutura**:
```json
{
  "lastRun": "2025-01-16T08:30:00Z",
  "seen": {
    "encat-nfce": [
      "hash1",
      "hash2",
      "hash3"
    ],
    "portal-nacional-nfe": [
      "hash4",
      "hash5"
    ]
  }
}
```

**Uso para Monitoramento**:
- Verificar `lastRun` para garantir execução regular
- Contar documentos em `seen` por portal para volume processado
- Detectar portais sem novos documentos (possível problema)

### Debugging de Agentes

#### 1. Traces de Agentes

Cada resposta do coordinator inclui `agentTraces` que mostram:
- Quais agentes foram acionados
- Quais ferramentas foram usadas
- Exemplos de decisões tomadas

**Como Usar**:
```typescript
// Na resposta do /query
const traces = response.agentTraces;
traces.forEach(trace => {
  console.log(`Agent: ${trace.agentId}`);
  console.log(`Tools: ${trace.calledTools.join(', ')}`);
  console.log(`Sample: ${trace.sample}`);
});
```

#### 2. Logs de Ferramentas MCP

**Logger Tool**:
```typescript
// Registrar decisão importante
logInfo("Especialista acionado", {
  agentId: "spec-mercadorias",
  question: "Prazo de cancelamento",
  vectorStores: ["vs_specs_mercadorias", "vs_schemas_xsd"]
});
```

**Localização dos Logs**:
- Console do processo (stdout/stderr)
- Em produção, redirecionar para arquivo ou sistema de logs

#### 3. Debugging de Classificação

**Verificar Classificação**:
```bash
# Ver estado atual de documentos processados (MongoDB collection tvo-portal-state)
# Use um cliente MongoDB ou script que consulte a collection tvo-portal-state

# Ver documentos baixados
ls -la agents/.cache/downloads/

# Ver logs do último processamento
# (se redirecionados para arquivo)
tail -f logs/portal-watcher.log
```

**Debug de Heurísticas**:
- Adicionar logs em `scoreVectorStores()` para ver scores calculados
- Verificar rationale retornado pelo classifier
- Comparar confidence scores entre documentos similares

#### 4. Debugging de Consultas

**Verificar Fluxo de Consulta**:
```typescript
// Adicionar logs em pontos-chave
console.log("Question received:", input.question);
console.log("Specialists selected:", specialistIds);
console.log("Tools collected:", tools);
console.log("Response:", response);
```

**Verificar Fontes Consultadas**:
- Verificar `sources` na resposta
- Confirmar que vector stores esperados foram consultados
- Validar que `file-search` foi acionado antes de responder

### Alertas e Monitoramento Recomendados

#### 1. Alertas Críticos

**Portal Watcher**:
- Falha ao processar portal (erro HTTP, timeout)
- Nenhum documento novo por mais de X dias (possível problema no portal)
- Taxa de erro > 10% em processamento

**Coordinator**:
- Tempo de resposta > 30 segundos
- Falha ao consultar vector stores
- Respostas sem fontes consultadas

**Classifier**:
- Confidence score < 0.4 (classificação incerta)
- Documentos não classificados (erro no processamento)

#### 2. Dashboards Recomendados

**Métricas por Agente**:
- Taxa de sucesso
- Tempo médio de processamento
- Número de requisições/execuções

**Métricas por Portal**:
- Documentos encontrados por dia
- Novos documentos por dia
- Taxa de sucesso de fetch

**Métricas de Classificação**:
- Distribuição por vector store
- Confidence scores médios
- Taxa de classificação bem-sucedida

#### 3. Integração com Observabilidade

**Ferramentas Recomendadas**:
- **Prometheus**: Coletar métricas customizadas
- **Grafana**: Visualizar dashboards
- **ELK Stack**: Centralizar logs
- **Sentry**: Capturar erros e exceções

**Exemplo de Métrica Prometheus**:
```typescript
// Adicionar contador de consultas
const queryCounter = new prometheus.Counter({
  name: 'tax_virtual_office_queries_total',
  help: 'Total number of user queries',
  labelNames: ['agent', 'status']
});

// Incrementar em cada consulta
queryCounter.inc({ agent: 'coordinator', status: 'success' });
```

## Referências

- **Código Fonte**: `src/agents/`
- **Configuração**: `agents/*.yaml`
- **Prompts**: `agents/prompts/*.system.md`
- **Workflows**: `src/workflows/`
- **MCP Tools**: `src/mcp/`
- **Documentação**: `docs/`

## Diagrama de Arquitetura Completo

```mermaid
flowchart TB
    subgraph "Camada de Entrada"
        A[HTTP API /query]
        B[Admin /admin/run-daily]
    end
    
    subgraph "Workflows"
        C[user-query.ts]
        D[daily-portals-scan.ts]
    end
    
    subgraph "Agentes"
        E[coordinator]
        T[triage-router]
        S[source-planner]
        F[spec-mercadorias]
        H[spec-transporte]
        I[legislacao-ibs-cbs]
        J[tax-portal-watcher]
        K[tax-document-classifier]
        L[tax-document-uploader]
    end
    
    subgraph "Ferramentas MCP"
        M[file-search]
        N[web]
        O[http-fetch]
        P[http-download]
        Q[kv-state]
        R[vector-stores-metadata]
        S[storage]
        T[logger]
    end
    
    subgraph "Fontes de Dados"
        U[Vector Stores]
        V[Portais Fiscais]
        W[Cache Local]
    end
    
    A --> C
    B --> D
    C --> E
    E --> T
    E --> S
    E --> F
    E --> H
    E --> I
    D --> J
    J --> K
    K --> L
    
    E --> M
    E --> N
    F --> M
    H --> M
    I --> M
    T --> R
    J --> O
    J --> Q
    K --> R
    L --> P
    L --> S
    
    M --> U
    N --> V
    O --> V
    P --> V
    Q --> W
    S --> W
    
    E --> T
    F --> T
    G --> T
    H --> T
    I --> T
    J --> T
    K --> T
    L --> T
```

---

**Última atualização**: Baseado na análise do codebase em 2025-01-16
