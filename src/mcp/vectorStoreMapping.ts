import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";
import { fetchUploadStatusMappings } from "../infrastructure/tax-agent-hub-client.js";

// Cache em memória para mapeamentos
let mappingsCache: Map<string, string> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Carrega todos os mapeamentos via API do tax-agent-hub (MongoDB).
 * Se TAX_AGENT_HUB_URL não estiver configurado, retorna mapa vazio e registra aviso.
 */
async function loadAllMappings(): Promise<Map<string, string>> {
  const apiUrl = env.taxAgentHubUrl;
  if (!apiUrl) {
    logger.warn(
      "TAX_AGENT_HUB_URL não configurado; mapeamentos de vector stores indisponíveis."
    );
    return new Map<string, string>();
  }
  const entries = await fetchUploadStatusMappings(apiUrl);
  const mappings = new Map<string, string>();
  for (const e of entries) {
    if (e.collection && e.vector_store_id) {
      mappings.set(e.collection, e.vector_store_id);
    }
  }
  logger.debug(
    { source: "api", count: mappings.size },
    "Mapeamentos carregados via API"
  );
  return mappings;
}

/**
 * Obtém todos os mapeamentos (com cache)
 */
export async function getAllMappings(): Promise<Map<string, string>> {
  const now = Date.now();
  
  // Verificar se cache é válido
  if (mappingsCache && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return mappingsCache;
  }
  
  // Recarregar cache
  mappingsCache = await loadAllMappings();
  cacheTimestamp = now;
  
  logger.info(
    { count: mappingsCache.size },
    'Mapeamentos de vector stores carregados'
  );
  
  return mappingsCache;
}

/**
 * Limpa o cache de mapeamentos (útil para testes ou forçar recarregamento)
 */
export function clearMappingsCache(): void {
  mappingsCache = null;
  cacheTimestamp = 0;
  logger.info('Cache de mapeamentos limpo');
}

/**
 * Resolve um ID lógico de vector store para o ID real do OpenAI
 */
export async function resolveVectorStoreId(collectionId: string): Promise<string | null> {
  const mappings = await getAllMappings();
  const realId = mappings.get(collectionId);
  
  if (!realId) {
    logger.warn(
      { collectionId, availableCollections: Array.from(mappings.keys()) },
      'Vector store não encontrado'
    );
    return null;
  }
  
  return realId;
}

