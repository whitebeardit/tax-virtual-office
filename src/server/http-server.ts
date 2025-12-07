import express from "express";
import { env } from "../config/env.js";
import { registerQueryRoutes } from "./routes/query.routes.js";
import { registerAdminRoutes } from "./routes/admin.routes.js";
import { errorHandler } from "../middleware/error-handler.js";
import { logger } from "../utils/logger.js";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { swaggerOptions } from "./swagger.config.js";

export async function startHttpServer() {
  const app = express();
  app.use(express.json());

  // Swagger documentation
  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  registerQueryRoutes(app);
  registerAdminRoutes(app);

  // Error handler must be last
  app.use(errorHandler);

  app.listen(env.port, () => {
    logger.info({ port: env.port }, "HTTP server running");
  });
}
