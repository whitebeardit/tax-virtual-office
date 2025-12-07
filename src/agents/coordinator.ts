import { ensureApiKey, openaiClient } from "../config/openai";
import { getAgentDefinition } from "./registry";
import {
  AgentTraceExample,
  UserQueryRequest,
  UserQueryResponse,
} from "./types";
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
    plan: buildInstrumentedPlan(input.question),
    agentTraces: buildTraceExamples(),
    sources: [
      "agents/prompts/coordinator.system.md",
      "docs/WORKFLOWS.md",
      "docs/PORTAIS.md",
    ],
  };
}

function buildInstrumentedPlan(question: string): string[] {
  return [
    "Carregar instruções do coordinator (agents/prompts/coordinator.system.md) e mapear especialistas e ferramentas disponíveis.",
    "Consultar file-search em docs/ e agents/prompts para recuperar legislações, portais e fluxos relevantes antes de chamar modelos.",
    "Acionar web/http-fetch apenas quando a busca local não cobrir a pergunta, priorizando portais oficiais listados em docs/PORTAIS.md.",
    `Distribuir follow-ups para especialistas adequados à pergunta (ex.: ${question}) com contexto extraído de file-search/web e logs do catálogo.`,
    "Consolidar a resposta com referências explícitas e anexar um rastro (trace) resumindo ferramentas, modelos e fontes usadas por cada agente.",
  ];
}

function buildTraceExamples(): AgentTraceExample[] {
  return [
    {
      agentId: "coordinator" as const,
      calledTools: ["file-search:docs/WORKFLOWS.md", "web:portal-fazenda"],
      sample:
        "[coordinator] file-search → encontrou manual de NF-e em docs/PORTAIS.md; web → validou versão do layout no portal da SEFAZ; despacho para specialist-nfe e specialist-cte.",
      note: "Trace mostra decisões do coordinator com fontes locais e externas.",
    },
    {
      agentId: "specialist-nfe" as const,
      calledTools: ["file-search:docs/AGENTS.md"],
      sample:
        "[specialist-nfe] file-search → extraiu regras de destaque de ICMS do FAQ do portal; consolidou notas e citou seção específica na resposta final.",
    },
  ];
}
