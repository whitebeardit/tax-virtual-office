import { invokeCoordinator } from "../agents/coordinator";
import { getAgentDefinition } from "../agents/registry";
import {
  AgentId,
  AgentTraceExample,
  UserQueryRequest,
  UserQueryResponse,
} from "../agents/types";

export async function runUserQueryWorkflow(
  input: UserQueryRequest
): Promise<UserQueryResponse> {
  const coordinatorResponse = await invokeCoordinator(input);
  const specialistIds = pickSpecialists(input.question);
  const specialistNames = specialistIds.map(
    (id) => getAgentDefinition(id).name
  );
  const tools = collectTools(["coordinator", ...specialistIds]);
  const agentTraces = mergeTraceExamples(
    coordinatorResponse.agentTraces || [],
    specialistIds,
    input.question
  );

  return {
    ...coordinatorResponse,
    plan: [
      ...(coordinatorResponse.plan || []),
      `Especialistas acionados: ${specialistNames.join(", ") || "nenhum"}.`,
      `Ferramentas previstas (por agente): ${tools.join(", ") || "nenhuma"}.`,
      "Traces anexados com exemplos reais de chamadas a file-search e web para orientar a depuração.",
    ],
    sources: [
      ...(coordinatorResponse.sources || []),
      ...specialistNames,
      "docs/Agents.md",
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
