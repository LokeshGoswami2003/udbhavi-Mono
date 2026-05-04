import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { env } from "../../config/env.js";

function getClient() {
  return new BedrockRuntimeClient({
    region: env.awsRegion,
    credentials: env.awsAccessKeyId && env.awsSecretAccessKey
      ? {
          accessKeyId: env.awsAccessKeyId,
          secretAccessKey: env.awsSecretAccessKey,
        }
      : undefined,
  });
}

function parseJson(text) {
  const trimmed = text.trim();
  const jsonText = trimmed.startsWith("{") ? trimmed : trimmed.match(/\{[\s\S]*\}/)?.[0];

  if (!jsonText) {
    throw new Error("LLM response did not include JSON.");
  }

  return JSON.parse(jsonText);
}

export async function callBedrockJson({ system, user }) {
  const body = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 2200,
    temperature: 0.2,
    system,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: JSON.stringify(user) }],
      },
    ],
  };

  const response = await getClient().send(
    new InvokeModelCommand({
      modelId: env.bedrockModelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(body),
    }),
  );

  const payload = JSON.parse(new TextDecoder().decode(response.body));
  const text = payload.content?.find((part) => part.type === "text")?.text || "";
  return parseJson(text);
}
