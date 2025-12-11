import dotenv from "dotenv";

dotenv.config();

export type AppMode = "api" | "daily-portals-scan";

export const env = {
  appMode: (process.env.APP_MODE as AppMode | undefined) || "api",
  port: Number(process.env.PORT || 3000),
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  /**
   * Caminho para o diretório do tax-agent-hub
   * 
   * Usado para acessar:
   * - Índice de schemas: {taxAgentHubPath}/upload/{domain}/schema-index.json
   * - Status de upload: {taxAgentHubPath}/upload/{domain}/upload-status.json
   * 
   * Se não configurado, usa caminho relativo ../tax-agent-hub como fallback.
   * 
   * **Importante**: Quando tax-agent-hub e tax-virtual-office estão em máquinas diferentes,
   * esta variável DEVE ser configurada com caminho absoluto ou caminho de rede compartilhado.
   * 
   * Exemplos:
   * - Mesma máquina: TAX_AGENT_HUB_PATH=/home/user/DEV/INVOISYS/tax-agent-hub
   * - Máquinas diferentes (NFS): TAX_AGENT_HUB_PATH=/mnt/shared/tax-agent-hub
   */
  taxAgentHubPath: process.env.TAX_AGENT_HUB_PATH,
};
