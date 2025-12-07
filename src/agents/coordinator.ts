import { ensureApiKey, openaiClient } from "../config/openai";
import { UserQueryRequest, UserQueryResponse } from "./types";

export async function invokeCoordinator(
  input: UserQueryRequest
): Promise<UserQueryResponse> {
  ensureApiKey();

  // Placeholder call to coordinator agent. Replace with Agents SDK client when available.
  const prompt = `Pergunta: ${input.question}\nContexto: ${input.context || ""}`;
  const completion = await openaiClient.responses.create({
    model: "gpt-4o-mini",
    input: prompt,
  });

  const answer = completion.output[0].content[0].text || "";
  return {
    answer,
    plan: ["Consultar especialistas", "Consolidar referências"],
  };
}
