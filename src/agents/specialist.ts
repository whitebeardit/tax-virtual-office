import { ensureApiKey, openaiClient } from "../config/openai.js";
import { AgentId, UserQueryRequest, UserQueryResponse } from "./types.js";
import { extractFirstText } from "./utils.js";

export async function invokeSpecialist(
  agent: AgentId,
  input: UserQueryRequest
): Promise<UserQueryResponse> {
  ensureApiKey();

  const completion = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `Agente: ${agent}\nPergunta: ${input.question}`,
      },
    ],
  });

  const answer = extractFirstText(completion);
  return { answer };
}
