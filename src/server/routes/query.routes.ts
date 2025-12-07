import { Express, Request, Response } from "express";
import { runUserQueryWorkflow } from "../../workflows/user-query";

export function registerQueryRoutes(app: Express) {
  app.post("/query", async (req: Request, res: Response) => {
    try {
      const result = await runUserQueryWorkflow(req.body);
      res.json(result);
    } catch (err) {
      console.error("/query failed", err);
      res.status(500).json({ error: "internal_error" });
    }
  });
}
