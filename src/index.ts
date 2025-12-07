import { startHttpServer } from "./server/http-server.js";
import { runDailyPortalsScan } from "./workflows/daily-portals-scan.js";
import { logger } from "./utils/logger.js";

async function main() {
  const mode = process.env.APP_MODE || "api";

  if (mode === "api") {
    await startHttpServer();
  }

  if (mode === "daily-portals-scan") {
    await runDailyPortalsScan();
  }
}

main().catch((err) => {
  logger.error({ error: err }, "Fatal error");
  process.exit(1);
});
