---
title: "INVOISYS Tax Virtual Office Onboarding"
description: "Configuração inicial de ambiente, qualidade e automações essenciais."
---

## Resumo

Use estes comandos para executar tarefas recorrentes para INVOISYS Tax Virtual Office.
**Stack principal:** JavaScript, TypeScript, Express
**Gerenciador de pacotes:** Npm

## Instalar dependências

Instale dependências usando npm.

1. npm install

## Checklist de onboarding

Execute cada item para garantir que o ambiente esteja pronto para desenvolvimento colaborativo.

1. Executar `npx -y fastmcp dev src/server.ts` para validar ambiente.
2. Sincronizar variáveis de ambiente e segredos.
3. Rodar lint e testes localmente.

## Comandos rápidos

- **Instalar dependências**: `npm install`
- **Development server**: `npx -y fastmcp dev src/server.ts`
- **Start application**: `MCP_TRANSPORT=http node dist/server.js`
- **Custom script**: `MCP_TRANSPORT=http MCP_HTTP_HOST=0.0.0.0 MCP_HTTP_PORT=10000 node dist/server.js`
