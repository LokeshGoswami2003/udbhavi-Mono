import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/error.js";
import { notFoundMiddleware } from "./middleware/not-found.js";
import { publicApiLimiter } from "./middleware/rate-limit.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { authenticateJwt } from "./middleware/auth.js";
import { syncUser } from "./middleware/sync-user.js";
import healthRoutes from "./modules/health/health.routes.js";
import contextRoutes from "./modules/context/context.routes.js";
import projectRoutes from "./modules/projects/project.routes.js";
import resumeRoutes from "./modules/resumes/resume.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import { logger } from "./utils/logger.js";

morgan.token("request-id", (req) => req.id);

export function createApp() {
  const app = express();

  // Behind nginx on the same host — trust loopback so X-Forwarded-* headers
  // (real client IP, scheme) are honored by rate limiting and req.ip.
  app.set("trust proxy", "loopback");

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
  app.use("/api/v1", authenticateJwt, userRoutes);
  app.use("/api/v1", authenticateJwt, syncUser, contextRoutes);
  app.use("/api/v1", authenticateJwt, syncUser, resumeRoutes);
  app.use("/api/v1", authenticateJwt, syncUser, projectRoutes);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
