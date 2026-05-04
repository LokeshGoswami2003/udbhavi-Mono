import { env } from "../../config/env.js";
import { callBedrockJson } from "./bedrock.provider.js";
import { callMockResumeProvider } from "./mock-llm.provider.js";

export function getActiveProviderName() {
  if (env.llmProvider === "bedrock" && env.awsRegion && env.bedrockModelId) {
    return "bedrock";
  }

  return "mock";
}

export async function callResumeJson({ prompt, fallback }) {
  if (getActiveProviderName() !== "bedrock") {
    return callMockResumeProvider(fallback);
  }

  return callBedrockJson(prompt);
}
