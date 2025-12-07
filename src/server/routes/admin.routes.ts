import { Express, Request, Response } from "express";
import { runDailyPortalsScan } from "../../workflows/daily-portals-scan";

export function registerAdminRoutes(app: Express) {
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post("/admin/run-daily", async (_req: Request, res: Response) => {
    try {
      await runDailyPortalsScan();
      res.json({ status: "scheduled" });
    } catch (err) {
      console.error("/admin/run-daily failed", err);
      res.status(500).json({ error: "internal_error" });
    }
  });
}
