import { Express, Request, Response } from "express";
import { runUserQueryWorkflow } from "../../workflows/user-query.js";

export function registerQueryRoutes(app: Express) {
  app.post("/query", async (req: Request, res: Response) => {
    try {
      const result = await runUserQueryWorkflow(req.body);
      res.json(result);
    } catch (err) {
      console.error("/query failed", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : undefined;
      console.error("Error details:", { errorMessage, errorStack });
      res.status(500).json({ 
        error: "internal_error",
        message: errorMessage,
        ...(process.env.NODE_ENV === "development" && { stack: errorStack })
      });
    }
  });
}
