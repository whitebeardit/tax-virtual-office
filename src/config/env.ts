import dotenv from "dotenv";

dotenv.config();

export type AppMode = "api" | "daily-portals-scan";

/**
 * URI de conexão MongoDB.
 * Em testes: injetada pelo globalSetup (mongodb-memory-server).
 * Em produção: lida de MONGODB_URI no .env.
 */
export function getMongoDbUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI não configurada. Defina no .env ou use mongodb-memory-server nos testes."
    );
  }
  return uri;
}

export const env = {
  appMode: (process.env.APP_MODE as AppMode | undefined) || "api",
  port: Number(process.env.PORT || 3000),
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  /**
   * URL da API do tax-agent-hub (ex: http://localhost:3001).
   *
   * Obrigatória para schemaLookupTool e vectorStoreMapping: os dados de índice de schemas
   * e mapeamentos de vector stores vêm exclusivamente da API do tax-agent-hub (MongoDB).
   * Sem esta URL, as tools retornam vazio e registram um aviso.
   */
  taxAgentHubUrl: process.env.TAX_AGENT_HUB_URL,
};
