import { auth } from "express-oauth2-jwt-bearer";
import { env } from "../config/env.js";

function createAuthConfigError() {
  const error = new Error("Backend authentication is not configured.");
  error.statusCode = 503;
  error.code = "AUTH_CONFIG_MISSING";
  return error;
}

const auth0Jwt =
  env.auth0IssuerBaseUrl && env.auth0Audience
    ? auth({
        issuerBaseURL: env.auth0IssuerBaseUrl,
        audience: env.auth0Audience,
      })
    : null;

export function authenticateJwt(req, res, next) {
  if (!auth0Jwt) {
    next(createAuthConfigError());
    return;
  }

  auth0Jwt(req, res, next);
}
