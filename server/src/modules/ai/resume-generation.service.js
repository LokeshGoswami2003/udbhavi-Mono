import { buildInitialResumePrompt, buildResumeChatPrompt } from "./resume-prompt.service.js";
import { callResumeJson, getActiveProviderName } from "./llm.service.js";

function makeResumeData({ resume }) {
  const data = resume.resumeData || {};

  return {
    ...data,
    basics: {
      ...(data.basics || {}),
      fullName: data.basics?.fullName || "Your Name",
      headline: data.basics?.headline || "Target role headline",
      summary: data.basics?.summary || "Add a concise 2-3 line summary with role, core strengths, and strongest proof.",
    },
    skills: data.skills || [],
    experience: data.experience || [],
    education: data.education || [],
    projects: data.projects || [],
  };
}

export async function generateInitialResume({ project, resume, template }) {
  const prompt = buildInitialResumePrompt({ project, resume, template });
  const result = await callResumeJson({ prompt });

  return {
    provider: result.providerUsed || getActiveProviderName(),
    providerError: result.providerError,
    promptVersion: "resume-initial-v1",
    resumeData: result.resumeData || makeResumeData({ resume, template }),
    assistantMessage: result.assistantMessage,
    feedback: result.feedback || [],
    nextAction: result.nextAction || result.assistantMessage || "Review the draft and tell me what role or job description to target next.",
  };
}

export async function continueResumeChat({ project, message, template }) {
  const prompt = buildResumeChatPrompt({ project, message, template });
  const result = await callResumeJson({ prompt });

  return {
    provider: result.providerUsed || getActiveProviderName(),
    providerError: result.providerError,
    promptVersion: "resume-chat-v1",
    resumeData: result.resumeData || project.ai?.resumeData || {},
    assistantMessage: result.assistantMessage || result.nextAction || "I updated the draft with that context.",
    feedback: result.feedback || [],
    nextAction: result.nextAction,
  };
}
