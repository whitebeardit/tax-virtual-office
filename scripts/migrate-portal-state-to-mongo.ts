/**
 * Migra portal-state.json para MongoDB (collection tvo-portal-state)
 *
 * Uso: npm run migrate:portal-state
 *
 * - Lê agents/.cache/portal-state.json se existir
 * - Conecta ao MongoDB e insere/atualiza documento em tvo-portal-state
 * - Renomeia portal-state.json para portal-state.json.migrated após sucesso
 * - Se o arquivo não existir, cria documento vazio
 */

import * as fs from "fs";
import * as path from "path";
import "dotenv/config";
import { connect, disconnect } from "../src/infrastructure/database/mongoose-connection.js";
import { TvoPortalStateModel } from "../src/models/tvo-portal-state.model.js";

const PORTAL_CACHE_DIR = path.resolve(process.cwd(), "agents", ".cache");
const PORTAL_STATE_FILE = path.join(PORTAL_CACHE_DIR, "portal-state.json");
const GLOBAL_KEY = "global";

interface PortalStateJson {
  lastRun?: string;
  seen?: Record<string, string[]>;
}

async function main(): Promise<void> {
  let state: PortalStateJson = { seen: {}, lastRun: undefined };

  if (fs.existsSync(PORTAL_STATE_FILE)) {
    const content = fs.readFileSync(PORTAL_STATE_FILE, "utf-8");
    const parsed = JSON.parse(content) as PortalStateJson;
    state = {
      seen: parsed.seen || {},
      lastRun: parsed.lastRun,
    };
    const seen = state.seen ?? {};
    console.log(
      `\n📂 Lido portal-state.json: ${Object.keys(seen).length} portal(is), ${Object.values(seen).reduce((a, b) => a + b.length, 0)} hash(es)`
    );
  } else {
    console.log("\n📂 Arquivo portal-state.json não encontrado. Criando estado vazio.");
  }

  await connect();

  try {
    const update: Record<string, unknown> = { seen: state.seen ?? {} };
    if (state.lastRun) {
      update.lastRun = new Date(state.lastRun);
    }
    await TvoPortalStateModel.findOneAndUpdate(
      { key: GLOBAL_KEY },
      { $set: update },
      { upsert: true }
    ).exec();

    console.log("✅ Estado migrado para MongoDB (collection tvo-portal-state)");

    if (fs.existsSync(PORTAL_STATE_FILE)) {
      const migratedPath = `${PORTAL_STATE_FILE}.migrated`;
      fs.renameSync(PORTAL_STATE_FILE, migratedPath);
      console.log(`✅ Arquivo renomeado para ${path.basename(migratedPath)}`);
    }
  } finally {
    await disconnect();
  }
}

main().catch((err) => {
  console.error("❌ Erro na migração:", err.message);
  process.exit(1);
});
