/**
 * Conexão MongoDB via Mongoose
 *
 * Usado por scripts e repositórios. Em testes Jest, conecta ao mongodb-memory-server
 * (URI injetada pelo globalSetup).
 */

import mongoose from "mongoose";
import { getMongoDbUri } from "../../config/env.js";

let isConnected = false;

/**
 * Conecta ao MongoDB
 *
 * @param uri - URI de conexão (opcional, usa MONGODB_URI se não informada)
 */
export async function connect(uri?: string): Promise<void> {
  if (isConnected) return;
  const connectionUri = uri ?? getMongoDbUri();
  await mongoose.connect(connectionUri);
  isConnected = true;
}

/**
 * Desconecta do MongoDB
 */
export async function disconnect(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
}

/**
 * Verifica se está conectado ao MongoDB
 */
export function isConnectedToDb(): boolean {
  return mongoose.connection.readyState === 1;
}
