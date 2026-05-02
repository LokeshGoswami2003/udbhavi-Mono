import { createServer } from "node:http";
import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

async function startServer() {
  await connectDatabase();

  const app = createApp();
  const server = createServer(app);

  server.listen(env.port, () => {
    console.log(`API server listening on http://localhost:${env.port}`);
  });

  const shutdown = async () => {
    console.log("Shutting down API server...");
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch((error) => {
  console.error("Failed to start API server", error);
  process.exit(1);
});
