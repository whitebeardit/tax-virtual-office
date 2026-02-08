import { connect } from "./infrastructure/database/mongoose-connection.js";
import { startHttpServer } from "./server/http-server.js";
import { runDailyPortalsScan } from "./workflows/daily-portals-scan.js";
import { logger } from "./utils/logger.js";

async function main() {
  await connect();

  const mode = process.env.APP_MODE || "api";

  if (mode === "api") {
    await startHttpServer();
  }

  if (mode === "daily-portals-scan") {
    await runDailyPortalsScan();
  }
}

main().catch((err) => {
  const errorInfo =
    err instanceof Error
      ? { message: err.message, stack: err.stack, name: err.name }
      : { error: err };
  logger.error(errorInfo, "Fatal error");
  process.exit(1);
});
