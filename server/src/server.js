import { createServer } from "node:http";
import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

async function startServer() {
  await connectDatabase();

  const app = createApp();
  const server = createServer(app);

  server.listen(env.port, () => {
    logger.info("API server listening", {
      url: `http://localhost:${env.port}`,
      nodeEnv: env.nodeEnv,
    });
  });

  const shutdown = async () => {
    logger.info("Shutting down API server");
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch((error) => {
  logger.error("Failed to start API server", { error });
  process.exit(1);
});
