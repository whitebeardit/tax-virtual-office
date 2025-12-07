import { startHttpServer } from "./server/http-server";
import { runDailyPortalsScan } from "./workflows/daily-portals-scan";

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
  console.error("Fatal error:", err);
  process.exit(1);
});
