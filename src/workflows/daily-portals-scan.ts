import { classifyDocument, uploadDocument, watchPortals } from "../agents/maintenance.js";
import { PortalDocument } from "../agents/types.js";
import { logger } from "../utils/logger.js";

export async function runDailyPortalsScan(): Promise<void> {
  const newDocuments = await watchPortals();

  logger.info({ count: newDocuments.length }, "Portais varridos: itens detectados");

  for (const doc of newDocuments) {
    await processDocument(doc);
  }
}

async function processDocument(document: PortalDocument) {
  const classification = await classifyDocument(document);
  await uploadDocument(document, classification);
}
