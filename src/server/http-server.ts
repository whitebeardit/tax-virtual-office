import express from "express";
import { env } from "../config/env.js";
import { registerQueryRoutes } from "./routes/query.routes.js";
import { registerAdminRoutes } from "./routes/admin.routes.js";

export async function startHttpServer() {
  const app = express();
  app.use(express.json());

  registerQueryRoutes(app);
  registerAdminRoutes(app);

  app.listen(env.port, () => {
    console.log(`HTTP server running on port ${env.port}`);
  });
}
