/**
 * Tool para busca exata de schemas XSD por nome
 * 
 * Usa o índice de schemas gerado pelo tax-agent-hub para fazer busca exata
 * antes de recorrer à busca semântica via file-search.
 */

import * as fs from "fs/promises";
import * as path from "path";
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
 * Obtém o caminho base do tax-agent-hub
 * 
 * Prioridade:
 * 1. TAX_AGENT_HUB_PATH (variável de ambiente)
 * 2. Caminho relativo ../tax-agent-hub (fallback)
 * 
 * @returns Caminho absoluto para o diretório do tax-agent-hub
 * @throws Error se nenhum caminho válido for encontrado
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
 * Valida se o caminho do tax-agent-hub existe e é acessível
 * 
 * @param basePath Caminho base do tax-agent-hub
 * @returns true se válido, false caso contrário
 */
async function validateTaxAgentHubPath(basePath: string): Promise<boolean> {
  try {
    await fs.access(basePath);
    const uploadDir = path.join(basePath, 'upload');
    await fs.access(uploadDir);
    return true;
  } catch {
    return false;
  }
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
 * Carrega índice de schemas para um domínio
 *
 * Se TAX_AGENT_HUB_URL configurado: busca via API.
 * Caso contrário: lê arquivo local (TAX_AGENT_HUB_PATH).
 *
 * @param domain Domínio a carregar (nfe, nfce, confaz, mdfe, other)
 * @returns SchemaIndex ou null se não encontrado
 */
async function loadSchemaIndex(domain: string): Promise<SchemaIndex | null> {
  // Prioridade: API quando TAX_AGENT_HUB_URL configurado
  const apiUrl = env.taxAgentHubUrl;
  if (apiUrl) {
    const index = await fetchSchemaIndexFromApi(apiUrl, domain);
    if (index) {
      logger.debug(
        { domain, source: "api", totalSchemas: index.total_schemas },
        "Índice de schemas carregado via API"
      );
    }
    return index as SchemaIndex | null;
  }

  // Fallback: arquivos locais
  const basePath = getTaxAgentHubPath();
  const indexPath = path.join(basePath, "upload", domain, "schema-index.json");

  const isValid = await validateTaxAgentHubPath(basePath);
  if (!isValid) {
    const envPath = env.taxAgentHubPath;
    if (!envPath) {
      logger.warn(
        {
          basePath,
          indexPath,
          suggestion:
            "Configure TAX_AGENT_HUB_PATH ou TAX_AGENT_HUB_URL no .env",
        },
        "TAX_AGENT_HUB_PATH não configurado e caminho relativo ../tax-agent-hub não encontrado"
      );
    } else {
      logger.warn(
        { basePath, indexPath, envPath },
        "Caminho do tax-agent-hub configurado mas não é acessível"
      );
    }
    return null;
  }

  try {
    await fs.access(indexPath);
    const content = await fs.readFile(indexPath, "utf-8");
    const index = JSON.parse(content) as SchemaIndex;

    logger.debug(
      { domain, indexPath, totalSchemas: index.total_schemas },
      "Índice de schemas carregado com sucesso"
    );

    return index;
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      logger.warn(
        {
          domain,
          indexPath,
          suggestion: `Execute 'npm run generate:schema-index' no tax-agent-hub para gerar o índice`,
        },
        `Índice de schemas não encontrado para domínio ${domain}`
      );
    } else {
      logger.error(
        { error, domain, indexPath },
        "Erro ao carregar índice de schemas"
      );
    }
    return null;
  }
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








