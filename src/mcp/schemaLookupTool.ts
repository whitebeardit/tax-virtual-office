/**
 * Tool para busca exata de schemas XSD por nome
 *
 * Usa o índice de schemas do tax-agent-hub (MongoDB via API) para busca exata
 * antes de recorrer à busca semântica via file-search.
 */

import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";
import { fetchSchemaIndex as fetchSchemaIndexFromApi } from "../infrastructure/tax-agent-hub-client.js";

interface SchemaIndexEntry {
  schemaName: string;
  fileName: string;
  uploadFileName: string;
  filePath: string;
  domain: string;
  hash?: string;
  namespace?: string;
  version?: string;
  elementCount?: number;
  rootElements?: string[];
  keyElements?: string[];
}

interface SchemaIndex {
  versao: string;
  data_criacao: string;
  data_atualizacao: string;
  total_schemas: number;
  schemas_por_dominio: Record<string, number>;
  schemas: Record<string, SchemaIndexEntry[]>;
}

/**
 * Normaliza nome do schema para busca (remove variações)
 */
function normalizeSchemaName(schemaName: string): string {
  return schemaName
    .toLowerCase()
    .replace(/[_\s-]/g, '') // Remove underscores, espaços, hífens
    .replace(/v(\d+)/g, 'v$1') // Normaliza versões
    .trim();
}

/**
 * Carrega índice de schemas para um domínio via API do tax-agent-hub (MongoDB).
 * Se TAX_AGENT_HUB_URL não estiver configurado, retorna null e registra aviso.
 *
 * @param domain Domínio a carregar (nfe, nfce, confaz, mdfe, other)
 * @returns SchemaIndex ou null se não encontrado ou URL não configurada
 */
async function loadSchemaIndex(domain: string): Promise<SchemaIndex | null> {
  const apiUrl = env.taxAgentHubUrl;
  if (!apiUrl) {
    logger.warn(
      "TAX_AGENT_HUB_URL não configurado; índice de schemas indisponível. Configure a URL da API do tax-agent-hub."
    );
    return null;
  }
  const index = await fetchSchemaIndexFromApi(apiUrl, domain);
  if (index) {
    logger.debug(
      { domain, source: "api", totalSchemas: index.total_schemas },
      "Índice de schemas carregado via API"
    );
  }
  return index as SchemaIndex | null;
}

/**
 * Busca schema por nome exato ou parcial
 */
export async function lookupSchema(
  schemaName: string,
  domain?: string
): Promise<SchemaIndexEntry[]> {
  logger.info({ schemaName, domain }, 'Buscando schema no índice');
  
  const normalizedQuery = normalizeSchemaName(schemaName);
  const results: SchemaIndexEntry[] = [];
  
  // Se domínio especificado, buscar apenas nele
  const domains = domain ? [domain] : ['nfe', 'nfce', 'confaz', 'mdfe', 'cte', 'bpe', 'nf3e', 'dce', 'nfgas', 'nff', 'nfag', 'nfcom', 'one', 'nfeab', 'pes', 'difal', 'other'];
  
  for (const dom of domains) {
    const index = await loadSchemaIndex(dom);
    if (!index) continue;
    
    // Buscar por correspondência exata ou parcial
    for (const [key, entries] of Object.entries(index.schemas)) {
      const normalizedKey = normalizeSchemaName(key);
      
      // Correspondência exata ou parcial
      if (normalizedKey.includes(normalizedQuery) || normalizedQuery.includes(normalizedKey)) {
        results.push(...entries);
      }
      
      // Também verificar nos nomes de arquivo
      for (const entry of entries) {
        const normalizedFileName = normalizeSchemaName(entry.fileName);
        const normalizedUploadFileName = normalizeSchemaName(entry.uploadFileName);
        
        if (normalizedFileName.includes(normalizedQuery) || 
            normalizedUploadFileName.includes(normalizedQuery)) {
          // Evitar duplicatas
          if (!results.some(r => r.filePath === entry.filePath)) {
            results.push(entry);
          }
        }
      }
    }
  }
  
  logger.info(
    { schemaName, resultsCount: results.length },
    'Busca de schema concluída'
  );
  
  return results;
}

/**
 * Busca schemas relacionados (por elementos, namespace, etc.)
 */
export async function findRelatedSchemas(
  criteria: {
    namespace?: string;
    version?: string;
    elementName?: string;
    domain?: string;
  }
): Promise<SchemaIndexEntry[]> {
  logger.info({ criteria }, 'Buscando schemas relacionados');
  
  const results: SchemaIndexEntry[] = [];
  const domains = criteria.domain ? [criteria.domain] : ['nfe', 'nfce', 'confaz', 'mdfe', 'cte', 'bpe', 'nf3e', 'dce', 'nfgas', 'nff', 'nfag', 'nfcom', 'one', 'nfeab', 'pes', 'difal', 'other'];
  
  for (const dom of domains) {
    const index = await loadSchemaIndex(dom);
    if (!index) continue;
    
    for (const entries of Object.values(index.schemas)) {
      for (const entry of entries) {
        let matches = true;
        
        if (criteria.namespace && entry.namespace !== criteria.namespace) {
          matches = false;
        }
        
        if (criteria.version && entry.version !== criteria.version) {
          matches = false;
        }
        
        if (criteria.elementName) {
          const hasElement = 
            entry.rootElements?.some(e => 
              e.toLowerCase().includes(criteria.elementName!.toLowerCase())
            ) ||
            entry.keyElements?.some(e => 
              e.toLowerCase().includes(criteria.elementName!.toLowerCase())
            );
          
          if (!hasElement) {
            matches = false;
          }
        }
        
        if (matches) {
          // Evitar duplicatas
          if (!results.some(r => r.filePath === entry.filePath)) {
            results.push(entry);
          }
        }
      }
    }
  }
  
  logger.info(
    { criteria, resultsCount: results.length },
    'Busca de schemas relacionados concluída'
  );
  
  return results;
}
