/**
 * Triage determinístico: classifica a intenção da pergunta para roteamento.
 * Saída validada (trilha, família, doc_type) usada pelo source planner.
 */

import { logger } from "../utils/logger.js";
import type {
  TriageResult,
  TriageTrail,
  TriageFamily,
  TriageDocType,
} from "../agents/types.js";

const TRAIL_DEFAULT: TriageTrail = "Documento";

/**
 * Classifica a pergunta do usuário em trilha, família e doc_type (heurística).
 * Não chama LLM; saída é determinística e validada.
 */
export function classifyQuestion(question: string): TriageResult {
  const normalized = question.toLowerCase().trim();
  const trail = detectTrail(normalized);
  const { family, doc_type } = detectFamilyAndDocType(normalized);
  const uf = detectUF(normalized);

  const result: TriageResult = { trail, uf };
  if (family) result.family = family;
  if (doc_type) result.doc_type = doc_type;

  logger.info(
    { trail: result.trail, family: result.family, doc_type: result.doc_type, uf: result.uf },
    "Triage classification"
  );
  return result;
}

function detectTrail(normalized: string): TriageTrail {
  if (
    /c[aá]lculo|al[ií]quota|cfop|ncm|base\s+de\s+c[aá]lculo|tabela\s+fiscal/.test(
      normalized
    )
  ) {
    return "Calculo";
  }
  if (
    /lei|decreto|lc\s+\d|ec\s+\d|ibs|cbs|is\s+imposto|reforma\s+tribut[aá]ria|conv[eê]nio|con faz|sinief|cotepe|jurisprud[eê]ncia|parecer|art\.\s*\d/.test(
      normalized
    )
  ) {
    return "Legislacao";
  }
  if (
    /schema|xsd|xml|tag|campo\s+\w+|estrutura\s+xml|leiaute|layout/.test(
      normalized
    )
  ) {
    return "Documento";
  }
  if (
    /integra[cç][aã]o|api|web\s+service|autoriza[cç][aã]o|envio|consulta\s+recibo/.test(
      normalized
    )
  ) {
    return "Integracao";
  }
  if (
    /valida[cç][aã]o|rejei[cç][aã]o|c[oó]digo\s+de\s+erro|validador/.test(
      normalized
    )
  ) {
    return "Validacao";
  }
  if (
    /evento|carta\s+de\s+corre[cç][aã]o|manifesta[cç][aã]o|epec|cancelamento|inutiliza[cç][aã]o/.test(
      normalized
    )
  ) {
    return "Evento";
  }
  if (
    /a\s+partir\s+de|vig[eê]ncia|prazo|transi[cç][aã]o|2026|2027|2033|timeline/.test(
      normalized
    )
  ) {
    return "Historico";
  }
  return TRAIL_DEFAULT;
}

function detectFamilyAndDocType(
  normalized: string
): { family?: TriageFamily; doc_type?: TriageDocType } {
  if (
    /nf-?e\s+modelo\s*55|modelo\s*55|nfe\s+55|nota\s+fiscal\s+eletr[oô]nica\s+55/.test(
      normalized
    ) ||
    (/\bnfe\b|\bnf-e\b/.test(normalized) && !/nfce|nf-c-e/.test(normalized))
  ) {
    return { family: "mercadorias", doc_type: "nfe" };
  }
  if (
    /nfce|nf-c-e|nfc-?e|modelo\s*65|\bnf\s+e\s+consumidor/.test(normalized)
  ) {
    return { family: "mercadorias", doc_type: "nfce" };
  }
  if (
    /ct-?e|cte\s+modelo\s*57|conhecimento\s+de\s+transporte/.test(normalized)
  ) {
    return { family: "transporte", doc_type: "cte" };
  }
  if (/mdf-?e|manifesto\s+eletr[oô]nico/.test(normalized)) {
    return { family: "transporte", doc_type: "mdfe" };
  }
  if (/bp-?e|bilhete\s+de\s+passagem/.test(normalized)) {
    return { family: "transporte", doc_type: "bpe" };
  }
  if (/nf3e|nf-3-e/.test(normalized)) {
    return { family: "utilities", doc_type: "nf3e" };
  }
  if (/nfcom|nf-com/.test(normalized)) {
    return { family: "utilities", doc_type: "nfcom" };
  }
  if (/dce|dc-?e|declara[cç][aã]o/.test(normalized)) {
    return { family: "declaracoes", doc_type: "dce" };
  }
  if (/nff|pes|cff|one|difal|nfeab/.test(normalized)) {
    return { family: "plataformas" };
  }
  return {};
}

function detectUF(normalized: string): string | undefined {
  const ufMatch = normalized.match(
    /\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/
  );
  return ufMatch ? ufMatch[1].toUpperCase() : undefined;
}
