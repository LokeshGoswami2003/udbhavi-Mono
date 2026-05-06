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
  awsRegion: process.env.AWS_REGION ?? "us-east-1",
  awsBearerTokenBedrock: process.env.AWS_BEARER_TOKEN_BEDROCK,
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  bedrockModelId: process.env.BEDROCK_MODEL_ID ?? "minimax.minimax-m2.5",
  bedrockMaxTokens: Number(process.env.BEDROCK_MAX_TOKENS ?? 8000),
  llmProvider: process.env.LLM_PROVIDER ?? "bedrock",
  latexCompiler: process.env.LATEX_COMPILER ?? "auto",
  latexCompileTimeoutMs: Number(process.env.LATEX_COMPILE_TIMEOUT_MS ?? 60000),
};
