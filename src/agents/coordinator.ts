import { run } from "@openai/agents";
import type { RunStreamEvent } from "@openai/agents";
import { createOpenAIAgent, getTracingInfo } from "../config/openai-agents.js";
import { getAgentDefinition } from "./registry.js";
import type {
  AgentTraceExample,
  TriageResult,
  UserQueryRequest,
  UserQueryResponse,
} from "./types.js";

/** Callback para eventos de stream do coordinator (thought, tool, agent). */
export type CoordinatorStreamEventCallback = (event: {
  type: "thought" | "tool" | "agent";
  delta?: string;
  name?: string;
  args?: unknown;
}) => void;

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

  // Construir o prompt do usuário (incluir contexto pré-recuperado quando disponível)
  let userPrompt = `Pergunta: ${input.question}${
    input.context ? `\nContexto: ${input.context}` : ""
  }`;
  if (input.preRetrievedContext) {
    userPrompt = `[CONTEXTO PRÉ-RECUPERADO dos vector stores]\n${input.preRetrievedContext}\n\n${userPrompt}\n\nUse o contexto acima como base. Só chame file-search se precisar de mais detalhes em um store específico.`;
  }

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

  const plan = buildInstrumentedPlan(input.question, input.triageResult, input.storesQueried);
  const sources = [
    "agents/prompts/coordinator.system.md",
    "docs/WORKFLOWS.md",
    "docs/PORTAIS.md",
    ...(input.storesQueried || []),
  ];

  return {
    answer,
    plan,
    agentTraces: buildTraceExamples(),
    sources,
  };
}

/**
 * Invoca o coordenador em modo streaming: emite eventos thought/tool/agent via callback
 * e retorna a resposta final após stream.completed.
 */
export async function invokeCoordinatorStream(
  input: UserQueryRequest,
  onEvent: CoordinatorStreamEventCallback
): Promise<UserQueryResponse> {
  const agent = createOpenAIAgent("coordinator");

  let userPrompt = `Pergunta: ${input.question}${
    input.context ? `\nContexto: ${input.context}` : ""
  }`;
  if (input.preRetrievedContext) {
    userPrompt = `[CONTEXTO PRÉ-RECUPERADO dos vector stores]\n${input.preRetrievedContext}\n\n${userPrompt}\n\nUse o contexto acima como base. Só chame file-search se precisar de mais detalhes em um store específico.`;
  }

  const stream = await run(agent, userPrompt, { stream: true } as { stream: true });

  for await (const event of stream as AsyncIterable<RunStreamEvent>) {
    if (event.type === "raw_model_stream_event") {
      const data = event.data as { type?: string; delta?: string };
      if (data?.type === "output_text_delta" && typeof data.delta === "string") {
        onEvent({ type: "thought", delta: data.delta });
      }
    } else if (event.type === "run_item_stream_event") {
      const ev = event as { name: string; item: { type?: string; rawItem?: { name?: string; arguments?: string }; content?: unknown } };
      if (ev.name === "tool_called" || ev.name === "tool_output") {
        const name = ev.item?.rawItem && typeof ev.item.rawItem === "object" && "name" in ev.item.rawItem
          ? String((ev.item.rawItem as { name?: string }).name)
          : "tool";
        const args = ev.item?.rawItem && typeof ev.item.rawItem === "object" && "arguments" in ev.item.rawItem
          ? (ev.item.rawItem as { arguments?: string }).arguments
          : undefined;
        onEvent({ type: "tool", name, args: args ? tryParseJson(args) : undefined });
      } else if (ev.name === "reasoning_item_created" && ev.item && "rawItem" in ev.item) {
        const raw = (ev.item as { rawItem?: { content?: unknown } }).rawItem;
        const text = raw && typeof raw === "object" && "content" in raw ? String((raw as { content?: string }).content ?? "") : "";
        if (text) onEvent({ type: "thought", delta: text });
      } else if (ev.name === "handoff_occurred" || ev.name === "handoff_requested") {
        const agentName = ev.item && typeof ev.item === "object" && "agent" in ev.item
          ? String((ev.item as { agent?: { name?: string } }).agent?.name ?? "agent")
          : "agent";
        onEvent({ type: "agent", name: agentName });
      }
    } else if (event.type === "agent_updated_stream_event") {
      const ev = event as { agent?: { name?: string } };
      const name = ev.agent?.name ?? "agent";
      onEvent({ type: "agent", name });
    }
  }

  await (stream as { completed: Promise<void> }).completed;

  const answer = (stream as { finalOutput?: string }).finalOutput ?? "";
  const plan = buildInstrumentedPlan(input.question, input.triageResult, input.storesQueried);
  const sources = [
    "agents/prompts/coordinator.system.md",
    "docs/WORKFLOWS.md",
    "docs/PORTAIS.md",
    ...(input.storesQueried ?? []),
  ];

  const tracingInfo = getTracingInfo();
  if (tracingInfo.enabled) {
    console.log(
      `[Tracing] Coordenador (stream) executado. Ver traces em: ${tracingInfo.dashboardUrl}`
    );
  }

  return {
    answer,
    plan,
    agentTraces: buildTraceExamples(),
    sources,
  };
}

function tryParseJson(s: string): unknown {
  try {
    return JSON.parse(s) as unknown;
  } catch {
    return undefined;
  }
}

function buildInstrumentedPlan(
  question: string,
  triageResult?: TriageResult,
  storesQueried?: string[]
): string[] {
  const steps = [
    "Triage (classificação da pergunta): trilha, família, doc_type.",
    triageResult
      ? `Triage resultado: trilha=${triageResult.trail}${triageResult.family ? `, família=${triageResult.family}` : ""}${triageResult.doc_type ? `, doc_type=${triageResult.doc_type}` : ""}.`
      : null,
    "Source planner: escolha de 2–3 vector stores prioritários.",
    storesQueried?.length
      ? `Stores consultados: ${storesQueried.join(", ")}.`
      : null,
    "Retrieval: file-search nos stores planejados.",
    "Coordinator: usar contexto recuperado e/ou file-search adicional; delegar a especialistas quando necessário.",
    "Consolidar resposta com referências explícitas e traces.",
  ].filter(Boolean) as string[];

  return steps.length > 0 ? steps : [
    "Carregar instruções do coordinator e mapear especialistas.",
    `Distribuir follow-ups para especialistas à pergunta: ${question}.`,
    "Consolidar a resposta com referências e traces.",
  ];
}

function buildTraceExamples(): AgentTraceExample[] {
  return [
    {
      agentId: "coordinator" as const,
      calledTools: ["file-search:docs/WORKFLOWS.md", "web:portal-fazenda"],
      sample:
        "[coordinator] file-search → encontrou manual de NF-e em docs/PORTAIS.md; web → validou versão do layout no portal da SEFAZ; despacho para spec-mercadorias e spec-transporte.",
      note: "Trace mostra decisões do coordinator com fontes locais e externas.",
    },
    {
      agentId: "spec-mercadorias" as const,
      calledTools: ["file-search:docs/AGENTS.md"],
      sample:
        "[spec-mercadorias] file-search → extraiu regras de destaque de ICMS do FAQ do portal; consolidou notas e citou seção específica na resposta final.",
    },
  ];
}
