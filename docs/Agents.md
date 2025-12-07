# Arquitetura de Agentes

Este documento resume o papel de cada agente definido em `agents/agents.yaml` e os prompts correspondentes.

- **coordinator**: roteia perguntas para especialistas e decide ferramentas MCP.
- **specialist-nfce/nfe/cte**: focados em cada documento fiscal, usam vector stores técnicos.
- **legislacao-ibs-cbs**: cobre reforma tributária e legislação correlata.
- **tax-portal-watcher**: monitora portais, consulta `kv-state` e devolve novos documentos.
- **tax-document-classifier**: decide para qual vector store enviar um documento.
- **tax-document-uploader**: baixa, armazena e envia o arquivo para File Search.
