import { logger } from '../utils/logger.js';

export function logInfo(message: string, payload?: unknown): void {
  if (payload) {
    logger.info(payload, message);
  } else {
    logger.info(message);
  }
}

export function logError(message: string, payload?: unknown): void {
  if (payload) {
    logger.error(payload, message);
  } else {
    logger.error(message);
  }
}
