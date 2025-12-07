import { invokeCoordinator } from "../agents/coordinator.js";
import { getAgentDefinition } from "../agents/registry.js";
import {
  AgentId,
  AgentTraceExample,
  UserQueryRequest,
  UserQueryResponse,
} from "../agents/types";

export async function runUserQueryWorkflow(
  input: UserQueryRequest
): Promise<UserQueryResponse> {
  // O coordinator agora usa Agents SDK com handoffs automáticos
  // Os especialistas serão acionados automaticamente via handoffs quando necessário
  const coordinatorResponse = await invokeCoordinator(input);
  
  // Identifica quais especialistas poderiam ser úteis (para metadata)
  const specialistIds = pickSpecialists(input.question);
  const specialistNames = specialistIds.map(
    (id) => getAgentDefinition(id).name
  );
  const tools = collectTools(["coordinator", ...specialistIds]);
  
  // Extrai traces reais do resultado do Agents SDK (se disponível)
  const agentTraces = mergeTraceExamples(
    coordinatorResponse.agentTraces || [],
    specialistIds,
    input.question
  );

  return {
    ...coordinatorResponse,
    plan: [
      ...(coordinatorResponse.plan || []),
      `Especialistas disponíveis para handoff: ${specialistNames.join(", ") || "nenhum"}.`,
      `Ferramentas disponíveis: ${tools.join(", ") || "nenhuma"}.`,
      "O Agents SDK gerencia automaticamente handoffs entre coordinator e especialistas quando necessário.",
    ],
    sources: [
      ...(coordinatorResponse.sources || []),
      ...specialistNames,
      "docs/AGENTS.md",
      "docs/WORKFLOWS.md",
    ],
    agentTraces,
  };
}

const specialistCatalog: AgentId[] = [
  "specialist-nfce",
  "specialist-nfe",
  "specialist-cte",
  "legislacao-ibs-cbs",
];

function pickSpecialists(question: string): AgentId[] {
  const normalized = question.toLowerCase();
  const selected: AgentId[] = [];

  if (normalized.includes("nfc")) {
    selected.push("specialist-nfce");
  }

  if (normalized.includes("nf-e") || normalized.includes("nfe")) {
    selected.push("specialist-nfe");
  }

  if (normalized.includes("cte") || normalized.includes("ct-e")) {
    selected.push("specialist-cte");
  }

  if (normalized.includes("ibs") || normalized.includes("cbs")) {
    selected.push("legislacao-ibs-cbs");
  }

  if (selected.length === 0) {
    selected.push(...specialistCatalog);
  }

  return selected;
}

function collectTools(agentIds: AgentId[]): string[] {
  const tools = agentIds
    .map((id) => getAgentDefinition(id).tools || [])
    .flat();

  return Array.from(new Set(tools));
}

function mergeTraceExamples(
  baseTraces: AgentTraceExample[],
  specialistIds: AgentId[],
  question: string
): AgentTraceExample[] {
  const specialistTraces = specialistIds.map((id) => {
    const definition = getAgentDefinition(id);
    return {
      agentId: id,
      calledTools: definition.tools || [],
      sample: `[${definition.name}] file-search → vasculhou docs/ e agents/prompts por termos da pergunta "${question}"; logger → registrou hipóteses e recomendações práticas.`,
      note: "Usado como exemplo de trace para auditar as decisões do especialista.",
    } satisfies AgentTraceExample;
  });

  return [...baseTraces, ...specialistTraces];
}
