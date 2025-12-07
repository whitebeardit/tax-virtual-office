import fs from "fs";
import path from "path";
import YAML from "js-yaml";

import { AgentId } from "./types";

interface AgentFileDefinition {
  id: AgentId;
  name: string;
  model: string;
  instructions_file: string;
  tools?: string[];
}

interface AgentsFile {
  agents: AgentFileDefinition[];
}

export interface AgentDefinition extends AgentFileDefinition {
  instructions: string;
}

const AGENTS_FILE_PATH = path.resolve(process.cwd(), "agents", "agents.yaml");
const CACHE: Partial<Record<AgentId, AgentDefinition>> = {};

function parseAgentsFile(): AgentsFile {
  const yamlContent = fs.readFileSync(AGENTS_FILE_PATH, "utf-8");
  const parsed = YAML.load(yamlContent);
  if (!parsed || typeof parsed !== "object" || !("agents" in parsed)) {
    throw new Error("Invalid agents.yaml structure: missing 'agents' key");
  }

  return parsed as AgentsFile;
}

function loadInstructions(agentsDir: string, instructionsFile: string): string {
  const instructionsPath = path.resolve(agentsDir, instructionsFile);
  return fs.readFileSync(instructionsPath, "utf-8");
}

export function getAgentDefinition(agentId: AgentId): AgentDefinition {
  if (CACHE[agentId]) {
    return CACHE[agentId] as AgentDefinition;
  }

  const agentsDir = path.dirname(AGENTS_FILE_PATH);
  const parsed = parseAgentsFile();
  const definition = parsed.agents.find((agent) => agent.id === agentId);

  if (!definition) {
    throw new Error(`Agent definition not found for id=${agentId}`);
  }

  const instructions = loadInstructions(agentsDir, definition.instructions_file);
  const fullDefinition: AgentDefinition = { ...definition, instructions };
  CACHE[agentId] = fullDefinition;
  return fullDefinition;
}
