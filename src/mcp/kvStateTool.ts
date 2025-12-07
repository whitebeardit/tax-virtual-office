const memoryStore = new Map<string, string>();

export function kvGet(key: string): string | undefined {
  return memoryStore.get(key);
}

export function kvSet(key: string, value: string): void {
  memoryStore.set(key, value);
}
