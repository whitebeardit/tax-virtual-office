import { run } from "@openai/agents";
import { ensureApiKey } from "../config/openai.js";
import { AgentId, UserQueryRequest, UserQueryResponse } from "./types.js";
import { createSpecialistAgent } from "./agents-sdk.js";

export async function invokeSpecialist(
  agentId: AgentId,
  input: UserQueryRequest
): Promise<UserQueryResponse> {
  ensureApiKey();

  const specialist = createSpecialistAgent(agentId);
  
  const userInput = input.context
    ? `Pergunta: ${input.question}\nContexto: ${input.context}`
    : input.question;

  const result = await run(specialist, userInput);
  
  return {
    answer: result.finalOutput || "Não foi possível gerar uma resposta.",
  };
}
