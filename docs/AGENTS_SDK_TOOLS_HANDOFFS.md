# Tools e Handoffs no OpenAI Agents SDK

## O que foi implementado

### ✅ Tools (Ferramentas)

Agora os agentes podem usar ferramentas reais:

1. **`file_search`** - Busca em vector stores
   - Vector stores disponíveis: `legislacao-nacional-ibs-cbs-is`, `normas-tecnicas-nfe-nfce-cte`, etc.
   - Integrado com `src/mcp/fileSearchTool.ts`

2. **`web`** - Consulta sites oficiais
   - Apenas domínios `.gov.br` e `encat.org.br`
   - Para dados objetivos (datas, números de lei)

3. **`logger`** - Registra decisões e informações
   - Para auditoria e debugging

### ✅ Handoffs (Delegação)

O coordinator agora pode delegar para especialistas:

- **`handoff_to_specialist_nfe`** - Delega para NF-e Specialist
- **`handoff_to_specialist_nfce`** - Delega para NFC-e Specialist  
- **`handoff_to_specialist_cte`** - Delega para CT-e Specialist
- **`handoff_to_legislacao_ibs_cbs`** - Delega para IBS/CBS/IS Legislation Specialist

## Como funciona

### Fluxo com Tools

1. Usuário faz pergunta sobre "Normas Técnicas IBS/CBS"
2. Coordinator recebe a pergunta
3. Coordinator **chama `file_search`** para buscar em vector stores
4. Coordinator analisa resultados
5. Coordinator pode **fazer handoff** para `legislacao-ibs-cbs` se necessário
6. Especialista também pode usar `file_search` e `logger`
7. Resposta consolidada retorna

### Exemplo de Trace no Dashboard

Agora você verá no dashboard:

```
Coordinator
  ├─ file_search(vectorStoreId: "legislacao-nacional-ibs-cbs-is", query: "...")
  │  └─ Resultado: [dados encontrados]
  ├─ handoff_to_legislacao_ibs_cbs
  │  └─ Legislacao IBS/CBS Specialist
  │     ├─ file_search(vectorStoreId: "normas-tecnicas-nfe-nfce-cte", query: "...")
  │     └─ logger(level: "info", message: "Consulta realizada")
  └─ Final Output: [resposta consolidada]
```

## Testando

### 1. Executar o Sistema

```bash
npm run dev
```

### 2. Fazer Query que Requer Tools

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Quais as últimas Normas Técnicas que falam sobre os impostos IBS CBS?",
    "context": "Reforma tributária"
  }'
```

### 3. Verificar Traces no Dashboard

1. Acesse: https://platform.openai.com/logs
2. Procure pela execução mais recente
3. Você deve ver:
   - ✅ Chamadas a `file_search`
   - ✅ Handoff para especialista (se aplicável)
   - ✅ Chamadas a `logger`
   - ✅ Toda a cadeia de execução

## Arquivos Modificados

### `src/agents/tools.ts` (NOVO)
- Define as 3 tools: `fileSearchTool`, `webTool`, `loggerTool`
- Integra com implementações MCP existentes

### `src/config/openai-agents.ts` (ATUALIZADO)
- Configura tools para cada tipo de agente
- Configura handoffs do coordinator para especialistas
- Cache de agentes para performance

## Troubleshooting

### Tools não aparecem no trace?

1. **Verificar se tools estão registradas:**
   ```typescript
   // Em openai-agents.ts, verificar:
   tools: coordinatorTools, // Deve estar definido
   ```

2. **Verificar se o agente está usando as tools:**
   - O agente decide quando usar tools baseado nas instruções
   - Se as instruções não mencionarem tools, ele pode não usá-las

3. **Verificar logs:**
   ```bash
   # Procurar por logs de file-search
   grep "file-search" logs/
   ```

### Handoffs não acontecem?

1. **Verificar se handoffs estão configurados:**
   ```typescript
   // Em openai-agents.ts, verificar:
   handoffs: handoffs.length > 0 ? handoffs : undefined,
   ```

2. **Verificar instruções do coordinator:**
   - O coordinator precisa ser instruído a fazer handoffs
   - Verificar `agents/prompts/coordinator.system.md`

3. **Verificar se a pergunta requer especialista:**
   - Handoffs só acontecem se o coordinator decidir que precisa
   - Pode ser que a pergunta seja simples demais

### Erro: "Tool not found"

1. **Verificar importações:**
   ```typescript
   import { coordinatorTools, specialistTools } from "../agents/tools.js";
   ```

2. **Verificar se tools estão exportadas:**
   ```typescript
   export const coordinatorTools = [fileSearchTool, webTool, loggerTool];
   ```

## Próximos Passos

1. ✅ Tools implementadas
2. ✅ Handoffs configurados
3. ⏭️ Testar com queries reais
4. ⏭️ Verificar traces no dashboard
5. ⏭️ Ajustar instruções se necessário
6. ⏭️ Implementar `web` tool completamente (atualmente placeholder)

## Referências

- [OpenAI Agents SDK - Tools](https://openai.github.io/openai-agents-js/guides/tools/)
- [OpenAI Agents SDK - Handoffs](https://openai.github.io/openai-agents-js/guides/handoffs/)
- [Dashboard de Traces](https://platform.openai.com/logs)
