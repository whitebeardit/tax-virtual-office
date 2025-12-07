# Tracing e Observabilidade

## Status Atual: ✅ Tracing Automático Habilitado

O sistema **já está usando o OpenAI Agents SDK** (`@openai/agents`), que fornece **tracing automático** para o dashboard da OpenAI.

**Todas as chamadas aos agentes são automaticamente rastreadas** e aparecem em: **https://platform.openai.com/logs**

## Como Funciona

### Arquitetura de Tracing

O sistema usa o **OpenAI Agents SDK** que automaticamente:

1. ✅ Envia traces para o dashboard da OpenAI
2. ✅ Registra inputs, outputs, tokens e latência
3. ✅ Rastreia chamadas a tools (file-search, web, logger)
4. ✅ Documenta handoffs entre agentes
5. ✅ Não requer configuração adicional

### Implementação

**Código dos Agentes**:
```typescript
// src/agents/coordinator.ts
import { run } from "@openai/agents";
import { createOpenAIAgent } from "../config/openai-agents.js";

const agent = createOpenAIAgent("coordinator");
const result = await run(agent, userPrompt);
// ✅ Tracing automático habilitado
```

**Configuração do Agente**:
```typescript
// src/config/openai-agents.ts
import { Agent, handoff } from "@openai/agents";

const agent = new Agent({
  name: definition.name,
  instructions: definition.instructions,
  model: definition.model,
  tools: coordinatorTools,      // file-search, web, logger
  handoffs: handoffs,           // handoffs para especialistas
});
```

## Acessando os Traces

### 1. Dashboard da OpenAI

1. Acesse: **https://platform.openai.com/logs**
2. Faça login com sua conta OpenAI
3. Você verá todos os traces das execuções dos agentes

**Nota**: Por padrão, apenas o owner da organização vê os traces. Para dar acesso a outros membros:
- Settings → Data Controls → Ajustar permissões do Traces dashboard

### 2. O que Você Verá no Dashboard

Cada execução de agente cria um trace que inclui:

- **Input**: Prompt completo enviado ao agente
- **Output**: Resposta final do agente
- **Model**: Modelo usado (ex: `gpt-4o`, `gpt-5.1`)
- **Tokens**: Tokens de input e output
- **Latency**: Tempo de execução
- **Tools**: Chamadas a ferramentas (file-search, web, logger)
- **Handoffs**: Delegações para outros agentes
- **Metadata**: Informações adicionais

### 3. Exemplo de Trace

Quando você executa uma query via `/query`, você verá no dashboard:

```
Coordinator
  ├─ file_search(vectorStoreId: "legislacao-nacional-ibs-cbs-is", query: "...")
  │  └─ Resultado: [dados encontrados]
  ├─ handoff_to_specialist_nfe
  │  └─ Specialist NFE
  │     ├─ file_search(vectorStoreId: "normas-tecnicas-nfe-nfce-cte", query: "...")
  │     └─ logger(level: "info", message: "Consulta realizada")
  └─ Final Output: [resposta consolidada]
```

## Configuração

### Variáveis de Ambiente

```bash
# Obrigatório
OPENAI_API_KEY=sk-...

# Opcional: Desabilitar tracing (não recomendado)
OPENAI_AGENTS_DISABLE_TRACING=1
```

**Nota**: Por padrão, o tracing está sempre habilitado. Para desabilitar, defina `OPENAI_AGENTS_DISABLE_TRACING=1` (não recomendado).

### Verificar se Tracing Está Ativo

```typescript
import { getTracingInfo } from "./config/openai-agents.js";

const info = getTracingInfo();
console.log(info);
// {
//   enabled: true,
//   disabled: false,
//   dashboardUrl: "https://platform.openai.com/logs"
// }
```

## Troubleshooting

### Traces não aparecem no dashboard?

1. **Verificar API Key:**
   ```bash
   echo $OPENAI_API_KEY  # deve ter valor
   ```

2. **Verificar se tracing está desabilitado:**
   ```bash
   echo $OPENAI_AGENTS_DISABLE_TRACING  # não deve ser "1"
   ```

3. **Verificar permissões:**
   - Você precisa ser owner da organização ou ter acesso ao Traces dashboard
   - Settings → Data Controls → Verificar permissões

4. **Aguardar alguns segundos:**
   - Traces podem levar alguns segundos para aparecer no dashboard

5. **Verificar se a API key está correta:**
   - A API key deve estar associada à conta que você está usando para acessar o dashboard

### Erro: "Agent definition not found"

- Verifique se o `agentId` existe em `agents/agents.yaml`
- Verifique se o arquivo de instruções existe em `agents/prompts/`

### Erro: "OPENAI_API_KEY is not set"

- Configure a variável de ambiente `OPENAI_API_KEY`
- Verifique se está sendo carregada corretamente (`.env` ou sistema)

## Diferença entre Traces e agentTraces

### Traces do OpenAI (Dashboard)

- **Onde**: https://platform.openai.com/logs
- **O que**: Dados coletados automaticamente pelo Agents SDK
- **Inclui**: Inputs, outputs, tokens, latência, tools, handoffs
- **Formato**: Visualização no dashboard da OpenAI

### agentTraces na Resposta JSON

- **Onde**: Campo `agentTraces` na resposta de `/query`
- **O que**: Dados estruturados da aplicação para auditoria
- **Inclui**: Exemplos de traces, ferramentas chamadas, notas
- **Formato**: JSON estruturado na resposta da API

**Ambos são úteis**:
- **Traces do OpenAI**: Para debugging e observabilidade completa
- **agentTraces**: Para auditoria e referência na resposta da API

## Benefícios do Tracing Automático

1. ✅ **Observabilidade Completa**: Veja inputs, outputs, tokens, latência
2. ✅ **Debugging Facilitado**: Rastreie todo o fluxo de execução dos agentes
3. ✅ **Análise de Performance**: Identifique gargalos e otimize chamadas
4. ✅ **Auditoria**: Rastreie todas as decisões e chamadas de ferramentas
5. ✅ **Sem Configuração Extra**: Funciona automaticamente com `OPENAI_API_KEY`

## Exemplo de Uso

### Executar uma Query

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Qual o prazo de cancelamento de NF-e?",
    "context": "Teste de tracing"
  }'
```

### Ver Traces no Dashboard

1. Aguarde alguns segundos após a execução
2. Acesse: https://platform.openai.com/logs
3. Procure pela execução mais recente
4. Você verá:
   - ✅ Chamadas a `file_search`
   - ✅ Handoff para especialista (se aplicável)
   - ✅ Chamadas a `logger`
   - ✅ Toda a cadeia de execução

## Referências

- [OpenAI Agents SDK Documentation](https://openai.github.io/openai-agents-js/)
- [OpenAI Agents SDK Tracing Guide](https://openai.github.io/openai-agents-python/tracing/)
- [OpenAI Platform Traces](https://platform.openai.com/docs/guides/tracing)
- [Dashboard de Traces](https://platform.openai.com/logs)

---

**Status**: ✅ Tracing automático habilitado e funcionando  
**Última atualização**: 2025-01-16
