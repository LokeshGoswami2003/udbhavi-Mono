import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export function errorMiddleware(err, req, res, _next) {
  const statusCode = err.statusCode || err.status || 500;
  const code = err.code || "INTERNAL_SERVER_ERROR";

  logger.error("Request failed", {
    requestId: req.id,
    code,
    statusCode,
    error: err,
  });

  res.status(statusCode).json({
    ok: false,
    error: {
      code,
      message: statusCode === 500 ? "Something went wrong." : err.message,
    },
  });
}
