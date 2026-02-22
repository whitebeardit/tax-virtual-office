import { run } from "@openai/agents";
import { createOpenAIAgent, getTracingInfo } from "../config/openai-agents.js";

export interface EnricherInput {
  question: string;
  draftAnswer: string;
  draftSources?: string[];
}

export interface EnricherOutput {
  answer: string;
  sources?: string[];
}

export async function invokeTrustedSourcesEnricher(
  input: EnricherInput
): Promise<EnricherOutput> {
  const agent = createOpenAIAgent("trusted-sources-enricher");

  const sourcesText =
    input.draftSources && input.draftSources.length > 0
      ? `\n\nFontes do draft (para contexto):\n- ${input.draftSources.join("\n- ")}`
      : "";

  const userPrompt = `Pergunta do usuário:\n${input.question}\n\nResposta draft:\n${input.draftAnswer}${sourcesText}\n\nTarefa: Enriquecer a resposta draft usando apenas fontes confiáveis (bases internas via file-search e fontes oficiais permitidas via web).`;

  const result = await run(agent, userPrompt);
  const answer = result.finalOutput || "";

  const tracingInfo = getTracingInfo();
  if (tracingInfo.enabled) {
    console.log(
      `[Tracing] Enricher executado. Ver traces em: ${tracingInfo.dashboardUrl}`
    );
  }

  return {
    answer,
    sources: [
      "agents/prompts/trusted-sources-enricher.system.md",
      "config/document-sources.json",
    ],
  };
}

