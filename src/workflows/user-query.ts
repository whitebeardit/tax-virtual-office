/**
 * Workflow determinístico do /query:
 * triage → source planner → retrieval → coordinator (com contexto pré-recuperado) → (opcional) enricher → resposta.
 */

import { invokeCoordinator, invokeCoordinatorStream } from "../agents/coordinator.js";
import { invokeTrustedSourcesEnricher } from "../agents/enricher.js";
import { getAgentDefinition } from "../agents/registry.js";
import type { AgentId, UserQueryRequest, UserQueryResponse } from "../agents/types.js";
import { classifyQuestion } from "./triage.js";
import { planStores } from "./source-planner.js";
import { runRetrieval } from "./retrieval.js";
import { logger } from "../utils/logger.js";

/** Evento emitido pelo workflow em modo stream (step, thought, tool, agent, handoff, answer_delta, done). */
export type WorkflowStreamEvent =
  | { type: "step"; step: string; label?: string }
  | { type: "thought"; delta?: string; name?: string; args?: unknown }
  | { type: "tool"; name?: string; delta?: string; args?: unknown }
  | { type: "agent"; name?: string; delta?: string; args?: unknown }
  | { type: "handoff"; to?: string; messageSummary?: string }
  | { type: "answer_delta"; delta?: string }
  | { type: "done"; answer: string; plan?: string[]; sources?: string[]; agentTraces?: UserQueryResponse["agentTraces"] };

export type WorkflowStreamEventCallback = (event: WorkflowStreamEvent) => void;

const SPECIALIST_CATALOG: AgentId[] = [
  "spec-mercadorias",
  "spec-transporte",
  "legislacao-ibs-cbs",
];

function shouldRunTrustedSourcesEnricher(
  triage: import("../agents/types.js").TriageResult,
  question: string
): boolean {
  if (triage.trail === "Legislacao") return true;
  const q = question.toLowerCase();
  return (
    q.includes("cgibs") ||
    q.includes("pré-cgibs") ||
    q.includes("pre-cgibs") ||
    q.includes("ibs") ||
    q.includes("cbs") ||
    q.includes("impactos administrativos") ||
    q.includes("reforma tribut")
  );
}

function dedupeStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter((v) => typeof v === "string" && v.trim().length > 0)));
}

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

  // Enriquecimento opcional: fontes confiáveis (CGIBS + Pré-CGIBS + bases internas)
  let finalAnswer = coordinatorResponse.answer;
  let finalSources = sources;

  if (shouldRunTrustedSourcesEnricher(triageResult, input.question)) {
    const enriched = await invokeTrustedSourcesEnricher({
      question: input.question,
      draftAnswer: coordinatorResponse.answer,
      draftSources: sources,
    });
    if (enriched.answer && enriched.answer.trim().length > 0) {
      finalAnswer = enriched.answer;
      finalSources = dedupeStrings([...(sources || []), ...(enriched.sources || [])]);
    }
  }

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
    answer: finalAnswer,
    plan,
    sources: finalSources,
  };
}

/**
 * Executa o mesmo fluxo em modo streaming: emite eventos step/thought/tool/agent/done via callback.
 */
export async function runUserQueryWorkflowStream(
  input: UserQueryRequest,
  onEvent: WorkflowStreamEventCallback
): Promise<void> {
  const t0 = Date.now();

  onEvent({ type: "step", step: "triage_start", label: "Classificando pergunta…" });
  const triageResult = classifyQuestion(input.question);
  onEvent({ type: "step", step: "triage_done", label: "Classificação concluída" });

  const storePlan = planStores(triageResult);
  onEvent({ type: "step", step: "retrieval_start", label: "Consultando bases…" });
  const retrieval = await runRetrieval(input.question, storePlan);
  onEvent({ type: "step", step: "retrieval_done", label: "Consulta concluída" });

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

  onEvent({ type: "step", step: "coordinator_start", label: "Coordenador ativo…" });

  const coordinatorResponse = await invokeCoordinatorStream(coordinatorInput, (ev) => {
    if (ev.type === "thought") onEvent({ type: "thought", delta: ev.delta });
    else if (ev.type === "tool") onEvent({ type: "tool", name: ev.name, args: ev.args });
    else if (ev.type === "agent") onEvent({ type: "agent", name: ev.name });
    else if (ev.type === "handoff") onEvent({ type: "handoff", to: ev.to, messageSummary: ev.messageSummary });
    else if (ev.type === "answer_delta") onEvent({ type: "answer_delta", delta: ev.delta });
  });

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
    "User query workflow (stream) completed"
  );

  // Enriquecimento opcional (pós-coordinator)
  let finalAnswer = coordinatorResponse.answer;
  let finalSources = sources;

  if (shouldRunTrustedSourcesEnricher(triageResult, input.question)) {
    onEvent({ type: "step", step: "enricher_start", label: "Enriquecendo com fontes confiáveis…" });
    const enriched = await invokeTrustedSourcesEnricher({
      question: input.question,
      draftAnswer: coordinatorResponse.answer,
      draftSources: sources,
    });
    if (enriched.answer && enriched.answer.trim().length > 0) {
      finalAnswer = enriched.answer;
      finalSources = dedupeStrings([...(sources || []), ...(enriched.sources || [])]);
    }
    onEvent({ type: "step", step: "enricher_done", label: "Enriquecimento concluído" });
  }

  onEvent({
    type: "done",
    answer: finalAnswer,
    plan,
    sources: finalSources,
    agentTraces: coordinatorResponse.agentTraces,
  });
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
