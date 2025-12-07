import { Express, Request, Response } from "express";
import { runDailyPortalsScan } from "../../workflows/daily-portals-scan.js";
import { logger } from "../../utils/logger.js";

export function registerAdminRoutes(app: Express) {
  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Health check do servidor
   *     tags: [Admin]
   *     responses:
   *       200:
   *         description: Servidor está funcionando
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 ok:
   *                   type: boolean
   *                   example: true
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  app.get("/health", (_req: Request, res: Response) => {
    logger.debug("Health check requested");
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  /**
   * @swagger
   * /admin/run-daily:
   *   post:
   *     summary: Executa varredura diária de portais fiscais
   *     tags: [Admin]
   *     responses:
   *       200:
   *         description: Varredura iniciada/completada
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: completed
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       500:
   *         description: Erro interno
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: internal_error
   */
  app.post("/admin/run-daily", async (_req: Request, res: Response) => {
    try {
      logger.info("Starting daily portals scan");
      await runDailyPortalsScan();
      logger.info("Daily portals scan completed");
      res.json({ status: "completed", timestamp: new Date().toISOString() });
    } catch (err) {
      logger.error({ error: err }, "/admin/run-daily failed");
      res.status(500).json({ error: "internal_error" });
    }
  });
}
