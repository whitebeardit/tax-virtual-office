/**
 * Source planner determinístico: escolhe 2–3 vector stores vs_* a partir do triage.
 * Garante no máximo MAX_STORES_PER_QUERY stores por pergunta.
 */

import { logger } from "../utils/logger.js";
import type { TriageResult } from "../agents/types.js";
import { isValidVectorStoreId } from "../mcp/vectorStoresMetadataTool.js";

export const MAX_STORES_PER_QUERY = 3;

const VALID_STORE_IDS = [
  "vs_specs_mercadorias",
  "vs_specs_transporte",
  "vs_specs_utilities",
  "vs_specs_plataformas",
  "vs_specs_declaracoes",
  "vs_schemas_xsd",
  "vs_legal_federal",
  "vs_legal_confaz",
  "vs_legal_estados",
  "vs_jurisprudencia",
  "vs_tabelas_fiscais",
  "vs_changelog_normativo",
] as const;

/**
 * Retorna lista ordenada de vector store ids (máximo MAX_STORES_PER_QUERY) a consultar.
 */
export function planStores(triage: TriageResult): string[] {
  const candidates: string[] = [];

  switch (triage.trail) {
    case "Calculo":
      candidates.push("vs_tabelas_fiscais", "vs_legal_federal", "vs_legal_estados");
      break;
    case "Legislacao":
      candidates.push(
        "vs_legal_federal",
        "vs_legal_confaz",
        "vs_legal_estados",
        "vs_jurisprudencia"
      );
      if (triage.uf) {
        candidates.push("vs_legal_estados");
      }
      break;
    case "Historico":
      candidates.push("vs_changelog_normativo", "vs_legal_federal", "vs_specs_mercadorias");
      break;
    case "Documento":
    case "Integracao":
    case "Validacao":
    case "Evento":
    case "Operacao":
    default:
      if (triage.family === "mercadorias" || triage.doc_type === "nfe" || triage.doc_type === "nfce") {
        candidates.push(
          "vs_specs_mercadorias",
          "vs_schemas_xsd",
          "vs_tabelas_fiscais"
        );
      } else if (
        triage.family === "transporte" ||
        triage.doc_type === "cte" ||
        triage.doc_type === "mdfe" ||
        triage.doc_type === "bpe"
      ) {
        candidates.push(
          "vs_specs_transporte",
          "vs_schemas_xsd",
          "vs_tabelas_fiscais",
          "vs_legal_confaz"
        );
      } else if (triage.family === "utilities") {
        candidates.push("vs_specs_utilities", "vs_schemas_xsd");
      } else if (triage.family === "declaracoes") {
        candidates.push("vs_specs_declaracoes", "vs_schemas_xsd");
      } else if (triage.family === "plataformas") {
        candidates.push("vs_specs_plataformas", "vs_schemas_xsd");
      } else {
        candidates.push(
          "vs_specs_mercadorias",
          "vs_specs_transporte",
          "vs_schemas_xsd",
          "vs_tabelas_fiscais",
          "vs_legal_federal"
        );
      }
      break;
  }

  const ordered = [...new Set(candidates)];
  const valid = ordered.filter((id) => isValidVectorStoreId(id));
  const limited = valid.slice(0, MAX_STORES_PER_QUERY);

  logger.info(
    { triageTrail: triage.trail, plannedStores: limited },
    "Source planner result"
  );
  return limited;
}

/**
 * Valida que um id é um dos 12 vs_* oficiais.
 */
export function isValidPlannedStoreId(id: string): boolean {
  return VALID_STORE_IDS.includes(id as (typeof VALID_STORE_IDS)[number]);
}
