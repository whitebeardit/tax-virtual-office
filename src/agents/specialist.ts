import { ensureApiKey, openaiClient } from "../config/openai.js";
import { AgentId, UserQueryRequest, UserQueryResponse } from "./types.js";
import { extractFirstText } from "./utils.js";

export async function invokeSpecialist(
  agent: AgentId,
  input: UserQueryRequest
): Promise<UserQueryResponse> {
  ensureApiKey();

  const completion = await openaiClient.responses.create({
    model: "gpt-4o-mini",
    input: `Agente: ${agent}\nPergunta: ${input.question}`,
  });

  const answer = extractFirstText(completion.output);
  return { answer };
}
