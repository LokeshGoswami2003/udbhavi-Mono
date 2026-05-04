import { callResumeJson } from "./llm.service.js";

try {
  const result = await callResumeJson({
    prompt: {
      system: "Return structured JSON only.",
      user: {
        task: "Return a minimal JSON object confirming the Bedrock smoke call.",
        outputShape: {
          resumeData: {},
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
