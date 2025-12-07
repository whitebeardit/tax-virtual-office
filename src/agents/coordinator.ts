import { ensureApiKey, openaiClient } from "../config/openai";
import { UserQueryRequest, UserQueryResponse } from "./types";
import { extractFirstText } from "./utils";

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

  const answer = extractFirstText(completion.output);
  return {
    answer,
    plan: ["Consultar especialistas", "Consolidar referências"],
  };
}
