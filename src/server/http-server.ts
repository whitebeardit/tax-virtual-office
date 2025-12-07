import express from "express";
import { env } from "../config/env";
import { registerQueryRoutes } from "./routes/query.routes";
import { registerAdminRoutes } from "./routes/admin.routes";

export async function startHttpServer() {
  const app = express();
  app.use(express.json());

  registerQueryRoutes(app);
  registerAdminRoutes(app);

  app.listen(env.port, () => {
    console.log(`HTTP server running on port ${env.port}`);
  });
}
