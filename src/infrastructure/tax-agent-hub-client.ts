/**
 * Cliente HTTP para API do tax-agent-hub
 *
 * Usado quando TAX_AGENT_HUB_URL está configurado.
 */

import fetch from "node-fetch";
import { logger } from "../utils/logger.js";

export interface SchemaIndex {
  versao: string;
  data_criacao: string;
  data_atualizacao: string;
  total_schemas: number;
  schemas_por_dominio: Record<string, number>;
  schemas: Record<string, unknown[]>;
}

export interface MappingEntry {
  collection: string;
  vector_store_id: string;
}

export async function fetchSchemaIndex(
  baseUrl: string,
  domain: string
): Promise<SchemaIndex | null> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/schemas/domain/${domain}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) return null;
      logger.warn({ url, status: res.status }, "Erro ao buscar schema index");
      return null;
    }
    return (await res.json()) as SchemaIndex;
  } catch (error) {
    logger.error({ error, url }, "Erro ao buscar schema index via API");
    return null;
  }
}

export async function fetchUploadStatusMappings(
  baseUrl: string
): Promise<MappingEntry[]> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/upload-status/mappings`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      logger.warn({ url, status: res.status }, "Erro ao buscar mapeamentos");
      return [];
    }
    return (await res.json()) as MappingEntry[];
  } catch (error) {
    logger.error({ error, url }, "Erro ao buscar mapeamentos via API");
    return [];
  }
}
