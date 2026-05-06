import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

function serializeError(err, statusCode, code) {
  return {
    name: err.name,
    message: err.message,
    code,
    statusCode,
    stack: env.nodeEnv === "development" ? err.stack : undefined,
  };
}

export function errorMiddleware(err, req, res, _next) {
  const statusCode = err.statusCode || err.status || 500;
  const code = err.code || (statusCode === 401 ? "AUTHENTICATION_REQUIRED" : "INTERNAL_SERVER_ERROR");
  const logLevel = statusCode >= 500 ? "error" : "warn";

  logger[logLevel]("Request failed", {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    code,
    statusCode,
    error: serializeError(err, statusCode, code),
  });

  res.status(statusCode).json({
    ok: false,
    error: {
      code,
      message: statusCode === 500 ? "Something went wrong." : err.message,
      requestId: req.id,
    },
  });
}
