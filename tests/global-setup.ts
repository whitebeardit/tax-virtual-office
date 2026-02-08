/**
 * Jest globalSetup: inicia MongoMemoryServer antes de todos os testes
 *
 * Define process.env.MONGODB_URI apontando para a instância em memória.
 * Todos os testes que usam MongoDB conectam a esta URI.
 */

import { MongoMemoryServer } from "mongodb-memory-server";

declare global {
  var __MONGO_SERVER__: MongoMemoryServer | undefined;
}

export default async function globalSetup(): Promise<void> {
  const mongoServer = await MongoMemoryServer.create();
  global.__MONGO_SERVER__ = mongoServer;
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;
}
