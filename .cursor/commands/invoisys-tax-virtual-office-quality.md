---
title: "INVOISYS Tax Virtual Office Quality Gates"
description: "Execução consistente dos testes e validações de qualidade."
---

## Práticas recomendadas

- Automatize linting e testes em commits e pipelines.
- Mantenha coverage reportado e acompanhando metas do time.

## Sequência de validação

Rode os comandos nesta sequência antes de abrir PRs ou promover builds.

## Comandos complementares

- `build` → Build project (tsc)
- `debug` → Custom script (ts-node --esm src/server.ts)
