import { ensureApiKey, openaiClient } from "../config/openai";
import { AgentId, UserQueryRequest, UserQueryResponse } from "./types";
import { extractFirstText } from "./utils";

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
