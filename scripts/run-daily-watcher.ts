import { runDailyPortalsScan } from "../src/workflows/daily-portals-scan";

runDailyPortalsScan().catch((err) => {
  console.error("Daily watcher failed", err);
  process.exit(1);
});
