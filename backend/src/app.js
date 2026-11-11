import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { openApiSpec } from "./config/openapi.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { createAiRouter } from "./routes/ai.routes.js";
import { createNotesRouter } from "./routes/notes.routes.js";
import { createNotesService } from "./services/notes.service.js";
import { createDeepSeekService } from "./services/deepseek.service.js";

export function createApp({
  notesService = createNotesService(),
  aiService = createDeepSeekService()
} = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors());
  app.use(express.json({ limit: "32kb" }));

  app.get("/health", (_req, res) => res.json({ estado: "ok" }));
  app.use("/api/notas", createNotesRouter({ notesService, aiService }));
  app.use("/api/ia", createAiRouter({ aiService, notesService }));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec, {
    customSiteTitle: "Smart Notes API",
    swaggerOptions: { persistAuthorization: false }
  }));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
