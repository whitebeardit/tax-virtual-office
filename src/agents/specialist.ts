import { run } from "@openai/agents";
import { createOpenAIAgent } from "../config/openai-agents.js";
import { AgentId, UserQueryRequest, UserQueryResponse } from "./types.js";

/**
 * Invoca um agente especialista usando o OpenAI Agents SDK
 * 
 * Com o Agents SDK, todas as chamadas são automaticamente rastreadas
 * e aparecem no dashboard da OpenAI: https://platform.openai.com/logs
 */
export async function invokeSpecialist(
  agentId: AgentId,
  input: UserQueryRequest
): Promise<UserQueryResponse> {
  // Criar agente usando o Agents SDK
  const agent = createOpenAIAgent(agentId);

  // Construir o prompt do usuário
  const userPrompt = `Agente: ${agentId}\nPergunta: ${input.question}${
    input.context ? `\nContexto: ${input.context}` : ""
  }`;

  // Executar o agente com tracing automático
  // O run() automaticamente envia traces para o dashboard da OpenAI
  const result = await run(agent, userPrompt);

  // Extrair a resposta final
  const answer = result.finalOutput || "";

  return { answer };
}
