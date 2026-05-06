import { logger } from "../../utils/logger.js";
import { generateInitialResumeData, continueResumeChat } from "../ai/resume-generation.service.js";
import { compileLatexToPdf } from "../render/latex-compile.service.js";
import { renderResumeLatex } from "../render/resume-render.service.js";
import { normalizeResumeData } from "../resumes/resume-data.js";
import { applyResumePatchOps } from "../resumes/resume-patch.service.js";
import { getResumeForUser } from "../resumes/resume.service.js";
import { readResumeFile } from "../resumes/resume-storage.service.js";
import { getTemplate } from "../templates/template.service.js";
import { Project } from "./project.model.js";

function toProjectResponse(project) {
  return {
    id: project.id,
    title: project.title,
    status: project.status,
    resumeId: project.resumeId,
    target: project.target,
    templateId: project.templateId,
    ai: project.ai,
    updatedAt: project.updatedAt,
  };
}

function notFound() {
  const error = new Error("Project not found.");
  error.statusCode = 404;
  error.code = "PROJECT_NOT_FOUND";
  return error;
}

function getDocumentFormat(mimeType = "") {
  if (mimeType === "application/pdf") {
    return "pdf";
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    return mimeType === "application/msword" ? "doc" : "docx";
  }

  return null;
}

async function withSourceDocument(resume) {
  const format = getDocumentFormat(resume.file?.mimeType);

  if (!resume.file?.fileId || !format) {
    return resume;
  }

  const bytes = await readResumeFile(resume.file.fileId);

  if (!bytes?.length) {
    return resume;
  }

  return {
    ...resume.toObject(),
    sourceDocument: {
      format,
      mimeType: resume.file.mimeType,
      bytes,
    },
  };
}

export async function listProjects(userId) {
  const projects = await Project.find({ userId, deletedAt: null }).sort({ updatedAt: -1 });
  return projects.map(toProjectResponse);
}

export async function createProject({ userId, body, requestId }) {
  const resumeId = body.resumeId || body.primaryResumeId;

  if (!resumeId) {
    const error = new Error("Set up a resume before creating a project.");
    error.statusCode = 400;
    error.code = "RESUME_REQUIRED";
    throw error;
  }

  await getResumeForUser({ userId, resumeId });

  const title = body.title?.trim() || "Untitled resume project";
  const project = await Project.create({
    userId,
    resumeId,
    title,
    target: {},
    status: "template_pending",
  });

  logger.info("project.created", {
    requestId,
    module: "projects",
    userId: userId.toString(),
    projectId: project.id,
    resumeId: String(resumeId),
  });

  return toProjectResponse(project);
}

export async function getProjectForUser({ userId, projectId }) {
  const project = await Project.findOne({ _id: projectId, userId, deletedAt: null });

  if (!project) {
    throw notFound();
  }

  return project;
}

export async function selectTemplateAndGenerate({ userId, projectId, templateId }) {
  const project = await getProjectForUser({ userId, projectId });
  const resume = await withSourceDocument(await getResumeForUser({ userId, resumeId: project.resumeId }));
  const template = getTemplate(templateId);

  project.templateId = template.id;
  project.status = "processing";
  await project.save();

  try {
    const generated = await generateInitialResumeData({ project: { ...project.toObject(), templateId: template.id }, resume, template });
    const resumeData = normalizeResumeData(generated.resumeData);
    const latexSource = renderResumeLatex({ resumeData, templateId: template.id });

    project.status = "ready";
    project.ai = {
      provider: generated.provider,
      providerError: generated.providerError,
      promptVersion: generated.promptVersion,
      resumeData,
      renderedHtml: undefined,
      latexSource,
      feedback: generated.feedback,
      nextAction: generated.nextAction,
      messages: [
        {
          role: "assistant",
          content: generated.assistantMessage || generated.nextAction,
          metadata: {
            suggestions: generated.feedback,
            quickReplies: ["Make it more concise", "Improve my bullets", "Target a job description"],
          },
        },
      ],
    };

    await project.save();
    return toProjectResponse(project);
  } catch (error) {
    project.status = "failed";
    project.ai = {
      ...(project.ai || {}),
      provider: "bedrock",
      providerError: error.providerError || {
        code: error.code || "LLM_GENERATION_FAILED",
        message: error.message,
      },
      messages: [
        ...(project.ai?.messages || []),
        {
          role: "assistant",
          content: "I could not generate this draft because the AI provider is unavailable. Please retry after the provider is ready.",
        },
      ],
    };
    await project.save();
    throw error;
  }
}

export async function addProjectMessage({ userId, projectId, message }) {
  const project = await getProjectForUser({ userId, projectId });
  const currentResumeData = normalizeResumeData(project.ai?.resumeData || {});
  const generated = await continueResumeChat({ project: { ...project.toObject(), ai: { ...(project.ai || {}), resumeData: currentResumeData } }, message });
  const nextResumeData = generated.didModifyResume ? applyResumePatchOps(currentResumeData, generated.patchOps) : currentResumeData;
  const latexSource = renderResumeLatex({ resumeData: nextResumeData, templateId: project.templateId });
  const metadata = {
    intent: generated.intent,
    changeSummary: generated.changeSummary,
    suggestions: generated.suggestions,
    questions: generated.questions,
    quickReplies: generated.quickReplies,
    safetyNotes: generated.safetyNotes,
  };

  project.ai = {
    ...(project.ai || {}),
    provider: generated.provider,
    providerError: generated.providerError,
    promptVersion: generated.promptVersion,
    resumeData: nextResumeData,
    renderedHtml: undefined,
    latexSource,
    feedback: generated.suggestions || [],
    nextAction: generated.quickReplies?.[0] || generated.questions?.[0] || "",
    messages: [
      ...(project.ai?.messages || []),
      { role: "user", content: message },
      { role: "assistant", content: generated.assistantMessage, metadata },
    ],
  };

  await project.save();
  return toProjectResponse(project);
}

export async function compileProjectPdf({ userId, projectId, requestId }) {
  const project = await getProjectForUser({ userId, projectId });
  const latexSource = project.ai?.latexSource;

  if (!latexSource) {
    const error = new Error("Resume is not ready for preview.");
    error.statusCode = 400;
    error.code = "RESUME_PREVIEW_NOT_READY";
    throw error;
  }

  const compiled = await compileLatexToPdf({
    latexSource,
    projectId: project.id,
    requestId,
  });

  return {
    ...compiled,
    filename: `${project.title.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "resume"}.pdf`,
  };
}

export async function getProjectLatexSource({ userId, projectId }) {
  const project = await getProjectForUser({ userId, projectId });

  if (!project.ai?.latexSource) {
    const error = new Error("Resume source is not ready yet.");
    error.statusCode = 400;
    error.code = "RESUME_PREVIEW_NOT_READY";
    throw error;
  }

  return {
    latexSource: project.ai.latexSource,
    filename: `${project.title.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "resume"}.tex`,
  };
}

export async function updateProject({ userId, projectId, body }) {
  const project = await Project.findOne({ _id: projectId, userId, deletedAt: null });

  if (!project) {
    throw notFound();
  }

  if (body.title) {
    project.title = body.title.trim();
  }

  if (body.target) {
    project.target = body.target;
  }

  if (body.templateId) {
    project.templateId = body.templateId;
  }

  await project.save();
  return toProjectResponse(project);
}

export async function deleteProject({ userId, projectId }) {
  const project = await Project.findOne({ _id: projectId, userId, deletedAt: null });

  if (!project) {
    throw notFound();
  }

  project.deletedAt = new Date();
  await project.save();
  return { id: project.id };
}
