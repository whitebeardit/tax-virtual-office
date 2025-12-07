# Workflows Principais

## Consulta de usuário
1. API recebe pergunta em `/query`.
2. Workflow chama agente coordenador, que consulta especialistas e File Search.
3. Resposta consolidada retorna para o cliente.

## Varredura diária de portais
1. Cron ou GitHub Actions executam `runDailyPortalsScan`.
2. `tax-portal-watcher` lê `portals.yaml` e retorna novos documentos.
3. `tax-document-classifier` decide o vector store.
4. `tax-document-uploader` baixa o arquivo, salva em storage e publica em File Search.
