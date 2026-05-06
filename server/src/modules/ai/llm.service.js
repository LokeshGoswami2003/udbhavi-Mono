import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { callBedrockJson } from "./bedrock.provider.js";

const bedrockAccountBlockedPattern = /INVALID_PAYMENT_INSTRUMENT|payment instrument|subscription/i;

function classifyBedrockError(error) {
  if (bedrockAccountBlockedPattern.test(error.message || "")) {
    return {
      code: "BEDROCK_PAYMENT_INSTRUMENT_REQUIRED",
      message: "AWS Bedrock model access is blocked by the account payment or Marketplace subscription state.",
    };
  }

  if (error.name === "AccessDeniedException") {
    return { code: "BEDROCK_ACCESS_DENIED", message: "AWS Bedrock denied access to the configured model." };
  }

  if (error.name === "ValidationException") {
    return { code: "BEDROCK_MODEL_OR_PAYLOAD_INVALID", message: "AWS Bedrock rejected the configured model or request payload." };
  }

  if (error.name === "ResourceNotFoundException") {
    return { code: "BEDROCK_MODEL_OR_PROFILE_NOT_FOUND", message: "AWS Bedrock could not find the configured model or inference profile for this credential and region." };
  }

  if (error.name === "ThrottlingException" || error.name === "TooManyRequestsException") {
    return { code: "BEDROCK_THROTTLED", message: "AWS Bedrock throttled the request." };
  }

  if (error instanceof SyntaxError || /JSON/i.test(error.message || "")) {
    return { code: "LLM_JSON_INVALID", message: "The AI returned invalid JSON." };
  }

  return { code: "BEDROCK_UNAVAILABLE", message: "AWS Bedrock is unavailable for this request." };
}

export function getActiveProviderName() {
  if (env.llmProvider === "bedrock" && env.awsRegion && env.bedrockModelId) {
    return "bedrock";
  }

  return "unavailable";
}

function ensureConfigured() {
  if (getActiveProviderName() !== "bedrock") {
    const error = new Error("LLM provider is not configured.");
    error.statusCode = 503;
    error.code = "LLM_PROVIDER_NOT_CONFIGURED";
    throw error;
  }
}

async function callJsonWithRetry({ prompt, temperature, label }) {
  ensureConfigured();

  try {
    return { ...(await callBedrockJson({ ...prompt, temperature })), providerUsed: "bedrock" };
  } catch (firstError) {
    if (!(firstError instanceof SyntaxError || /JSON/i.test(firstError.message || ""))) {
      throwProviderError(firstError, label);
    }

    logger.warn("Bedrock JSON parse failed; retrying once", {
      module: "ai",
      provider: "bedrock",
      label,
      modelId: env.bedrockModelId,
      providerErrorCode: "LLM_JSON_INVALID",
    });

    try {
      return {
        ...(await callBedrockJson({
          ...prompt,
          system: `${prompt.system} Return only a syntactically valid JSON object. Do not include markdown, comments, or prose outside JSON.`,
          temperature: Math.min(temperature, 0.15),
        })),
        providerUsed: "bedrock",
      };
    } catch (secondError) {
      throwProviderError(secondError, label);
    }
  }
}

function throwProviderError(error, label) {
  const providerError = classifyBedrockError(error);

  logger.warn("Bedrock provider failed", {
    module: "ai",
    provider: "bedrock",
    label,
    providerErrorCode: providerError.code,
    errorName: error.name,
    errorCode: error.code || error.Code,
    statusCode: error.$metadata?.httpStatusCode,
    requestId: error.$metadata?.requestId,
    modelId: env.bedrockModelId,
    region: env.awsRegion,
  });

  const llmError = new Error(providerError.message);
  llmError.statusCode = providerError.code === "LLM_JSON_INVALID" ? 422 : 503;
  llmError.code = providerError.code;
  llmError.providerError = providerError;
  throw llmError;
}

export async function callResumeExtractionJson({ prompt }) {
  return callJsonWithRetry({ prompt, temperature: 0.15, label: "resume-extraction" });
}

export async function callResumeChatJson({ prompt }) {
  return callJsonWithRetry({ prompt, temperature: 0.4, label: "resume-chat" });
}

export async function callJdOptimizerJson({ prompt }) {
  return callJsonWithRetry({ prompt, temperature: 0.3, label: "jd-optimizer" });
}

export async function callResumeJson({ prompt }) {
  return callResumeExtractionJson({ prompt });
}
