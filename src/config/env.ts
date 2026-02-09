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
   * URL da API do tax-agent-hub (ex: http://localhost:3001)
   *
   * Quando configurado, schemaLookupTool e vectorStoreMapping consomem dados via API
   * em vez de ler arquivos locais. Prioridade sobre TAX_AGENT_HUB_PATH.
   */
  taxAgentHubUrl: process.env.TAX_AGENT_HUB_URL,
  /**
   * Caminho para o diretório do tax-agent-hub
   *
   * Usado quando TAX_AGENT_HUB_URL não está configurado (fallback para arquivos locais).
   * - Índice de schemas: {taxAgentHubPath}/upload/{domain}/schema-index.json
   * - Status de upload: {taxAgentHubPath}/upload/{domain}/upload-status.json
   *
   * Se não configurado, usa caminho relativo ../tax-agent-hub como fallback.
   *
   * **Importante**: Quando tax-agent-hub e tax-virtual-office estão em máquinas diferentes,
   * use TAX_AGENT_HUB_URL com a URL da API em vez de TAX_AGENT_HUB_PATH.
   */
  taxAgentHubPath: process.env.TAX_AGENT_HUB_PATH,
};
