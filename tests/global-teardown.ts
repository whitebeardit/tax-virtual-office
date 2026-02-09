/**
 * Jest globalTeardown: para MongoMemoryServer após todos os testes
 */

import { MongoMemoryServer } from "mongodb-memory-server";

declare global {
  var __MONGO_SERVER__: MongoMemoryServer | undefined;
}

export default async function globalTeardown(): Promise<void> {
  if (global.__MONGO_SERVER__) {
    await global.__MONGO_SERVER__.stop();
    global.__MONGO_SERVER__ = undefined;
  }
}
