/**
 * Workflow determinístico do /query:
 * triage → source planner → retrieval → coordinator (com contexto pré-recuperado) → resposta.
 */

import { invokeCoordinator } from "../agents/coordinator.js";
import { getAgentDefinition } from "../agents/registry.js";
import type { AgentId, UserQueryRequest, UserQueryResponse } from "../agents/types.js";
import { classifyQuestion } from "./triage.js";
import { planStores } from "./source-planner.js";
import { runRetrieval } from "./retrieval.js";
import { logger } from "../utils/logger.js";

const SPECIALIST_CATALOG: AgentId[] = [
  "spec-mercadorias",
  "spec-transporte",
  "legislacao-ibs-cbs",
];

/**
 * Executa o fluxo: triage → planner → retrieval → coordinator.
 */
export async function runUserQueryWorkflow(
  input: UserQueryRequest
): Promise<UserQueryResponse> {
  const t0 = Date.now();

  const triageResult = classifyQuestion(input.question);
  const storePlan = planStores(triageResult);
  const retrieval = await runRetrieval(input.question, storePlan);

  const contextParts: string[] = [];
  for (const [storeId, texts] of retrieval.byStore) {
    if (texts.length > 0) {
      contextParts.push(`## ${storeId}\n${texts.join("\n\n")}`);
    }
  }
  const preRetrievedContext =
    contextParts.length > 0 ? contextParts.join("\n\n---\n\n") : "";

  const coordinatorInput: UserQueryRequest = {
    ...input,
    preRetrievedContext: preRetrievedContext || undefined,
    triageResult,
    storesQueried: retrieval.storesQueried,
  };

  const coordinatorResponse = await invokeCoordinator(coordinatorInput);

  const specialistIds = pickSpecialistsFromTriage(triageResult);
  const specialistNames = specialistIds.map(
    (id) => getAgentDefinition(id).name
  );

  const plan = [
    ...(coordinatorResponse.plan || []),
    `Especialistas sugeridos (trilha ${triageResult.trail}): ${specialistNames.join(", ") || "nenhum"}.`,
  ];

  const sources = [
    ...(coordinatorResponse.sources || []),
    ...specialistNames,
    "docs/AGENTS.md",
    "docs/WORKFLOWS.md",
  ];

  const elapsed = Date.now() - t0;
  const hitsByStore: Record<string, number> = {};
  for (const [storeId, texts] of retrieval.byStore) {
    hitsByStore[storeId] = texts.length;
  }
  logger.info(
    {
      triageTrail: triageResult.trail,
      storesQueried: retrieval.storesQueried,
      hitsByStore,
      elapsedMs: elapsed,
    },
    "User query workflow completed"
  );

  return {
    ...coordinatorResponse,
    plan,
    sources,
  };
}

function pickSpecialistsFromTriage(
  triage: import("../agents/types.js").TriageResult
): AgentId[] {
  const selected: AgentId[] = [];

  if (
    triage.family === "mercadorias" ||
    triage.doc_type === "nfe" ||
    triage.doc_type === "nfce"
  ) {
    selected.push("spec-mercadorias");
  }
  if (
    triage.family === "transporte" ||
    triage.doc_type === "cte" ||
    triage.doc_type === "mdfe" ||
    triage.doc_type === "bpe"
  ) {
    selected.push("spec-transporte");
  }
  if (triage.trail === "Legislacao") {
    selected.push("legislacao-ibs-cbs");
  }

  if (selected.length === 0) {
    return [...SPECIALIST_CATALOG];
  }
  return selected;
}
