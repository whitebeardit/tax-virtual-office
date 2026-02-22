/**
 * Configuração do OpenAI Agents SDK
 * 
 * O Agents SDK fornece tracing automático para o dashboard da OpenAI.
 * Traces aparecem automaticamente em: https://platform.openai.com/logs
 * 
 * Requisitos:
 * - OPENAI_API_KEY configurado
 * - Tracing é habilitado por padrão (não requer configuração adicional)
 */

import { Agent, handoff } from "@openai/agents";
import { env } from "./env.js";
import { getAgentDefinition } from "../agents/registry.js";
import type { AgentId } from "../agents/types.js";
import {
  coordinatorTools,
  specialistTools,
  classifierTools,
  triageRouterTools,
  sourcePlannerTools,
} from "../agents/tools.js";

// Cache de agentes para evitar recriação
const agentCache = new Map<AgentId, Agent>();

function getToolsForAgent(agentId: AgentId): any[] {
  if (agentId === "trusted-sources-enricher") return coordinatorTools;
  if (agentId === "triage-router") return triageRouterTools;
  if (agentId === "source-planner") return sourcePlannerTools;
  return specialistTools;
}

/**
 * Cria uma instância de Agent do OpenAI Agents SDK
 * 
 * @param agentId - ID do agente conforme definido em agents.yaml
 * @returns Instância configurada do Agent com tracing automático, tools e handoffs
 */
export function createOpenAIAgent(agentId: AgentId): Agent {
  // Verificar cache
  if (agentCache.has(agentId)) {
    return agentCache.get(agentId)!;
  }

  const definition = getAgentDefinition(agentId);
  
  // Verificar se a API key está configurada
  if (!env.openAiApiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  // Determinar tools baseado no tipo de agente
  let tools: any[] = [];
  let handoffs: any[] = [];

  if (agentId === "coordinator") {
    // Coordinator tem file-search, web e logger
    tools = coordinatorTools;
    
    // Configurar handoffs: triage/router, source planner e especialistas por capacidade
    const specialistIds: AgentId[] = [
      "triage-router",
      "source-planner",
      "spec-mercadorias",
      "spec-transporte",
      "legislacao-ibs-cbs",
    ];

    handoffs = specialistIds.map((specialistId) => {
      const specialistAgent = createSpecialistAgent(specialistId);
      return handoff(specialistAgent, {
        toolNameOverride: `handoff_to_${specialistId.replace("-", "_")}`,
        toolDescriptionOverride: `Delega a pergunta para o especialista ${getAgentDefinition(specialistId).name}. Use quando a pergunta requer conhecimento especializado sobre ${specialistId}.`,
      });
    });
  } else if (agentId === "tax-document-classifier") {
    tools = classifierTools;
  } else {
    // Especialistas, triage, source-planner: tools por agente
    tools = getToolsForAgent(agentId);
  }

  // Criar agente com o Agents SDK
  // O tracing é habilitado automaticamente
  const agent = new Agent({
    name: definition.name,
    instructions: definition.instructions,
    model: definition.model,
    tools: tools.length > 0 ? tools : undefined,
    handoffs: handoffs.length > 0 ? handoffs : undefined,
    // O SDK usa automaticamente OPENAI_API_KEY da variável de ambiente
  });

  // Cachear agente
  agentCache.set(agentId, agent);

  return agent;
}

/**
 * Cria um agente especialista (sem handoffs, apenas tools)
 */
function createSpecialistAgent(agentId: AgentId): Agent {
  // Verificar cache
  if (agentCache.has(agentId)) {
    return agentCache.get(agentId)!;
  }

  const definition = getAgentDefinition(agentId);
  const tools = getToolsForAgent(agentId);

  const agent = new Agent({
    name: definition.name,
    instructions: definition.instructions,
    model: definition.model,
    tools,
  });

  // Cachear
  agentCache.set(agentId, agent);

  return agent;
}

/**
 * Verifica se o tracing está habilitado
 * 
 * Por padrão, o tracing está sempre habilitado no Agents SDK.
 * Para desabilitar, defina: OPENAI_AGENTS_DISABLE_TRACING=1
 */
export function isTracingEnabled(): boolean {
  return process.env.OPENAI_AGENTS_DISABLE_TRACING !== "1";
}

/**
 * Obtém informações sobre o tracing atual
 */
export function getTracingInfo() {
  return {
    enabled: isTracingEnabled(),
    disabled: process.env.OPENAI_AGENTS_DISABLE_TRACING === "1",
    dashboardUrl: "https://platform.openai.com/logs",
  };
}
