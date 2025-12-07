# Next steps

## Orquestração de agentes
- Encadear chamadas reais ao coordinator e especialistas, orquestrando paralelismo quando fizer sentido e retornando um rastro de decisões na resposta ao usuário.
- Adicionar testes de integração que validem o ciclo pergunta → coordinator → especialistas, usando fixtures ou mocks do OpenAI Responses API.
- Instrumentar o plano retornado pelo coordinator com fontes reais (file-search/web) e exemplos de traces dos agentes.

## Varredura de portais
- Evoluir `watchPortals` para parsear páginas/listagens de `agents/portals.yaml`, extraindo títulos/links reais e deduplicando itens já processados via KV ou storage.
- Enfileirar documentos novos para processamento assíncrono e registrar métricas de quantos itens foram encontrados por portal.
- Expandir `PortalDocument` para carregar campos adicionais (ex.: hash do conteúdo, identificadores oficiais) usados na deduplicação.

## Classificação e upload
- Em `classifyDocument`, substituir o download via prompt por uso de ferramentas (vector-stores-metadata) e heurísticas mais elaboradas para escolher o destino, guardando rationale e score.
- Implementar `uploadDocument` com download real (http-download), armazenamento (ex.: S3/minio) e publicação no File Search, com tratamento de erros e logs estruturados.
- Adicionar telemetria e alertas para falhas de classificação/upload, incluindo retries e DLQ para documentos problemáticos.

## Infraestrutura e qualidade
- Completar Docker Compose com volumes/cache necessários para downloads e storage temporário; garantir que `APP_MODE` e variáveis obrigatórias estejam documentadas no `.env.example`.
- Adicionar linting, CI básico (build + testes) e healthchecks adicionais para os modos API e watcher.

## Documentação
- Atualizar README e `docs/` conforme as integrações forem concluídas, incluindo exemplos de requisição/resposta reais e instruções de operação dos workflows diários.
