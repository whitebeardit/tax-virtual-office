import { run } from "@openai/agents";
import { createOpenAIAgent, getTracingInfo } from "../config/openai-agents.js";
import { getAgentDefinition } from "./registry.js";
import {
  AgentTraceExample,
  UserQueryRequest,
  UserQueryResponse,
} from "./types.js";

/**
 * Invoca o agente coordenador usando o OpenAI Agents SDK
 * 
 * Com o Agents SDK, todas as chamadas são automaticamente rastreadas
 * e aparecem no dashboard da OpenAI: https://platform.openai.com/logs
 */
export async function invokeCoordinator(
  input: UserQueryRequest
): Promise<UserQueryResponse> {
  // Criar agente usando o Agents SDK
  const agent = createOpenAIAgent("coordinator");

  // Construir o prompt do usuário
  const userPrompt = `Pergunta: ${input.question}${
    input.context ? `\nContexto: ${input.context}` : ""
  }`;

  // Executar o agente com tracing automático
  // O run() automaticamente envia traces para o dashboard da OpenAI
  const result = await run(agent, userPrompt);

  // Extrair a resposta final
  const answer = result.finalOutput || "";

  // Verificar se o tracing está ativo (para logs informativos)
  const tracingInfo = getTracingInfo();
  if (tracingInfo.enabled) {
    console.log(
      `[Tracing] Coordenador executado. Ver traces em: ${tracingInfo.dashboardUrl}`
    );
  }

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
