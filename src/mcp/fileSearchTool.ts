export interface FileSearchQuery {
  vectorStoreId: string;
  query: string;
}

export async function fileSearch(query: FileSearchQuery): Promise<string[]> {
  // Placeholder for integration with File Search provider.
  console.info("fileSearch query", query);
  return [];
}
