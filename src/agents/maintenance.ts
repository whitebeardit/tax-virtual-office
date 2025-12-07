import { ensureApiKey, openaiClient } from "../config/openai";
import { ClassifiedDocument, PortalDocument } from "./types";
import { httpFetch } from "../mcp/httpFetchTool";
import { extractFirstText } from "./utils";

export async function watchPortals(): Promise<PortalDocument[]> {
  ensureApiKey();
  // Placeholder: in production, this would call the tax-portal-watcher agent.
  await httpFetch("https://example.com/health");
  return [];
}

export async function classifyDocument(
  document: PortalDocument
): Promise<ClassifiedDocument> {
  ensureApiKey();
  const completion = await openaiClient.responses.create({
    model: "gpt-4o-mini",
    input: `Classifique o documento: ${document.title}`,
  });

  const rationale = extractFirstText(completion.output);
  return {
    vectorStoreId: "legislacao-nacional-ibs-cbs-is",
    tags: [document.portalId],
    rationale,
  };
}

export async function uploadDocument(
  document: PortalDocument,
  classification: ClassifiedDocument
): Promise<void> {
  // TODO: integrate http-download + storage + file-search upload.
  console.info("Upload pending", { document, classification });
}
