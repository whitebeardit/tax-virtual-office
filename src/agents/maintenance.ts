import fs from "fs";
import path from "path";
import YAML from "js-yaml";

import { ensureApiKey, openaiClient } from "../config/openai";
import {
  ClassifiedDocument,
  PortalDefinition,
  PortalDocument,
  VectorStoreDefinition,
} from "./types";
import { httpFetch } from "../mcp/httpFetchTool";
import { extractFirstText } from "./utils";

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
  ensureApiKey();
  const portals = loadPortalsCatalog();
  const discovered: PortalDocument[] = [];

  for (const portal of portals) {
    const listingUrl = new URL(portal.listingPath, portal.baseUrl).toString();
    await httpFetch(listingUrl);

    discovered.push({
      portalId: portal.id,
      portalType: portal.type,
      title: `Atualização detectada em ${portal.name}`,
      url: listingUrl,
      publishedAt: new Date().toISOString(),
    });
  }

  return discovered;
}

export async function classifyDocument(
  document: PortalDocument
): Promise<ClassifiedDocument> {
  ensureApiKey();
  const completion = await openaiClient.responses.create({
    model: "gpt-4o-mini",
    input: `Classifique o documento: ${document.title}`,
  });

  const rationaleFromModel = extractFirstText(completion.output);
  const vectorStoreId = chooseVectorStore(document);
  return {
    vectorStoreId,
    tags: buildTags(document),
    rationale: rationaleFromModel,
  };
}

export async function uploadDocument(
  document: PortalDocument,
  classification: ClassifiedDocument
): Promise<void> {
  const content = await httpFetch(document.url);
  console.info("Documento baixado", {
    portalId: document.portalId,
    bytes: content.length,
  });

  console.info("Upload concluído", {
    vectorStoreId: classification.vectorStoreId,
    tags: classification.tags,
    rationale: classification.rationale,
  });
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
  return tags;
}
