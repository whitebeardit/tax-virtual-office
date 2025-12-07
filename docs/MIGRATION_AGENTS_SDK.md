# Migração para OpenAI Agents SDK

## Resumo

O sistema foi migrado do uso da API padrão do OpenAI (`chat.completions.create`) para o **OpenAI Agents SDK** (`@openai/agents`), que fornece **tracing automático** no dashboard da OpenAI.

## O que mudou?

### Antes (API Padrão)
```typescript
const completion = await openaiClient.chat.completions.create({
  model: coordinator.model,
  messages: messages,
});
// ❌ Sem tracing automático
```

### Depois (Agents SDK)
```typescript
const agent = createOpenAIAgent("coordinator");
const result = await run(agent, userPrompt);
// ✅ Tracing automático habilitado
```

## Benefícios

1. **Tracing Automático**: Todas as chamadas aparecem automaticamente em https://platform.openai.com/logs
2. **Observabilidade Completa**: Veja inputs, outputs, tokens, latência, erros
3. **Debugging Facilitado**: Rastreie todo o fluxo de execução dos agentes
4. **Sem Configuração Extra**: Funciona automaticamente com `OPENAI_API_KEY`

## Arquivos Modificados

### 1. `package.json`
- ✅ Adicionado `@openai/agents`

### 2. `src/config/openai-agents.ts` (NOVO)
- Configuração do Agents SDK
- Função `createOpenAIAgent()` para criar agentes
- Funções auxiliares para verificar tracing

### 3. `src/agents/coordinator.ts`
- ✅ Migrado para usar `Agent` e `run()` do Agents SDK
- ✅ Mantém compatibilidade com interface existente
- ✅ Tracing automático habilitado

## Como Usar

### Executar uma Query

O uso permanece o mesmo:

```typescript
import { invokeCoordinator } from "./agents/coordinator.js";

const response = await invokeCoordinator({
  question: "Qual o prazo de cancelamento de NF-e?",
  context: "Contexto adicional se necessário",
});
```

### Ver Traces no Dashboard

1. Acesse: https://platform.openai.com/logs
2. Faça login com sua conta OpenAI
3. Você verá todos os traces das execuções dos agentes

**Nota**: Por padrão, apenas o owner da organização vê os traces. Para dar acesso a outros membros:
- Settings → Data Controls → Ajustar permissões do Traces dashboard

## Configuração

### Variáveis de Ambiente

```bash
# Obrigatório
OPENAI_API_KEY=sk-...

# Opcional: Desabilitar tracing (não recomendado)
OPENAI_AGENTS_DISABLE_TRACING=1
```

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

## Migração de Outros Agentes

Se você quiser migrar outros agentes (ex: `specialist-nfe`), siga o mesmo padrão:

```typescript
import { run } from "@openai/agents";
import { createOpenAIAgent } from "../config/openai-agents.js";

export async function invokeSpecialist(
  agentId: AgentId,
  input: UserQueryRequest
): Promise<UserQueryResponse> {
  const agent = createOpenAIAgent(agentId);
  const userPrompt = `Pergunta: ${input.question}`;
  
  const result = await run(agent, userPrompt);
  
  return {
    answer: result.finalOutput || "",
  };
}
```

## Troubleshooting

### Traces não aparecem?

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

### Erro: "Agent definition not found"

- Verifique se o `agentId` existe em `agents/agents.yaml`
- Verifique se o arquivo de instruções existe em `agents/prompts/`

### Erro: "OPENAI_API_KEY is not set"

- Configure a variável de ambiente `OPENAI_API_KEY`
- Verifique se está sendo carregada corretamente (`.env` ou sistema)

## Compatibilidade

- ✅ Interface `UserQueryRequest` e `UserQueryResponse` mantidas
- ✅ Workflow `runUserQueryWorkflow` funciona sem mudanças
- ✅ API REST `/query` continua funcionando normalmente
- ✅ Testes existentes devem continuar funcionando (pode precisar de ajustes menores)

## Próximos Passos

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Testar localmente:**
   ```bash
   npm run dev
   ```

3. **Fazer uma query e verificar traces:**
   - Execute uma query via API
   - Acesse https://platform.openai.com/logs
   - Verifique se os traces aparecem

4. **Migrar outros agentes (opcional):**
   - `specialist-nfe`
   - `specialist-nfce`
   - `specialist-cte`
   - `legislacao-ibs-cbs`

## Referências

- [OpenAI Agents SDK Documentation](https://openai.github.io/openai-agents-js/)
- [OpenAI Platform Traces](https://platform.openai.com/docs/guides/tracing)
- [Agents SDK Tracing Guide](https://openai.github.io/openai-agents-python/tracing/)
