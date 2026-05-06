import { normalizeResumeData } from "../resumes/resume-data.js";
import { buildInitialResumePrompt, buildResumeChatPrompt } from "./resume-prompt.service.js";
import { callResumeChatJson, callResumeExtractionJson, getActiveProviderName } from "./llm.service.js";

function cleanList(value, limit = 6) {
  return Array.isArray(value) ? value.filter(Boolean).map(String).slice(0, limit) : [];
}

function cleanPatchOps(value) {
  return Array.isArray(value) ? value.slice(0, 20).filter((item) => item && typeof item === "object") : [];
}

export async function generateInitialResumeData({ project, resume, template }) {
  const prompt = buildInitialResumePrompt({ project, resume, template });
  const result = await callResumeExtractionJson({ prompt });

  if (!result.resumeData || typeof result.resumeData !== "object") {
    const error = new Error("The AI could not extract structured resume data from this source.");
    error.statusCode = 422;
    error.code = "RESUME_DATA_EXTRACTION_INVALID";
    throw error;
  }

  return {
    provider: result.providerUsed || getActiveProviderName(),
    providerError: result.providerError,
    promptVersion: "resume-data-extraction-v1",
    resumeData: normalizeResumeData(result.resumeData),
    assistantMessage: result.assistantMessage || "I pulled the usable resume details into a structured draft.",
    feedback: cleanList(result.feedback),
    nextAction: result.nextAction || "Review the PDF preview, then tell me what role or job description to target.",
  };
}

export async function continueResumeChat({ project, message }) {
  const prompt = buildResumeChatPrompt({ project, message });
  const result = await callResumeChatJson({ prompt });

  return {
    provider: result.providerUsed || getActiveProviderName(),
    providerError: result.providerError,
    promptVersion: "resume-chat-patch-v1",
    assistantMessage: result.assistantMessage || "I checked that and kept the resume grounded in your real experience.",
    intent: result.intent || "no_change",
    didModifyResume: Boolean(result.didModifyResume),
    changeSummary: cleanList(result.changeSummary),
    patchOps: cleanPatchOps(result.patchOps),
    suggestions: cleanList(result.suggestions),
    questions: cleanList(result.questions),
    quickReplies: cleanList(result.quickReplies, 4),
    safetyNotes: cleanList(result.safetyNotes),
  };
}

export const generateInitialResume = generateInitialResumeData;
