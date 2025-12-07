# Guia Rápido: Configurar Tracing com LangSmith

## Por que LangSmith?

O sistema atual usa `openai.chat.completions.create()` que **não envia traces** para o dashboard da OpenAI. LangSmith resolve isso sem mudar toda a arquitetura.

## Passo a Passo

### 1. Criar Conta no LangSmith

1. Acesse: https://smith.langchain.com/
2. Faça login com sua conta
3. Crie um projeto (ex: `tax-virtual-office`)
4. Copie sua API Key (Settings → API Keys)

### 2. Instalar Dependências

```bash
npm install langsmith @langchain/openai
```

### 3. Configurar Variáveis de Ambiente

Adicione ao seu `.env`:

```bash
# LangSmith Tracing
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=lsv2_pt_...sua_key_aqui
LANGCHAIN_PROJECT=tax-virtual-office

# OpenAI (já deve existir)
OPENAI_API_KEY=sk-...
```

### 4. Atualizar Código

**Opção A: Substituir completamente (Recomendado)**

Renomeie `src/config/openai-langsmith.example.ts` para `src/config/openai.ts` e ajuste os imports.

**Opção B: Manter compatibilidade (Híbrido)**

Crie um wrapper que usa LangSmith mas mantém a interface atual:

```typescript
// src/config/openai-langsmith.ts
import { ChatOpenAI } from "@langchain/openai";
import { env } from "./env.js";

export const langsmithClient = new ChatOpenAI({
  modelName: "gpt-4o",
  openAIApiKey: env.openAiApiKey,
});

// Adapter para manter compatibilidade
export async function createCompletionWithTracing(options: {
  model: string;
  messages: Array<{ role: string; content: string }>;
}) {
  const response = await langsmithClient.invoke(
    options.messages.map(m => `${m.role}: ${m.content}`).join("\n\n")
  );
  
  return {
    choices: [{
      message: {
        content: response.content,
      },
    }],
    usage: {
      prompt_tokens: response.response_metadata?.tokenUsage?.promptTokens || 0,
      completion_tokens: response.response_metadata?.tokenUsage?.completionTokens || 0,
      total_tokens: response.response_metadata?.tokenUsage?.totalTokens || 0,
    },
  };
}
```

### 5. Verificar Traces

1. Execute uma query no sistema
2. Acesse: https://smith.langchain.com/
3. Vá em "Traces" ou "Runs"
4. Você verá todas as chamadas com:
   - Input/Output completo
   - Tokens usados
   - Tempo de execução
   - Erros (se houver)

## Troubleshooting

### Traces não aparecem?

1. **Verificar variáveis de ambiente:**
```bash
echo $LANGCHAIN_TRACING_V2  # deve ser "true"
echo $LANGCHAIN_API_KEY      # deve ter valor
echo $LANGCHAIN_PROJECT      # deve ter valor
```

2. **Verificar logs:**
```bash
# LangSmith loga erros no console
# Procure por mensagens como "Failed to send trace"
```

3. **Testar conexão:**
```typescript
import { Client } from "langsmith";

const client = new Client({
  apiKey: process.env.LANGCHAIN_API_KEY,
});

// Deve funcionar sem erro
const projects = await client.listProjects();
console.log("Projetos:", projects);
```

### Performance

LangSmith adiciona overhead mínimo (~10-50ms por chamada) porque envia traces de forma assíncrona.

## Alternativa: Tracing Manual

Se não quiser usar LangSmith, você pode criar seu próprio sistema de logging:

```typescript
// src/utils/tracing.ts
import { logger } from "./logger.js";

export async function logOpenAICall(
  model: string,
  messages: any[],
  response: any,
  metadata?: Record<string, any>
) {
  await logger.info("OpenAI API Call", {
    model,
    inputTokens: response.usage?.prompt_tokens,
    outputTokens: response.usage?.completion_tokens,
    totalTokens: response.usage?.total_tokens,
    messages: messages.map(m => ({ role: m.role, length: m.content.length })),
    ...metadata,
  });
  
  // Opcional: enviar para seu sistema de observabilidade
  // await sendToObservabilityPlatform({ ... });
}
```

Mas LangSmith é muito mais completo e fácil de usar.
