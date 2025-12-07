import { classifyDocument, uploadDocument, watchPortals } from "../agents/maintenance";
import { PortalDocument } from "../agents/types";

export async function runDailyPortalsScan(): Promise<void> {
  const newDocuments = await watchPortals();

  console.info(`Portais varridos: ${newDocuments.length} itens detectados.`);

  for (const doc of newDocuments) {
    await processDocument(doc);
  }
}

async function processDocument(document: PortalDocument) {
  const classification = await classifyDocument(document);
  await uploadDocument(document, classification);
}
