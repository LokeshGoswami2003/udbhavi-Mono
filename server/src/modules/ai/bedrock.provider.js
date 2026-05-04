import {
  BedrockRuntimeClient,
  ConverseCommand,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
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

function getModelFamily() {
  if (env.bedrockModelId.includes("nova")) {
    return "nova";
  }

  if (env.bedrockModelId.includes("anthropic") || env.bedrockModelId.includes("claude")) {
    return "anthropic";
  }

  return "unknown";
}

function toNovaContentBlocks({ user, documents = [] }) {
  return [
    { text: JSON.stringify(user) },
    ...documents.map((document, index) => ({
      document: {
        format: document.format,
        name: `Resume Source ${index + 1}`,
        source: {
          bytes: document.bytes,
        },
      },
    })),
  ];
}

async function callNovaJson({ system, user, documents }) {
  const response = await getClient().send(
    new ConverseCommand({
      modelId: env.bedrockModelId,
      system: [{ text: system }],
      messages: [
        {
          role: "user",
          content: toNovaContentBlocks({ user, documents }),
        },
      ],
      inferenceConfig: {
        maxTokens: env.bedrockMaxTokens,
        temperature: 0.2,
      },
    }),
  );

  const text = response.output?.message?.content?.find((part) => part.text)?.text || "";
  return parseJson(text);
}

async function callAnthropicJson({ system, user }) {
  const body = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: env.bedrockMaxTokens,
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

export async function callBedrockJson({ system, user, documents = [] }) {
  if (getModelFamily() === "nova") {
    return callNovaJson({ system, user, documents });
  }

  return callAnthropicJson({ system, user });
}
