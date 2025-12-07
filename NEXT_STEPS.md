# Next steps

## Orquestração de agentes
- Conectar o workflow de consulta (`runUserQueryWorkflow`) aos agentes descritos em `agents/agents.yaml`, carregando prompts de `agents/prompts/*.system.md` em vez do prompt estático atual.
- Criar uma camada para seleção dinâmica de especialistas e ferramentas (ex.: file-search, http-fetch) e devolver planos e fontes reais na resposta.
- Adicionar testes de integração que validem o ciclo pergunta → coordinator → especialistas, usando fixtures ou mocks do OpenAI Responses API.

## Varredura de portais
- Implementar `watchPortals` para percorrer `agents/portals.yaml`, baixar e parsear páginas/listagens, deduplicando itens já processados via KV ou storage.
- Enfileirar documentos novos para processamento assíncrono e registrar métricas de quantos itens foram encontrados por portal.

## Classificação e upload
- Em `classifyDocument`, usar o catálogo de `agents/vectorstores.yaml` e critérios claros (tipo de portal, palavras-chave) para escolher o destino; enriquecer tags e racional.
- Implementar `uploadDocument` com download real (http-download), armazenamento (ex.: S3/minio) e publicação no File Search, com tratamento de erros e logs estruturados.

## Infraestrutura e qualidade
- Completar Docker Compose com volumes/cache necessários para downloads e storage temporário; garantir que `APP_MODE` e variáveis obrigatórias estejam documentadas no `.env.example`.
- Adicionar linting, CI básico (build + testes) e healthchecks adicionais para os modos API e watcher.

## Documentação
- Atualizar README e `docs/` conforme as integrações forem concluídas, incluindo exemplos de requisição/resposta reais e instruções de operação dos workflows diários.
