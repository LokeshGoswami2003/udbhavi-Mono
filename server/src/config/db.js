import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase() {
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.mongodbUri, {
    dbName: env.mongodbDbName,
    serverSelectionTimeoutMS: 10000,
  });
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
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
