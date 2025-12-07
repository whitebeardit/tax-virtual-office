import { ensureApiKey, openaiClient } from "../config/openai";
import { getAgentDefinition } from "./registry";
import { UserQueryRequest, UserQueryResponse } from "./types";
import { extractFirstText } from "./utils";

export async function invokeCoordinator(
  input: UserQueryRequest
): Promise<UserQueryResponse> {
  ensureApiKey();

  const coordinator = getAgentDefinition("coordinator");

  const messages = [
    {
      role: "system" as const,
      content: [{ type: "input_text" as const, text: coordinator.instructions }],
    },
    {
      role: "user" as const,
      content: [
        {
          type: "input_text" as const,
          text: `Pergunta: ${input.question}\nContexto: ${input.context || ""}`,
        },
      ],
    },
  ];

  const completion = await openaiClient.responses.create({
    model: coordinator.model,
    input: messages,
  });

  const answer = extractFirstText(completion.output);
  return {
    answer,
    plan: ["Consultar especialistas", "Consolidar referências"],
  };
}
