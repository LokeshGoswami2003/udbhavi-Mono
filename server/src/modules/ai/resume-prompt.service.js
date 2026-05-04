function compactResumeFacts(resumeData = {}) {
  return {
    basics: resumeData.basics || {},
    skills: resumeData.skills || [],
    experience: resumeData.experience || [],
    education: resumeData.education || [],
    projects: resumeData.projects || [],
  };
}

export function buildInitialResumePrompt({ project, resume, template }) {
  return {
    system: [
      "You are an expert resume strategist and one-page resume editor.",
      "Return structured JSON only.",
      "Do not invent facts, employers, dates, degrees, metrics, or tools.",
      "Think about final page density, section order, white space, and ATS readability.",
      "If context is missing, ask for it as feedback instead of making it up.",
    ].join(" "),
    user: {
      task: "Create a first resume draft and feedback for the selected template.",
      project: {
        title: project.title,
        templateId: project.templateId,
      },
      template,
      resumeFacts: compactResumeFacts(resume.resumeData),
      outputShape: {
        resumeDraft: "markdown-like resume preview text",
        feedback: ["specific question or improvement request"],
        nextAction: "short user-facing next step",
      },
    },
  };
}

export function buildResumeChatPrompt({ project, message }) {
  return {
    system: [
      "You are helping refine a one-page resume draft.",
      "Use the existing draft and user message as context.",
      "Return concise feedback and safe patch-style changes.",
      "Do not invent unsupported facts.",
    ].join(" "),
    user: {
      message,
      currentDraft: project.ai?.resumeDraft || "",
      currentFeedback: project.ai?.feedback || [],
    },
  };
}
