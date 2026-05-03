import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export async function connectDatabase() {
  mongoose.set("strictQuery", true);

  logger.info("Connecting database", {
    database: env.mongodbDbName,
  });

  await mongoose.connect(env.mongodbUri, {
    dbName: env.mongodbDbName,
    serverSelectionTimeoutMS: 10000,
  });

  logger.info("Database connected", {
    database: mongoose.connection.name || env.mongodbDbName,
    host: mongoose.connection.host,
  });
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  logger.info("Database disconnected");
}

export function getDatabaseStatus() {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return {
    status: states[mongoose.connection.readyState] ?? "unknown",
    name: mongoose.connection.name || env.mongodbDbName,
  };
}
