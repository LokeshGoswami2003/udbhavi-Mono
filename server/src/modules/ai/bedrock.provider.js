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
  const trimmed = String(text).replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced || trimmed;
  const jsonText = extractJsonObject(candidate);

  if (!jsonText) {
    throw new Error("LLM response did not include JSON.");
  }

  return JSON.parse(jsonText);
}

function extractJsonObject(value = "") {
  const text = String(value).trim();

  if (text.startsWith("{") && text.endsWith("}")) {
    return text;
  }

  const start = text.indexOf("{");
  if (start === -1) {
    return "";
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === "\"") {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, index + 1);
      }
    }
  }

  return "";
}

function getModelFamily() {
  if (env.bedrockModelId.includes("minimax")) {
    return "minimax";
  }

  if (env.bedrockModelId.includes("nova")) {
    return "nova";
  }

  if (env.bedrockModelId.includes("anthropic") || env.bedrockModelId.includes("claude")) {
    return "anthropic";
  }

  return "unknown";
}

function toConverseContentBlocks({ user, documents = [] }) {
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

async function callConverseJson({ system, user, documents, temperature = 0.2 }) {
  const response = await getClient().send(
    new ConverseCommand({
      modelId: env.bedrockModelId,
      system: [{ text: system }],
      messages: [
        {
          role: "user",
          content: toConverseContentBlocks({ user, documents }),
        },
      ],
      inferenceConfig: {
        maxTokens: env.bedrockMaxTokens,
        temperature,
      },
    }),
  );

  const text = response.output?.message?.content?.find((part) => part.text)?.text || "";
  return parseJson(text);
}

async function callAnthropicJson({ system, user, temperature = 0.2 }) {
  const body = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: env.bedrockMaxTokens,
    temperature,
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

export async function callBedrockJson({ system, user, documents = [], temperature = 0.2 }) {
  if (["minimax", "nova"].includes(getModelFamily())) {
    try {
      return await callConverseJson({ system, user, documents, temperature });
    } catch (error) {
      const documentRejected = documents.length && error.name === "ValidationException" && /document|content/i.test(error.message || "");

      if (!documentRejected) {
        throw error;
      }

      return callConverseJson({ system, user, documents: [], temperature });
    }
  }

  return callAnthropicJson({ system, user, temperature });
}
