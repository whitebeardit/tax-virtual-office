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
const PORTAL_STATE_FILE = path.resolve(PORTAL_CACHE_DIR, "portal-state.json");
const DOWNLOAD_CACHE_DIR = path.resolve(PORTAL_CACHE_DIR, "downloads");

interface PortalStateFile {
  lastRun?: string;
  seen: Record<string, string[]>;
}

let cachedPortals: PortalDefinition[] | undefined;
let cachedVectorStores: VectorStoreDefinition[] | undefined;
let cachedPortalState: PortalStateFile | undefined;

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

export async function watchPortals(): Promise<PortalDocument[]> {
  const portals = loadPortalsCatalog();
  const discovered: PortalDocument[] = [];
  const state = loadPortalState();

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

  persistPortalState(state);
  return discovered;
}

export async function classifyDocument(
  document: PortalDocument
): Promise<ClassifiedDocument> {
  try {
    // Tentar usar o agente LLM primeiro
    const classification = await invokeClassifierAgent(document);
    
    // Validar que o vectorStoreId retornado existe
    if (!isValidVectorStoreId(classification.vectorStoreId)) {
      logger.warn(
        { vectorStoreId: classification.vectorStoreId, document },
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

  // Metadados do crawler (quando disponíveis)
  if (document.domain) {
    parts.push(`\nMetadados do Crawler:`);
    parts.push(`- Domain: ${document.domain}`);
  }
  
  if (document.natureza) {
    parts.push(`- Natureza: ${document.natureza}`);
  }
  
  if (document.assuntos && document.assuntos.length > 0) {
    parts.push(`- Assuntos: ${document.assuntos.join(", ")}`);
  }
  
  if (document.fileName) {
    parts.push(`- Nome do Arquivo: ${document.fileName}`);
  }
  
  if (document.modelo) {
    parts.push(`- Modelo: ${document.modelo}`);
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
  const portalType = document.portalType?.toLowerCase();
  const normalizedTitle = document.title.toLowerCase();

  if (normalizedTitle.includes("nota tecnica") || normalizedTitle.includes("faq")) {
    return findVectorStore(catalog, "normas-tecnicas-nfe-nfce-cte");
  }

  if (portalType === "estadual") {
    return findVectorStore(catalog, "documentos-estaduais-ibc-cbs");
  }

  return findVectorStore(catalog, "legislacao-nacional-ibs-cbs-is");
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

function loadPortalState(): PortalStateFile {
  if (cachedPortalState) return cachedPortalState;

  if (!fs.existsSync(PORTAL_CACHE_DIR)) {
    fs.mkdirSync(PORTAL_CACHE_DIR, { recursive: true });
  }

  if (!fs.existsSync(PORTAL_STATE_FILE)) {
    cachedPortalState = { seen: {}, lastRun: undefined };
    return cachedPortalState;
  }

  const content = fs.readFileSync(PORTAL_STATE_FILE, "utf-8");
  cachedPortalState = JSON.parse(content) as PortalStateFile;
  if (!cachedPortalState.seen) {
    cachedPortalState.seen = {};
  }
  return cachedPortalState;
}

function persistPortalState(state: PortalStateFile) {
  const data = { ...state, lastRun: new Date().toISOString() };
  fs.writeFileSync(PORTAL_STATE_FILE, JSON.stringify(data, null, 2));
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

  // Detectar domínio (nfe, nfce, cte, confaz)
  if (normalizedTitle.includes("nf-e") || normalizedTitle.includes("nfe") || normalizedUrl.includes("/nfe")) {
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

function hasSeen(state: PortalStateFile, doc: PortalDocument): boolean {
  const dedupKey = doc.contentHash || doc.url;
  const seen = state.seen[doc.portalId] || [];
  return seen.includes(dedupKey);
}

function rememberDocument(state: PortalStateFile, doc: PortalDocument) {
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

function scoreVectorStores(document: PortalDocument) {
  const catalog = loadVectorStoresCatalog();
  const normalizedTitle = document.title.toLowerCase();
  const rationale: string[] = [];

  const scores = catalog.map((store) => {
    let score = 0;

    if (document.portalType === "estadual" &&
        store.id === "documentos-estaduais-ibc-cbs") {
      score += 3;
      rationale.push("Portal estadual prioriza store de documentos estaduais.");
    }

    if (normalizedTitle.includes("nf-e") || normalizedTitle.includes("nfe")) {
      if (store.id.includes("nfe")) {
        score += 4;
        rationale.push("Título menciona NF-e, priorizando stores especializados.");
      }
      if (store.id === "normas-tecnicas-nfe-nfce-cte") {
        score += 2;
      }
    }

    if (normalizedTitle.includes("nfce") || normalizedTitle.includes("nfc-e")) {
      if (store.id === "normas-tecnicas-nfe-nfce-cte") {
        score += 4;
        rationale.push("Título cita NFC-e; armazenar em normas técnicas.");
      }
    }

    if (normalizedTitle.includes("ajuste") || normalizedTitle.includes("sinief")) {
      if (store.id === "legislacao-nacional-ibs-cbs-is") {
        score += 3;
        rationale.push("Ajustes SINIEF vão para legislação nacional.");
      }
    }

    if (store.description.toLowerCase().includes(document.portalType || "")) {
      score += 1;
    }

    return { id: store.id, score };
  });

  const best = scores.sort((a, b) => b.score - a.score)[0];
  const vectorStoreId = best?.id || chooseVectorStore(document);

  return {
    vectorStoreId,
    score: best?.score || 0,
    rationaleFromHeuristics: rationale.length
      ? rationale.join(" ")
      : "Roteamento por heurísticas de título e tipo de portal.",
  };
}
