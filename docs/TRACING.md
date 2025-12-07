# Tracing e Observabilidade

## Problema: Traces não aparecem no Dashboard da OpenAI

### Situação Atual

O sistema está usando a **API padrão do OpenAI** (`chat.completions.create`), que **não envia traces automaticamente** para o dashboard da OpenAI em `platform.openai.com/logs`.

**O que está acontecendo:**
- ✅ O código funciona corretamente e retorna respostas
- ✅ Os `agentTraces` na resposta são dados estruturados da aplicação
- ❌ Esses traces **não são** os traces do OpenAI Platform
- ❌ O dashboard da OpenAI só mostra traces do **OpenAI Agents SDK**

### Por que não aparece?

1. **API Padrão vs Agents SDK:**
   - `openai.chat.completions.create()` → API padrão → **sem tracing automático**
   - `openai.agents.*` → Agents SDK → **com tracing automático**

2. **Traces da Aplicação vs Traces do OpenAI:**
   - `agentTraces` no JSON de resposta = dados estruturados da sua aplicação
   - Traces no dashboard = dados coletados pelo OpenAI Agents SDK

## Soluções

### Opção 1: LangSmith (Recomendado - Mais Simples)

**Vantagens:**
- ✅ Não requer mudança de arquitetura
- ✅ Funciona com API padrão do OpenAI
- ✅ Dashboard completo de observabilidade
- ✅ Suporta múltiplos LLMs (OpenAI, Anthropic, etc.)

**Implementação:**

1. **Instalar dependências:**
```bash
npm install langsmith @langchain/openai
```

2. **Configurar variáveis de ambiente:**
```bash
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langsmith_api_key
LANGCHAIN_PROJECT=tax-virtual-office
```

3. **Atualizar `src/config/openai.ts`:**
```typescript
import { ChatOpenAI } from "@langchain/openai";
import { env } from "./env.js";

export const openaiClient = new ChatOpenAI({
  modelName: "gpt-4o", // ou o modelo que você usa
  openAIApiKey: env.openAiApiKey,
  temperature: 0.7,
});
```

4. **Atualizar `src/agents/coordinator.ts`:**
```typescript
import { openaiClient } from "../config/openai.js";

export async function invokeCoordinator(input: UserQueryRequest) {
  const messages = [
    { role: "system", content: coordinator.instructions },
    { role: "user", content: `Pergunta: ${input.question}` },
  ];

  // Agora com tracing automático via LangSmith
  const response = await openaiClient.invoke(messages);
  
  return {
    answer: response.content,
    // ... resto do código
  };
}
```

### Opção 2: OpenAI Agents SDK (Mudança Maior)

**Vantagens:**
- ✅ Tracing nativo no dashboard da OpenAI
- ✅ Integração completa com OpenAI Platform

**Desvantagens:**
- ❌ Requer refatoração significativa
- ❌ Mudança de arquitetura de agentes
- ❌ Apenas para OpenAI (não outros LLMs)

**Implementação:**

1. **Instalar SDK:**
```bash
npm install @openai/agents
```

2. **Refatorar para usar Agents SDK:**
```typescript
import { Agent } from "@openai/agents";

const agent = new Agent({
  name: "coordinator",
  instructions: coordinator.instructions,
  model: coordinator.model,
});

const response = await agent.run(input.question);
```

### Opção 3: Tracing Manual com Headers (Híbrido)

Manter a API padrão mas adicionar metadados manualmente:

```typescript
const completion = await openaiClient.chat.completions.create({
  model: coordinator.model,
  messages: messages,
  // Metadados para rastreamento manual
  metadata: {
    agentId: "coordinator",
    queryId: generateQueryId(),
    timestamp: new Date().toISOString(),
  },
});

// Logar manualmente para seu sistema de observabilidade
logger.info("OpenAI API Call", {
  model: coordinator.model,
  inputTokens: completion.usage?.prompt_tokens,
  outputTokens: completion.usage?.completion_tokens,
  // ... outros metadados
});
```

## Recomendação

**Use LangSmith (Opção 1)** porque:
1. Não requer mudança de arquitetura
2. Funciona com sua API atual
3. Dashboard completo e profissional
4. Suporta múltiplos LLMs
5. Integração simples

## Próximos Passos

1. Criar conta em [LangSmith](https://smith.langchain.com/)
2. Obter API key
3. Implementar integração (ver código acima)
4. Verificar traces no dashboard do LangSmith

## Referências

- [LangSmith Documentation](https://docs.smith.langchain.com/)
- [OpenAI Agents SDK Tracing](https://openai.github.io/openai-agents-python/tracing/)
- [OpenAI Platform Traces](https://platform.openai.com/docs/guides/tracing)
