import { Agent, Tool } from "@openai/agents";
import { getAgentDefinition } from "./registry.js";
import { AgentId } from "./types.js";
import {
  fileSearchTool,
  webTool,
  loggerTool,
  httpFetchTool,
  httpDownloadTool,
  kvStateTool,
} from "./tools.js";

/**
 * Mapeia ferramentas por nome para os tools do Agents SDK
 */
const toolMap: Record<string, Tool> = {
  "file-search": fileSearchTool,
  web: webTool,
  logger: loggerTool,
  "http-fetch": httpFetchTool,
  "http-download": httpDownloadTool,
  "kv-state": kvStateTool,
};

/**
 * Cria um Agent do Agents SDK a partir de uma definição do registry
 */
export function createAgentFromDefinition(agentId: AgentId): Agent {
  const definition = getAgentDefinition(agentId);
  
  // Mapeia tools do registry para tools do SDK
  const tools = (definition.tools || [])
    .map((toolName) => toolMap[toolName])
    .filter((tool) => tool !== undefined);

  return new Agent({
    name: definition.name,
    model: definition.model,
    instructions: definition.instructions,
    tools: tools,
  });
}

/**
 * Cria o coordinator agent com handoffs para especialistas
 */
export function createCoordinatorAgent(): Agent {
  const coordinator = createAgentFromDefinition("coordinator");
  
  // Cria especialistas como handoffs
  const specialistNfe = createAgentFromDefinition("specialist-nfe");
  const specialistNfce = createAgentFromDefinition("specialist-nfce");
  const specialistCte = createAgentFromDefinition("specialist-cte");
  const legislacaoIbsCbs = createAgentFromDefinition("legislacao-ibs-cbs");

  // Usa Agent.create para suportar handoffs
  return Agent.create({
    name: coordinator.name,
    model: coordinator.model,
    instructions: coordinator.instructions,
    tools: coordinator.tools,
    handoffs: [specialistNfe, specialistNfce, specialistCte, legislacaoIbsCbs],
  });
}

/**
 * Cria um specialist agent
 */
export function createSpecialistAgent(agentId: AgentId): Agent {
  return createAgentFromDefinition(agentId);
}
