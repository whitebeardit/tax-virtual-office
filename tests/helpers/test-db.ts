/**
 * Helpers para testes com MongoDB (mongodb-memory-server)
 *
 * Conecta ao MONGODB_URI injetada pelo globalSetup.
 * Use connectTestDb() no beforeAll e teardownTestDb() no afterAll.
 */

import mongoose from "mongoose";

/**
 * Conecta ao MongoDB de teste (mongodb-memory-server)
 *
 * Usa process.env.MONGODB_URI definida pelo globalSetup.
 */
export async function connectTestDb(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI não definida. Execute Jest com globalSetup.");
  }
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri);
}

/**
 * Desconecta do MongoDB de teste
 */
export async function teardownTestDb(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

/**
 * Limpa todas as collections do banco de teste
 *
 * Útil no beforeEach para garantir isolamento entre testes.
 */
export async function clearCollections(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}
