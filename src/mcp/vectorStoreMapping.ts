import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

interface UploadStatusFile {
  collection?: string;
  vector_store_id?: string;
  arquivos?: Record<string, unknown>;
}

interface VectorStoreMapping {
  collection: string;
  vector_store_id: string;
}

// Cache em memória para mapeamentos
let mappingsCache: Map<string, string> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Obtém o caminho base do tax-agent-hub
 * 
 * Prioridade:
 * 1. TAX_AGENT_HUB_PATH (variável de ambiente via env.ts)
 * 2. Caminho relativo ../tax-agent-hub (fallback)
 * 
 * @returns Caminho absoluto para o diretório do tax-agent-hub
 */
function getTaxAgentHubPath(): string {
  // Usar env.taxAgentHubPath (vem de env.ts que já carrega .env)
  const envPath = env.taxAgentHubPath;
  
  if (envPath) {
    const resolvedPath = path.resolve(envPath);
    return resolvedPath;
  }
  
  // Caminho relativo padrão: ../tax-agent-hub
  const currentDir = process.cwd();
  const relativePath = path.resolve(currentDir, '..', 'tax-agent-hub');
  return relativePath;
}

/**
 * Descobre domínios disponíveis no diretório upload/
 */
async function discoverDomains(basePath: string): Promise<string[]> {
  const uploadDir = path.join(basePath, 'upload');
  
  try {
    const entries = await fs.readdir(uploadDir, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
  } catch (error) {
    logger.warn({ error, uploadDir }, 'Erro ao descobrir domínios');
    return [];
  }
}

/**
 * Carrega um arquivo upload-status.json
 */
async function loadUploadStatus(domain: string, basePath: string): Promise<UploadStatusFile | null> {
  const statusPath = path.join(basePath, 'upload', domain, 'upload-status.json');
  
  try {
    const content = await fs.readFile(statusPath, 'utf-8');
    return JSON.parse(content) as UploadStatusFile;
  } catch (error) {
    logger.debug({ error, statusPath }, 'Erro ao carregar upload-status.json');
    return null;
  }
}

/**
 * Carrega todos os mapeamentos disponíveis dos upload-status.json
 */
async function loadAllMappings(): Promise<Map<string, string>> {
  const basePath = getTaxAgentHubPath();
  const domains = await discoverDomains(basePath);
  const mappings = new Map<string, string>();
  
  for (const domain of domains) {
    const status = await loadUploadStatus(domain, basePath);
    if (status?.collection && status?.vector_store_id) {
      mappings.set(status.collection, status.vector_store_id);
      logger.debug(
        { collection: status.collection, vector_store_id: status.vector_store_id },
        'Mapeamento carregado'
      );
    }
  }
  
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

