/**
 * Retrieval com guardrails: executa file-search apenas nos stores planejados,
 * com validação de ids vs_*, limite de stores e timeout.
 */

import { logger } from "../utils/logger.js";
import { fileSearch } from "../mcp/fileSearchTool.js";
import { isValidVectorStoreId } from "../mcp/vectorStoresMetadataTool.js";
import { MAX_STORES_PER_QUERY } from "./source-planner.js";

export const RETRIEVAL_TIMEOUT_MS = 60_000;

export interface RetrievalResult {
  /** storeId -> textos retornados */
  byStore: Map<string, string[]>;
  /** erros por store (storeId -> mensagem) */
  errors: Map<string, string>;
  /** stores que foram consultados (válidos) */
  storesQueried: string[];
}

/**
 * Executa file-search em cada store do plano, respeitando limite e ids válidos.
 * Stores inválidos são ignorados e registrados em errors.
 */
export async function runRetrieval(
  query: string,
  storeIds: string[],
  options?: { timeoutMs?: number; maxStores?: number }
): Promise<RetrievalResult> {
  const timeoutMs = options?.timeoutMs ?? RETRIEVAL_TIMEOUT_MS;
  const maxStores = options?.maxStores ?? MAX_STORES_PER_QUERY;

  const toQuery = storeIds.slice(0, maxStores);
  const invalid: string[] = [];
  const valid: string[] = [];

  for (const id of toQuery) {
    if (isValidVectorStoreId(id)) {
      valid.push(id);
    } else {
      invalid.push(id);
    }
  }

  if (invalid.length > 0) {
    logger.warn(
      { invalidIds: invalid },
      "Retrieval: ignoring invalid vector store ids"
    );
  }

  const byStore = new Map<string, string[]>();
  const errors = new Map<string, string>();

  const start = Date.now();

  for (const vectorStoreId of valid) {
    if (Date.now() - start > timeoutMs) {
      logger.warn("Retrieval: timeout reached, stopping further searches");
      break;
    }
    try {
      const results = await fileSearch({ vectorStoreId, query });
      byStore.set(vectorStoreId, results);
      logger.info(
        { vectorStoreId, resultsCount: results.length },
        "Retrieval: search completed"
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.set(vectorStoreId, message);
      logger.error({ err, vectorStoreId }, "Retrieval: search failed");
    }
  }

  return {
    byStore,
    errors,
    storesQueried: valid,
  };
}
