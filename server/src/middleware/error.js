import { env } from "../config/env.js";

export function errorMiddleware(err, req, res, _next) {
  const statusCode = err.statusCode || err.status || 500;
  const code = err.code || "INTERNAL_SERVER_ERROR";

  if (env.nodeEnv !== "test") {
    console.error({
      requestId: req.id,
      code,
      message: err.message,
      stack: env.nodeEnv === "development" ? err.stack : undefined,
    });
  }

  res.status(statusCode).json({
    ok: false,
    error: {
      code,
      message:
        statusCode === 500 ? "Something went wrong." : err.message,
    },
  });
}
