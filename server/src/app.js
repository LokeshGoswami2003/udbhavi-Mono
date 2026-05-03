import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/error.js";
import { notFoundMiddleware } from "./middleware/not-found.js";
import { publicApiLimiter } from "./middleware/rate-limit.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import healthRoutes from "./modules/health/health.routes.js";
import { logger } from "./utils/logger.js";

morgan.token("request-id", (req) => req.id);

export function createApp() {
  const app = express();

  app.use(requestIdMiddleware);
  app.use(helmet());
  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(
    morgan(":request-id :method :url :status :response-time ms :res[content-length]", {
      skip: () => env.nodeEnv === "test",
      stream: {
        write: (message) => logger.info("HTTP request", { request: message.trim() }),
      },
    }),
  );

  app.use("/api/v1", publicApiLimiter);
  app.use("/api/v1", healthRoutes);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
