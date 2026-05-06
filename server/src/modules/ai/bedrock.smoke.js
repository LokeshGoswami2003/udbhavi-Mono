import { callResumeExtractionJson } from "./llm.service.js";

try {
  const result = await callResumeExtractionJson({
    prompt: {
      system: "Return one valid JSON object only. Do not wrap it in markdown.",
      user: {
        task: "Return a minimal JSON object confirming the Bedrock smoke call.",
        outputShape: {
          resumeData: {},
          assistantMessage: "string",
          feedback: [],
          nextAction: "string",
        },
      },
    },
  });

  const summary = {
    ok: result.providerUsed === "bedrock",
    providerUsed: result.providerUsed,
  };

  console.log(JSON.stringify(summary, null, 2));
} catch (error) {
  console.log(JSON.stringify({
    ok: false,
    code: error.code || "BEDROCK_SMOKE_FAILED",
    message: error.message,
    providerError: error.providerError,
  }, null, 2));

  process.exitCode = 1;
}
