# Tax Virtual Office

Repositório base para o Escritório Tributário Virtual com agentes coordenadores, especialistas e automações para ingestão de documentos fiscais.

## Estrutura

- `agents/`: definições YAML e prompts dos agentes.
- `src/`: código TypeScript para workflows, MCP tools e servidor HTTP.
- `scripts/`: utilitários para cron e manutenção.
- `infra/`: Docker, docker-compose e manifestos Kubernetes.
- `docs/`: documentação de agentes, portais e vector stores.

## Prompts do sistema (versão final)

Todos os prompts de system já estão consolidados e versionados em `agents/prompts/*.system.md`.

- `coordinator.system.md`: orquestra especialistas e ferramentas MCP.
- `specialist-nfce.system.md`, `specialist-nfe.system.md`, `specialist-cte.system.md`: especialistas por documento fiscal.
- `legislacao-ibs-cbs.system.md`: acompanha a reforma tributária.
- `tax-portal-watcher.system.md`: monitora novos documentos em portais fiscais.
- `tax-document-classifier.system.md`: decide vector store e tags de armazenamento.
- `tax-document-uploader.system.md`: fluxo final de upload e catalogação.

## Arquitetura

```mermaid
flowchart TD
    User(Usuário) -->|HTTP| API[Express API / server]
    API --> QueryWorkflow[Workflow de consultas]
    QueryWorkflow --> Coordinator[Agente coordinator]
    Coordinator --> Specialists[Agentes especialistas]
    Specialists --> OpenAI[(OpenAI Responses API)]

    API --> DailyTrigger[Execução diária / admin]
    DailyTrigger --> Maintenance[Watchers e classificadores]
    Maintenance --> MCP[Ferramentas MCP (ex.: httpFetch)]
    MCP --> Portais[Portais fiscais]
    Maintenance --> VectorStores[Vector stores / file search]
```

## Docker Compose

Um `docker-compose.yaml` está disponível em `infra/docker-compose.yaml` com dois serviços:

- `api`: expõe a API HTTP na porta 3000 (`APP_MODE=api`).
- `watcher`: executa o fluxo diário de portais (`APP_MODE=daily-portals-scan`).

Uso básico:

1. Configure `.env` com `OPENAI_API_KEY` e demais variáveis.
2. Suba os contêineres: `docker compose -f infra/docker-compose.yaml up --build`.
3. A API ficará disponível em `http://localhost:3000` e o watcher rodará em background.

## Desenvolvimento

1. Copie `.env.example` para `.env` e ajuste as variáveis.
2. Instale dependências: `npm install`.
3. Ambiente de desenvolvimento: `npm run dev`.
4. Build: `npm run build`.
5. Servidor HTTP: `npm start` (usa `dist/index.js`).

## Endpoints básicos

- `POST /query` — recebe pergunta do usuário e aciona o agente coordenador.
- `GET /health` — healthcheck simples.
- `POST /admin/run-daily` — dispara fluxo diário de monitoramento.

## Estado atual da implementação

- O workflow de consulta (`/query`) agora monta o plano com especialistas e ferramentas com base na pergunta, reaproveitando o catálogo de agentes e exibindo quais modelos serão acionados. 【F:src/workflows/user-query.ts†L1-L78】【F:src/agents/registry.ts†L1-L55】
- A varredura de portais (`runDailyPortalsScan` e `/admin/run-daily`) agora faz fetch das listagens, extrai links reais via HTML, deduplica por hash em `agents/.cache/portal-state.json` e registra métricas por portal. Novos itens retornam com `portalId`, `portalType`, `contentHash`, `publishedAt` e `detectedAt`. 【F:src/workflows/daily-portals-scan.ts†L1-L16】【F:src/agents/maintenance.ts†L41-L121】【F:src/agents/maintenance.ts†L171-L221】
- A classificação de documentos usa heurísticas e o catálogo `agents/vectorstores.yaml` para pontuar o melhor `vectorStoreId`, retornando rationale e score sem depender de chamadas de modelo. O upload passa a baixar e persistir o HTML na pasta `agents/.cache/downloads` antes de registrar destino e tags. 【F:src/agents/types.ts†L17-L41】【F:src/agents/maintenance.ts†L70-L108】【F:src/agents/maintenance.ts†L123-L170】
