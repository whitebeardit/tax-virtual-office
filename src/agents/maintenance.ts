import fs from "fs";
import path from "path";
import * as YAML from "js-yaml";

import crypto from "crypto";

import {
  ClassifiedDocument,
  PortalDefinition,
  PortalDocument,
  VectorStoreDefinition,
} from "./types.js";
import { httpFetch } from "../mcp/httpFetchTool.js";
import { logger } from "../utils/logger.js";
import { run } from "@openai/agents";
import { createOpenAIAgent } from "../config/openai-agents.js";
import { isValidVectorStoreId } from "../mcp/vectorStoresMetadataTool.js";
import {
  PortalStateRepository,
  type PortalState,
} from "../repositories/portal-state.repository.js";

interface PortalsFile {
  portals: PortalDefinition[];
}

interface VectorStoresFile {
  vectorStores: VectorStoreDefinition[];
}

const PORTALS_FILE_PATH = path.resolve(process.cwd(), "agents", "portals.yaml");
const VECTORSTORES_FILE_PATH = path.resolve(
  process.cwd(),
  "agents",
  "vectorstores.yaml"
);
const PORTAL_CACHE_DIR = path.resolve(process.cwd(), "agents", ".cache");
const DOWNLOAD_CACHE_DIR = path.resolve(PORTAL_CACHE_DIR, "downloads");

const portalStateRepository = new PortalStateRepository();

let cachedPortals: PortalDefinition[] | undefined;
let cachedVectorStores: VectorStoreDefinition[] | undefined;

function loadPortalsCatalog(): PortalDefinition[] {
  if (cachedPortals) return cachedPortals;

  const fileContent = fs.readFileSync(PORTALS_FILE_PATH, "utf-8");
  const parsed = YAML.load(fileContent) as PortalsFile;

  if (!parsed?.portals) {
    throw new Error("Invalid portals.yaml structure: missing portals array");
  }

  cachedPortals = parsed.portals;
  return cachedPortals;
}

/**
 * Carrega o catálogo de vector stores do arquivo YAML.
 * Usa cache para performance, mas sempre lê do arquivo na primeira chamada.
 * 
 * IMPORTANTE: O cache persiste durante a execução. Se você atualizar
 * o arquivo vectorstores.yaml, será necessário reiniciar o servidor
 * ou chamar clearVectorStoresCache() para ver as mudanças.
 */
function loadVectorStoresCatalog(): VectorStoreDefinition[] {
  if (cachedVectorStores) return cachedVectorStores;

  const fileContent = fs.readFileSync(VECTORSTORES_FILE_PATH, "utf-8");
  const parsed = YAML.load(fileContent) as VectorStoresFile;

  if (!parsed?.vectorStores) {
    throw new Error(
      "Invalid vectorstores.yaml structure: missing vectorStores array"
    );
  }

  cachedVectorStores = parsed.vectorStores;
  return cachedVectorStores;
}

/**
 * Limpa o cache de vector stores, forçando recarregamento do arquivo YAML.
 * Útil durante desenvolvimento quando o arquivo vectorstores.yaml é atualizado.
 */
export function clearVectorStoresCache(): void {
  cachedVectorStores = undefined;
}

export async function watchPortals(): Promise<PortalDocument[]> {
  const portals = loadPortalsCatalog();
  const discovered: PortalDocument[] = [];
  const state =
    (await portalStateRepository.findState()) ?? { seen: {}, lastRun: undefined };

  for (const portal of portals) {
    try {
      const listingUrl = new URL(portal.listingPath, portal.baseUrl).toString();
      const html = await httpFetch(listingUrl);
      const parsed = parsePortalListing(portal, html, listingUrl);
      const fresh = parsed.filter((doc) => !hasSeen(state, doc));

      fresh.forEach((doc) => rememberDocument(state, doc));
      logPortalMetrics(portal, parsed.length, fresh.length);
      discovered.push(...fresh);
    } catch (error) {
      // Não interromper o fluxo se um portal falhar
      logger.error(
        {
          portalId: portal.id,
          portalName: portal.name,
          error: error instanceof Error ? error.message : String(error),
        },
        "Erro ao varrer portal - continuando com outros portais"
      );
      // Continuar para o próximo portal
    }
  }

  await portalStateRepository.upsertState({
    ...state,
    lastRun: new Date(),
  });
  return discovered;
}

/** Mapeamento id legado → id novo (12 stores). */
const LEGACY_TO_NEW_STORE_ID: Record<string, string> = {
  "normas-tecnicas-nfe": "vs_specs_mercadorias",
  "manuais-nfe": "vs_specs_mercadorias",
  "informes-tecnicos-nfe": "vs_specs_mercadorias",
  "esquemas-xml-nfe": "vs_schemas_xsd",
  "ajustes-sinief-nfe": "vs_specs_mercadorias",
  "normas-tecnicas-cte": "vs_specs_transporte",
  "manuais-cte": "vs_specs_transporte",
  "informes-tecnicos-cte": "vs_specs_transporte",
  "esquemas-xml-cte": "vs_schemas_xsd",
  "tabelas-cfop": "vs_tabelas_fiscais",
  "tabelas-ncm": "vs_tabelas_fiscais",
  "tabelas-meios-pagamento": "vs_tabelas_fiscais",
  "tabelas-aliquotas": "vs_tabelas_fiscais",
  "tabelas-codigos": "vs_tabelas_fiscais",
  "tabelas-ibc-cbs": "vs_tabelas_fiscais",
  "tabelas-nfe-especificas": "vs_tabelas_fiscais",
  "convenios-icms": "vs_legal_confaz",
  "atos-cotepe": "vs_legal_confaz",
  "legislacao-nacional-ibs-cbs-is": "vs_legal_federal",
  "documentos-estaduais-ibc-cbs": "vs_legal_estados",
  "jurisprudencia-tributaria": "vs_jurisprudencia",
  "documentos-bpe": "vs_specs_transporte",
  "documentos-nf3e": "vs_specs_utilities",
  "documentos-dce": "vs_specs_declaracoes",
  "documentos-nfgas": "vs_specs_utilities",
  "documentos-nff": "vs_specs_plataformas",
  "documentos-nfag": "vs_specs_utilities",
  "documentos-nfcom": "vs_specs_utilities",
  "documentos-one": "vs_specs_plataformas",
  "documentos-nfeab": "vs_specs_plataformas",
  "documentos-pes": "vs_specs_plataformas",
  "documentos-difal": "vs_specs_plataformas",
  "documentos-cff": "vs_specs_plataformas",
  "documentos-diversos": "vs_specs_mercadorias",
};

/**
 * Tenta mapear um vectorStoreId inválido (legado) para um dos 12 ids válidos.
 */
function tryMapInvalidVectorStoreId(invalidId: string): string | null {
  const mapped = LEGACY_TO_NEW_STORE_ID[invalidId];
  if (mapped && isValidVectorStoreId(mapped)) return mapped;
  if (invalidId.startsWith("esquemas-xml-") && isValidVectorStoreId("vs_schemas_xsd")) return "vs_schemas_xsd";
  if (invalidId.startsWith("documentos-") && isValidVectorStoreId("vs_specs_mercadorias")) return "vs_specs_mercadorias";
  return null;
}

export async function classifyDocument(
  document: PortalDocument
): Promise<ClassifiedDocument> {
  try {
    // Tentar usar o agente LLM primeiro
    const classification = await invokeClassifierAgent(document);

    // Validar que o vectorStoreId retornado existe
    let vectorStoreId = classification.vectorStoreId;
    if (!isValidVectorStoreId(vectorStoreId)) {
      const mapped = tryMapInvalidVectorStoreId(vectorStoreId);
      if (mapped) {
        logger.info(
          { originalId: vectorStoreId, mappedId: mapped, document },
          "Vector store ID inválido mapeado para ID válido"
        );
        return { ...classification, vectorStoreId: mapped };
      }
      logger.warn(
        { vectorStoreId, document },
        "Vector store ID inválido retornado pelo agente, usando fallback"
      );
      return fallbackClassification(document);
    }

    return classification;
  } catch (error) {
    logger.error(
      { error, document },
      "Erro ao invocar agente classifier, usando fallback"
    );
    return fallbackClassification(document);
  }
}

/**
 * Invoca o agente LLM tax-document-classifier para classificar o documento
 */
async function invokeClassifierAgent(
  document: PortalDocument
): Promise<ClassifiedDocument> {
  const agent = createOpenAIAgent("tax-document-classifier");

  // Construir prompt do usuário com todos os metadados disponíveis
  const userPrompt = buildClassifierPrompt(document);

  // Executar o agente
  const result = await run(agent, userPrompt);

  // Parsear resposta JSON do agente
  const responseText = result.finalOutput || "";
  const parsed = parseClassifierResponse(responseText);

  // Validar resposta
  if (!parsed.targetVectorStoreId) {
    throw new Error("Agente não retornou targetVectorStoreId");
  }

  return {
    vectorStoreId: parsed.targetVectorStoreId,
    tags: parsed.tags || buildTags(document),
    rationale: parsed.rationale,
    confidenceScore: parsed.confidenceScore,
    score: parsed.confidenceScore ? parsed.confidenceScore * 100 : undefined,
  };
}

/**
 * Resume o texto normalizado baseado no tipo de arquivo
 */
function summarizeNormalizedText(
  content: string,
  fileExtension: string,
  maxLength: number = 2000
): string | undefined {
  const ext = fileExtension.toLowerCase().replace(/^\./, "");

  // XSD: não precisa de amostra, já sabemos que é schema XML
  if (ext === "xsd") {
    return undefined;
  }

  // CSV: cabeçalho + 2 primeiras linhas de dados
  if (ext === "csv") {
    const lines = content.split("\n").filter((line) => line.trim().length > 0);
    if (lines.length === 0) {
      return undefined;
    }
    const header = lines[0];
    const dataLines = lines.slice(1, 3); // Primeiras 2 linhas de dados
    return [header, ...dataLines].join("\n");
  }

  // Markdown: remover front matter e truncar
  if (ext === "md") {
    // Remover front matter YAML (entre ---)
    let body = content;
    const frontMatterMatch = body.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (frontMatterMatch) {
      body = body.slice(frontMatterMatch[0].length);
    }

    // Truncar: primeiras 1000 + últimas 500 caracteres
    if (body.length <= maxLength) {
      return body;
    }

    const firstPart = body.slice(0, 1000);
    const lastPart = body.slice(-500);
    return `${firstPart}\n\n[... conteúdo omitido ...]\n\n${lastPart}`;
  }

  // Outros tipos: não incluir amostra (fallback para metadados apenas)
  return undefined;
}

/**
 * Constrói o prompt do usuário para o classifier com todos os metadados
 */
function buildClassifierPrompt(document: PortalDocument): string {
  const parts: string[] = [];

  parts.push("Classifique o seguinte documento fiscal:");
  parts.push(`\nTítulo: ${document.title}`);
  parts.push(`URL: ${document.url}`);
  parts.push(`Portal ID: ${document.portalId}`);
  if (document.portalType) {
    parts.push(`Tipo de Portal: ${document.portalType}`);
  }
  if (document.publishedAt) {
    parts.push(`Data de Publicação: ${document.publishedAt}`);
  }

  // Domínio e categoria (natureza) do crawler — use como sinal principal
  if (document.domain || document.natureza) {
    parts.push(`\n--- Domínio e Categoria (use como sinal principal) ---`);
    parts.push(`Domain: ${document.domain ?? "(não informado)"}`);
    parts.push(`Natureza (categoria): ${document.natureza ?? "(não informado)"}`);
    if (document.natureza === "ESQUEMA_XML" || document.natureza === "SCHEMA_XML") {
      parts.push("→ Documento é schema XML/XSD; priorize vs_schemas_xsd com alta confiança.");
    }
    parts.push("---");
  }

  if (document.assuntos && document.assuntos.length > 0) {
    parts.push(`Assuntos: ${document.assuntos.join(", ")}`);
  }
  if (document.fileName) {
    parts.push(`Nome do Arquivo: ${document.fileName}`);
  }
  if (document.modelo) {
    parts.push(`Modelo: ${document.modelo}`);
  }

  // Amostra do conteúdo normalizado (quando disponível)
  if (document.normalizedTextSample) {
    logger.info(
      {
        title: document.title,
        sampleLength: document.normalizedTextSample.length,
        preview: document.normalizedTextSample.substring(0, 100),
      },
      "[LOG TEMPORÁRIO] Amostra de texto incluída no prompt do classificador"
    );
    parts.push(`\nAmostra do Conteúdo Normalizado:`);
    parts.push("```");
    parts.push(document.normalizedTextSample);
    parts.push("```");
  } else {
    logger.debug(
      { title: document.title },
      "[LOG TEMPORÁRIO] Sem amostra de texto - usando apenas metadados"
    );
  }

  parts.push(
    `\nRetorne APENAS um JSON válido no formato especificado no prompt do sistema.`
  );

  return parts.join("\n");
}

/**
 * Parseia a resposta JSON do agente classifier
 */
function parseClassifierResponse(responseText: string): {
  targetVectorStoreId: string;
  tags?: string[];
  confidenceScore?: number;
  rationale?: string;
} {
  // Tentar extrair JSON do texto (pode estar em markdown code block)
  let jsonText = responseText.trim();

  // Remover markdown code blocks se existirem
  const jsonMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1];
  }

  // Tentar parsear JSON
  try {
    const parsed = JSON.parse(jsonText);
    return {
      targetVectorStoreId: parsed.targetVectorStoreId || parsed.vectorStoreId,
      tags: parsed.tags,
      confidenceScore: parsed.confidenceScore,
      rationale: parsed.rationale,
    };
  } catch (error) {
    logger.error(
      { error, responseText },
      "Erro ao parsear resposta JSON do classifier"
    );
    throw new Error(
      `Resposta do agente não é um JSON válido: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Fallback para classificação usando heurísticas quando o agente falha
 */
function fallbackClassification(document: PortalDocument): ClassifiedDocument {
  const { vectorStoreId, score, rationaleFromHeuristics } =
    scoreVectorStores(document);
  return {
    vectorStoreId,
    tags: buildTags(document),
    rationale: rationaleFromHeuristics || "Classificação por heurísticas (fallback)",
    score,
  };
}

export async function uploadDocument(
  document: PortalDocument,
  classification: ClassifiedDocument
): Promise<void> {
  const content = await httpFetch(document.url);
  if (!fs.existsSync(DOWNLOAD_CACHE_DIR)) {
    fs.mkdirSync(DOWNLOAD_CACHE_DIR, { recursive: true });
  }

  const fileName = `${classification.vectorStoreId}-${
    document.contentHash || Date.now()
  }.html`;
  const localPath = path.join(DOWNLOAD_CACHE_DIR, fileName);
  fs.writeFileSync(localPath, content);
  logger.info(
    {
      portalId: document.portalId,
      bytes: content.length,
      localPath,
    },
    "Documento baixado"
  );

  logger.info(
    {
      vectorStoreId: classification.vectorStoreId,
      tags: classification.tags,
      rationale: classification.rationale,
    },
    "Upload concluído"
  );
}

function chooseVectorStore(document: PortalDocument): string {
  const catalog = loadVectorStoresCatalog();
  // Fallback: retorna o primeiro vector store do catálogo
  // A lógica de escolha deve estar em scoreVectorStores
  return catalog[0]?.id || "";
}

function findVectorStore(
  catalog: VectorStoreDefinition[],
  fallbackId: string
): string {
  const match = catalog.find((item) => item.id === fallbackId);
  return match ? match.id : catalog[0]?.id;
}

function buildTags(document: PortalDocument): string[] {
  const tags = [document.portalId];
  if (document.portalType) {
    tags.push(document.portalType);
  }
  if (document.externalId) {
    tags.push(document.externalId);
  }
  return tags;
}

function parsePortalListing(
  portal: PortalDefinition,
  html: string,
  listingUrl: string
): PortalDocument[] {
  const anchorRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gims;
  const documents: PortalDocument[] = [];
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(html))) {
    const href = match[1];
    const rawTitle = match[2];
    const title = stripTags(rawTitle) || portal.name;

    const resolvedUrl = new URL(href, portal.baseUrl).toString();
    const contentHash = buildContentHash(portal.id, resolvedUrl, title);
    const publishedAt = extractPublishedAt(rawTitle) || new Date().toISOString();

    // Extrair metadados do título e URL
    const metadata = extractMetadataFromTitle(title, resolvedUrl, portal);

    documents.push({
      portalId: portal.id,
      portalType: portal.type,
      title,
      url: resolvedUrl,
      publishedAt,
      detectedAt: new Date().toISOString(),
      contentHash,
      sourceListing: listingUrl,
      ...metadata,
    });
  }

  if (documents.length === 0) {
    documents.push({
      portalId: portal.id,
      portalType: portal.type,
      title: `Atualização detectada em ${portal.name}`,
      url: listingUrl,
      publishedAt: new Date().toISOString(),
      detectedAt: new Date().toISOString(),
      contentHash: buildContentHash(portal.id, listingUrl, portal.name),
      sourceListing: listingUrl,
    });
  }

  return documents;
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function extractPublishedAt(rawTitle: string): string | undefined {
  const dateRegex = /(\d{2}\/\d{2}\/\d{4})/;
  const match = rawTitle.match(dateRegex);
  if (match) {
    const [day, month, year] = match[1].split("/");
    return new Date(`${year}-${month}-${day}`).toISOString();
  }
  return undefined;
}

function buildContentHash(portalId: string, url: string, title: string): string {
  return crypto
    .createHash("sha256")
    .update(`${portalId}:${url}:${title}`)
    .digest("hex");
}

/**
 * Extrai metadados do título e URL para enriquecer o documento
 */
function extractMetadataFromTitle(
  title: string,
  url: string,
  portal: PortalDefinition
): Partial<PortalDocument> {
  const normalizedTitle = title.toLowerCase();
  const normalizedUrl = url.toLowerCase();
  const metadata: Partial<PortalDocument> = {};

  // Detectar domínio (URL tem prioridade para paths SVRS; ordem: mais específicos primeiro)
  if (normalizedUrl.includes("/nfabi")) {
    metadata.domain = "nfeab";
  } else if (normalizedUrl.includes("/nf3e")) {
    metadata.domain = "nf3e";
  } else if (normalizedUrl.includes("/nfcom")) {
    metadata.domain = "nfcom";
  } else if (normalizedUrl.includes("/nfag")) {
    metadata.domain = "nfag";
  } else if (normalizedUrl.includes("/nfgas")) {
    metadata.domain = "nfgas";
  } else if (normalizedUrl.includes("/nff")) {
    metadata.domain = "nff";
  } else if (normalizedUrl.includes("/bpe")) {
    metadata.domain = "bpe";
  } else if (normalizedUrl.includes("/dce")) {
    metadata.domain = "dce";
  } else if (normalizedUrl.includes("/cff")) {
    metadata.domain = "cff";
  } else if (normalizedUrl.includes("/pes")) {
    metadata.domain = "pes";
  } else if (normalizedUrl.includes("/one")) {
    metadata.domain = "one";
  } else if (normalizedUrl.includes("/difal")) {
    metadata.domain = "difal";
  } else if (normalizedUrl.includes("/mdfe")) {
    metadata.domain = "mdfe";
  } else if (normalizedTitle.includes("nf-e") || normalizedTitle.includes("nfe") || normalizedUrl.includes("/nfe")) {
    metadata.domain = "nfe";
    if (normalizedTitle.includes("modelo 55") || normalizedTitle.includes("m55")) {
      metadata.modelo = "55";
    }
  } else if (normalizedTitle.includes("nfce") || normalizedTitle.includes("nfc-e") || normalizedUrl.includes("/nfce")) {
    metadata.domain = "nfce";
    if (normalizedTitle.includes("modelo 65") || normalizedTitle.includes("m65")) {
      metadata.modelo = "65";
    }
  } else if (normalizedTitle.includes("ct-e") || normalizedTitle.includes("cte") || normalizedUrl.includes("/cte")) {
    metadata.domain = "cte";
    if (normalizedTitle.includes("modelo 57") || normalizedTitle.includes("m57")) {
      metadata.modelo = "57";
    } else if (normalizedTitle.includes("modelo 67") || normalizedTitle.includes("m67") || normalizedTitle.includes("ct-e os")) {
      metadata.modelo = "67";
    }
  } else if (normalizedTitle.includes("confaz") || normalizedUrl.includes("/confaz")) {
    metadata.domain = "confaz";
  }

  // Detectar natureza do documento
  if (normalizedTitle.includes("nota técnica") || normalizedTitle.includes("nt ") || normalizedUrl.includes("/nt/")) {
    metadata.natureza = "NOTA_TECNICA";
  } else if (normalizedTitle.includes("manual") || normalizedTitle.includes("moc") || normalizedUrl.includes("/manual/")) {
    metadata.natureza = "MANUAL";
  } else if (normalizedTitle.includes("tabela") || normalizedUrl.includes("/tabela/")) {
    metadata.natureza = "TABELA";
    // Tentar detectar tipo de tabela pelo nome do arquivo
    const fileNameMatch = url.match(/([^/]+\.(xls|xlsx|csv|pdf|xml))$/i);
    if (fileNameMatch) {
      metadata.fileName = fileNameMatch[1];
    }
  } else if (normalizedTitle.includes("informe") || normalizedTitle.includes("comunicado") || normalizedUrl.includes("/informe/")) {
    metadata.natureza = "INFORME_TECNICO";
  } else if (normalizedTitle.includes("schema") || normalizedTitle.includes("xsd") || normalizedUrl.includes("/schema/") || normalizedUrl.includes(".xsd")) {
    metadata.natureza = "SCHEMA_XML";
  } else if (normalizedTitle.includes("ajuste") || normalizedTitle.includes("sinief") || normalizedUrl.includes("/ajuste/")) {
    metadata.natureza = "AJUSTE_SINIEF";
  } else if (normalizedTitle.includes("convênio") || normalizedTitle.includes("convenio") || normalizedUrl.includes("/convenio/")) {
    metadata.natureza = "CONVENIO";
  } else if (normalizedTitle.includes("lei") || normalizedTitle.includes("decreto") || normalizedTitle.includes("lc ") || normalizedTitle.includes("ec ")) {
    metadata.natureza = normalizedTitle.includes("lei complementar") || normalizedTitle.includes("lc ") ? "LEI" : "DECRETO";
  }

  // Detectar assuntos (reforma tributária)
  const assuntos: string[] = [];
  if (normalizedTitle.includes("ibs") || normalizedTitle.includes("cbs") || normalizedTitle.includes("is ") || normalizedTitle.includes("reforma tributária")) {
    assuntos.push("REFORMA_TRIBUTARIA");
    if (normalizedTitle.includes("ibs")) assuntos.push("IBS");
    if (normalizedTitle.includes("cbs")) assuntos.push("CBS");
    if (normalizedTitle.includes("is ") && !normalizedTitle.includes("ibs")) assuntos.push("IS");
  }
  if (assuntos.length > 0) {
    metadata.assuntos = assuntos;
  }

  return metadata;
}

function hasSeen(state: PortalState, doc: PortalDocument): boolean {
  const dedupKey = doc.contentHash || doc.url;
  const seen = state.seen[doc.portalId] || [];
  return seen.includes(dedupKey);
}

function rememberDocument(state: PortalState, doc: PortalDocument) {
  const dedupKey = doc.contentHash || doc.url;
  if (!state.seen[doc.portalId]) {
    state.seen[doc.portalId] = [];
  }

  state.seen[doc.portalId].push(dedupKey);
}

function logPortalMetrics(
  portal: PortalDefinition,
  parsedCount: number,
  freshCount: number
) {
  logger.info(
    {
      portalId: portal.id,
      parsed: parsedCount,
      novos: freshCount,
    },
    "Portal varrido"
  );
}

/**
 * Infere domínio a partir da URL (paths SVRS) quando document.domain pode estar incorreto.
 */
function inferDomainFromUrl(normalizedUrl: string): string | undefined {
  const pathToDomain: Array<{ path: string; domain: string }> = [
    { path: "/nfabi", domain: "nfeab" },
    { path: "/nf3e", domain: "nf3e" },
    { path: "/nfcom", domain: "nfcom" },
    { path: "/nfag", domain: "nfag" },
    { path: "/nfgas", domain: "nfgas" },
    { path: "/nff", domain: "nff" },
    { path: "/bpe", domain: "bpe" },
    { path: "/dce", domain: "dce" },
    { path: "/cff", domain: "cff" },
    { path: "/pes", domain: "pes" },
    { path: "/one", domain: "one" },
    { path: "/difal", domain: "difal" },
    { path: "/mdfe", domain: "mdfe" },
    { path: "/nfe", domain: "nfe" },
    { path: "/nfce", domain: "nfce" },
    { path: "/cte", domain: "cte" },
    { path: "/confaz", domain: "confaz" },
  ];
  for (const { path, domain } of pathToDomain) {
    if (normalizedUrl.includes(path)) return domain;
  }
  return undefined;
}

function scoreVectorStores(document: PortalDocument) {
  const catalog = loadVectorStoresCatalog();
  const normalizedTitle = document.title.toLowerCase();
  const normalizedUrl = document.url.toLowerCase();
  const portalType = document.portalType?.toLowerCase() || "";
  const rationale: string[] = [];

  // Domínio efetivo: prioriza URL (evita erro de seleção manual) e depois document.domain
  const effectiveDomain = inferDomainFromUrl(normalizedUrl) ?? document.domain;

  const DFE_DOMAINS_WITH_SCHEMAS = [
    "nfe", "nfce", "cte", "mdfe", "nfgas", "nfag", "bpe", "dce", "nf3e", "nfcom",
    "nfeab", "one", "cff", "difal", "pes", "nff",
  ];

  const scores = catalog.map((store) => {
    let score = 0;
    const storeId = store.id.toLowerCase();
    const storeDescription = store.description.toLowerCase();

    // Heurísticas baseadas em padrões genéricos (sem IDs hardcoded)

    // 0. Natureza ESQUEMA_XML ou SCHEMA_XML (categoria Schemas) → vs_schemas_xsd (prioridade máxima)
    const isSchemaNatureza =
      document.natureza === "ESQUEMA_XML" || document.natureza === "SCHEMA_XML";
    if (isSchemaNatureza) {
      if (storeId === "vs_schemas_xsd") {
        score += 8;
        rationale.push(`Natureza ${document.natureza} (categoria Schemas) → vs_schemas_xsd.`);
      }
      if (
        effectiveDomain &&
        DFE_DOMAINS_WITH_SCHEMAS.includes(effectiveDomain) &&
        storeId.includes("vs_specs_") &&
        (effectiveDomain === "nfe" || effectiveDomain === "nfce")
      ) {
        score += 1;
        rationale.push(`Domain ${effectiveDomain} como contexto secundário.`);
      }
    }

    // 1. Match por família/domain (12 stores)
    const domainToSpecsStore: Record<string, string> = {
      nfe: "vs_specs_mercadorias",
      nfce: "vs_specs_mercadorias",
      cte: "vs_specs_transporte",
      mdfe: "vs_specs_transporte",
      bpe: "vs_specs_transporte",
      nf3e: "vs_specs_utilities",
      nfcom: "vs_specs_utilities",
      nfgas: "vs_specs_utilities",
      nfag: "vs_specs_utilities",
      dce: "vs_specs_declaracoes",
      nff: "vs_specs_plataformas",
      pes: "vs_specs_plataformas",
      cff: "vs_specs_plataformas",
      one: "vs_specs_plataformas",
      nfeab: "vs_specs_plataformas",
      difal: "vs_specs_plataformas",
    };
    if (effectiveDomain && storeId === domainToSpecsStore[effectiveDomain]) {
      score += 5;
      rationale.push(`Domain ${effectiveDomain} → ${storeId}.`);
    }
    if ((normalizedTitle.includes("nf-e") || normalizedTitle.includes("nfe") || normalizedUrl.includes("/nfe")) && storeId === "vs_specs_mercadorias") {
      score += 5;
      rationale.push("Título/URL menciona NF-e → vs_specs_mercadorias.");
    }
    if ((normalizedTitle.includes("nfce") || normalizedUrl.includes("/nfce")) && storeId === "vs_specs_mercadorias") {
      score += 5;
      rationale.push("Título/URL menciona NFC-e → vs_specs_mercadorias.");
    }
    if ((normalizedTitle.includes("ct-e") || normalizedTitle.includes("cte") || normalizedUrl.includes("/cte")) && storeId === "vs_specs_transporte") {
      score += 5;
      rationale.push("Título/URL menciona CT-e → vs_specs_transporte.");
    }

    // 2. Match por natureza/artifact
    if (normalizedTitle.includes("nota técnica") || normalizedTitle.includes("nt ") || normalizedUrl.includes("/nt/") || document.natureza === "NOTA_TECNICA") {
      if (storeId.includes("vs_specs_")) {
        score += 4;
        rationale.push("Documento é Nota Técnica → vs_specs_*.");
      }
    }
    if (normalizedTitle.includes("manual") || normalizedTitle.includes("moc") || normalizedUrl.includes("/manual/") || document.natureza === "MANUAL") {
      if (storeId.includes("vs_specs_")) {
        score += 4;
        rationale.push("Documento é Manual → vs_specs_*.");
      }
    }
    if (normalizedTitle.includes("tabela") || normalizedUrl.includes("/tabela/") || document.natureza === "TABELA") {
      if (storeId === "vs_tabelas_fiscais") {
        score += 5;
        rationale.push("Documento é Tabela → vs_tabelas_fiscais.");
      }
    }
    if (normalizedTitle.includes("informe") || normalizedTitle.includes("comunicado") || document.natureza === "INFORME_TECNICO") {
      if (storeId.includes("vs_specs_")) {
        score += 4;
        rationale.push("Documento é Informe → vs_specs_*.");
      }
    }
    if (
      document.natureza === "ESQUEMA_XML" ||
      document.natureza === "SCHEMA_XML" ||
      normalizedTitle.includes("schema") ||
      normalizedTitle.includes("xsd") ||
      normalizedUrl.includes(".xsd")
    ) {
      if (storeId === "vs_schemas_xsd") {
        score += 5;
        rationale.push("Documento é Schema XML (natureza ou título/URL) → vs_schemas_xsd.");
      }
    }
    if (normalizedTitle.includes("ajuste") || normalizedTitle.includes("sinief") || document.natureza === "AJUSTE_SINIEF") {
      if (storeId === "vs_legal_confaz") {
        score += 5;
        rationale.push("Documento é Ajuste SINIEF → vs_legal_confaz.");
      }
    }
    if (normalizedTitle.includes("convênio") || normalizedTitle.includes("convenio") || document.natureza === "CONVENIO") {
      if (storeId === "vs_legal_confaz") {
        score += 5;
        rationale.push("Documento é Convênio → vs_legal_confaz.");
      }
    }
    if (normalizedTitle.includes("ato") || normalizedTitle.includes("cotepe") || document.natureza === "ATO_COTEPE") {
      if (storeId === "vs_legal_confaz") {
        score += 5;
        rationale.push("Documento é Ato COTEPE → vs_legal_confaz.");
      }
    }
    if (effectiveDomain === "confaz") {
      if (storeId === "vs_legal_confaz" || storeId === "vs_legal_federal" || storeId === "vs_legal_estados") {
        score += 4;
        rationale.push("Domain confaz → vs_legal_*.");
      }
    }

    // 3. Match por descrição do store
    if (storeDescription.includes(portalType)) {
      score += 1;
    }
    const titleKeywords = normalizedTitle.split(/\s+/);
    for (const keyword of titleKeywords) {
      if (keyword.length > 3 && storeDescription.includes(keyword)) {
        score += 1;
      }
    }

    return { id: store.id, score };
  });

  const best = scores.sort((a, b) => b.score - a.score)[0];
  const vectorStoreId = best?.id || chooseVectorStore(document);

  // Coletar rationale apenas do melhor match
  const bestStore = catalog.find((s) => s.id === best?.id);
  const finalRationale = bestStore && best.score > 0
    ? `Classificado para '${bestStore.id}' baseado em padrões do título, URL e tipo de portal. Score: ${best.score}.`
    : "Roteamento por heurísticas genéricas de título e tipo de portal.";

  return {
    vectorStoreId,
    score: best?.score || 0,
    rationaleFromHeuristics: finalRationale,
  };
}

