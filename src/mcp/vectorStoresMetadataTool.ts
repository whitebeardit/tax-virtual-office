import fs from "fs";
import path from "path";
import * as YAML from "js-yaml";
import { logger } from "../utils/logger.js";
import { VectorStoreDefinition } from "../agents/types.js";

interface VectorStoresFile {
  vectorStores: VectorStoreDefinition[];
}

const VECTORSTORES_FILE_PATH = path.resolve(
  process.cwd(),
  "agents",
  "vectorstores.yaml"
);

let cachedVectorStores: VectorStoreDefinition[] | undefined;

/**
 * Carrega o catálogo de vector stores do arquivo YAML.
 * Usa cache em memória para evitar leituras repetidas do arquivo.
 */
function loadVectorStoresCatalog(): VectorStoreDefinition[] {
  if (cachedVectorStores) return cachedVectorStores;

  try {
    const fileContent = fs.readFileSync(VECTORSTORES_FILE_PATH, "utf-8");
    const parsed = YAML.load(fileContent) as VectorStoresFile;

    if (!parsed?.vectorStores) {
      throw new Error(
        "Invalid vectorstores.yaml structure: missing vectorStores array"
      );
    }

    cachedVectorStores = parsed.vectorStores;
    logger.info(
      { count: cachedVectorStores.length },
      "Vector stores catalog loaded"
    );
    return cachedVectorStores;
  } catch (error) {
    logger.error(
      { error, path: VECTORSTORES_FILE_PATH },
      "Failed to load vector stores catalog"
    );
    throw error;
  }
}

/**
 * Retorna a lista completa de vector stores disponíveis.
 * Usado pelo classifier para consultar stores disponíveis.
 */
export function getVectorStoresMetadata(): VectorStoreDefinition[] {
  try {
    return loadVectorStoresCatalog();
  } catch (error) {
    logger.error({ error }, "Error getting vector stores metadata");
    return [];
  }
}

/**
 * Retorna um vector store específico por ID.
 */
export function getVectorStoreById(
  id: string
): VectorStoreDefinition | undefined {
  const catalog = loadVectorStoresCatalog();
  return catalog.find((store) => store.id === id);
}

/**
 * Valida se um vector store ID existe no catálogo.
 */
export function isValidVectorStoreId(id: string): boolean {
  const catalog = loadVectorStoresCatalog();
  return catalog.some((store) => store.id === id);
}

/**
 * Limpa o cache de vector stores (útil para testes ou reload).
 */
export function clearVectorStoresCache(): void {
  cachedVectorStores = undefined;
  logger.info("Vector stores cache cleared");
}










