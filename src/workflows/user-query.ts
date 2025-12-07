import { invokeCoordinator } from "../agents/coordinator";
import { getAgentDefinition } from "../agents/registry";
import { AgentId, UserQueryRequest, UserQueryResponse } from "../agents/types";

export async function runUserQueryWorkflow(
  input: UserQueryRequest
): Promise<UserQueryResponse> {
  const coordinatorResponse = await invokeCoordinator(input);
  const specialistIds = pickSpecialists(input.question);
  const specialistNames = specialistIds.map(
    (id) => getAgentDefinition(id).name
  );
  const tools = collectTools(["coordinator", ...specialistIds]);

  return {
    ...coordinatorResponse,
    plan: [
      "Coordinator analisa contexto e delega passos para especialistas.",
      `Especialistas acionados: ${specialistNames.join(", ") || "nenhum"}.`,
      `Ferramentas previstas: ${tools.join(", ") || "nenhuma"}.`,
      "Consolidar referências e devolver fontes reais.",
    ],
    sources: specialistNames,
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
