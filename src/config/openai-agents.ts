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

import { Agent } from "@openai/agents";
import { env } from "./env.js";
import { getAgentDefinition } from "../agents/registry.js";
import type { AgentId } from "../agents/types.js";

/**
 * Cria uma instância de Agent do OpenAI Agents SDK
 * 
 * @param agentId - ID do agente conforme definido em agents.yaml
 * @returns Instância configurada do Agent com tracing automático
 */
export function createOpenAIAgent(agentId: AgentId): Agent {
  const definition = getAgentDefinition(agentId);
  
  // Verificar se a API key está configurada
  if (!env.openAiApiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  // Criar agente com o Agents SDK
  // O tracing é habilitado automaticamente
  const agent = new Agent({
    name: definition.name,
    instructions: definition.instructions,
    model: definition.model,
    // O SDK usa automaticamente OPENAI_API_KEY da variável de ambiente
  });

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
