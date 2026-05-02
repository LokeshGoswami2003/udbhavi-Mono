import { getDatabaseStatus } from "../../config/db.js";

export function getHealthStatus() {
  return {
    service: "udbhavi-api",
    database: getDatabaseStatus(),
    uptimeSeconds: Math.round(process.uptime()),
  };
}
