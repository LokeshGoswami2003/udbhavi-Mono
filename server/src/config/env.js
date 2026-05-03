import "dotenv/config";

const requiredEnv = ["MONGODB_URI"];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  mongodbUri: process.env.MONGODB_URI,
  mongodbDbName: process.env.MONGODB_DB_NAME ?? "udbhavi",
  auth0IssuerBaseUrl: process.env.AUTH0_ISSUER_BASE_URL?.replace(/\/$/, ""),
  auth0Audience: process.env.AUTH0_AUDIENCE,
  auth0ClaimsNamespace: (process.env.AUTH0_CLAIMS_NAMESPACE ?? "https://api.udbhavi.local").replace(/\/$/, ""),
};
