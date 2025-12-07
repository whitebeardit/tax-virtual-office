export function logInfo(message: string, payload?: unknown): void {
  if (payload) {
    console.info(message, payload);
  } else {
    console.info(message);
  }
}

export function logError(message: string, payload?: unknown): void {
  if (payload) {
    console.error(message, payload);
  } else {
    console.error(message);
  }
}
