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
    const listingUrl = new URL(portal.listingPath, portal.baseUrl).toString();
    const html = await httpFetch(listingUrl);
    const parsed = parsePortalListing(portal, html, listingUrl);
    const fresh = parsed.filter((doc) => !hasSeen(state, doc));

    fresh.forEach((doc) => rememberDocument(state, doc));
    logPortalMetrics(portal, parsed.length, fresh.length);
    discovered.push(...fresh);
  }

  persistPortalState(state);
  return discovered;
}

export async function classifyDocument(
  document: PortalDocument
): Promise<ClassifiedDocument> {
  const { vectorStoreId, score, rationaleFromHeuristics } =
    scoreVectorStores(document);
  return {
    vectorStoreId,
    tags: buildTags(document),
    rationale: rationaleFromHeuristics,
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

    documents.push({
      portalId: portal.id,
      portalType: portal.type,
      title,
      url: resolvedUrl,
      publishedAt,
      detectedAt: new Date().toISOString(),
      contentHash,
      sourceListing: listingUrl,
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
