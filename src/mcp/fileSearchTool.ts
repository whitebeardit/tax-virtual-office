import { logger } from '../utils/logger.js';

export interface FileSearchQuery {
  vectorStoreId: string;
  query: string;
}

export async function fileSearch(query: FileSearchQuery): Promise<string[]> {
  // Placeholder for integration with File Search provider.
  logger.info({ query }, "fileSearch query");
  return [];
}
