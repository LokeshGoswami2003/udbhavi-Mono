import { getHealthStatus } from "./health.service.js";

export function getHealth(_req, res) {
  res.json({
    ok: true,
    data: getHealthStatus(),
  });
}
