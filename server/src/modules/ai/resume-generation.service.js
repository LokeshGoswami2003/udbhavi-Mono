import { buildInitialResumePrompt, buildResumeChatPrompt } from "./resume-prompt.service.js";
import { callResumeJson, getActiveProviderName } from "./llm.service.js";

function bulletList(items = []) {
  return items.filter(Boolean).slice(0, 4).map((item) => `- ${item}`).join("\n");
}

function makeDraft({ resume, template }) {
  const data = resume.resumeData || {};
  const basics = data.basics || {};
  const firstExperience = data.experience?.[0];
  const firstProject = data.projects?.[0];

  return [
    `# ${basics.fullName || "Your Name"}`,
    basics.headline || "Target role headline",
    "",
    "## Summary",
    basics.summary || "Add a concise 2-3 line summary with role, core strengths, and strongest proof.",
    "",
    "## Skills",
    data.skills?.length ? data.skills.map((skill) => `${skill.category}: ${(skill.items || []).join(", ")}`).join("\n") : "Add grouped skills from your resume context.",
    "",
    "## Experience",
    firstExperience
      ? [`${firstExperience.role} - ${firstExperience.company}`, bulletList(firstExperience.bullets)].join("\n")
      : "Add your most relevant recent experience.",
    "",
    "## Projects",
    firstProject ? [`${firstProject.name}`, bulletList(firstProject.bullets)].join("\n") : "Add one strong project with role-relevant impact.",
    "",
    `Template: ${template.name}`,
  ].join("\n");
}

export async function generateInitialResume({ project, resume, template }) {
  const prompt = buildInitialResumePrompt({ project, resume, template });
  const fallback = {
    draft: makeDraft({ resume, template }),
    feedback: [
      "What target role should this version optimize for?",
      "Share 2-3 measurable wins if you have them.",
      "Confirm whether this resume must fit exactly one page.",
    ],
    nextAction: "Answer the feedback questions or refine the draft in chat.",
  };
  const result = await callResumeJson({ prompt, fallback });

  return {
    provider: getActiveProviderName(),
    promptVersion: "resume-initial-v1",
    resumeDraft: result.resumeDraft || result.draft || fallback.draft,
    feedback: result.feedback || fallback.feedback,
    nextAction: result.nextAction || fallback.nextAction,
  };
}

export async function continueResumeChat({ project, message }) {
  const prompt = buildResumeChatPrompt({ project, message });
  const fallback = {
    draft: project.ai?.resumeDraft || "",
    feedback: [
      "Add a number, scale, or outcome for the strongest bullet if you can.",
      "Mention the exact tools only if you used them directly.",
    ],
    nextAction: "Got it. I will use that context to tighten the next resume draft while keeping it factual and one-page friendly.",
  };
  const result = await callResumeJson({ prompt, fallback });

  return {
    provider: getActiveProviderName(),
    promptVersion: "resume-chat-v1",
    resumeDraft: result.resumeDraft || result.draft || fallback.draft,
    assistantMessage: result.nextAction || fallback.nextAction,
    feedback: result.feedback || fallback.feedback,
  };
}
