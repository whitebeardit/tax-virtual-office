# Next steps

## Orquestração de agentes
- Encadear chamadas reais ao coordinator e especialistas, orquestrando paralelismo quando fizer sentido e retornando um rastro de decisões na resposta ao usuário.
- Adicionar testes de integração que validem o ciclo pergunta → coordinator → especialistas, usando fixtures ou mocks do OpenAI Responses API.
- Instrumentar o plano retornado pelo coordinator com fontes reais (file-search/web) e exemplos de traces dos agentes.

## Varredura de portais
- Evoluir `watchPortals` com parsers específicos por portal (ex.: seletor CSS, tabelas) e quedas de rede toleradas, reaproveitando o cache de hashes persistido para evitar reprocessamento.
- Enfileirar documentos novos para processamento assíncrono (fila/cron) e registrar métricas de throughput, latência e erros por portal.
- Persistir fingerprints em storage compartilhado (Redis/S3) e validar deduplicação por hash + identificadores oficiais ao baixar o conteúdo completo.

## Classificação e upload
- Em `classifyDocument`, combinar heurísticas com consultas reais ao vector store (metadata e busca por similaridade) para validar o score antes de enviar para o bucket final.
- Implementar `uploadDocument` com armazenamento real (S3/minio) e publicação no File Search, com tratamento de erros e logs estruturados, reaproveitando o cache local apenas como fallback.
- Adicionar telemetria e alertas para falhas de classificação/upload, incluindo retries e DLQ para documentos problemáticos, e dashboards com contagem de deduplicação.

## Infraestrutura e qualidade
- Completar Docker Compose com volumes/cache necessários para downloads e storage temporário; garantir que `APP_MODE` e variáveis obrigatórias estejam documentadas no `.env.example`.
- Adicionar linting, CI básico (build + testes) e healthchecks adicionais para os modos API e watcher.

## Documentação
- Atualizar README e `docs/` conforme as integrações forem concluídas, incluindo exemplos de requisição/resposta reais e instruções de operação dos workflows diários.
