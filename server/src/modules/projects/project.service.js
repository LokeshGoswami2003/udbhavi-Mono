import { logger } from "../../utils/logger.js";
import { generateInitialResume, continueResumeChat } from "../ai/resume-generation.service.js";
import { renderResumeHtml, renderResumeLatex } from "../render/resume-render.service.js";
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
    const generated = await generateInitialResume({ project: { ...project.toObject(), templateId: template.id }, resume, template });
    const renderedHtml = renderResumeHtml({ resumeData: generated.resumeData, templateId: template.id });
    const latexSource = renderResumeLatex({ resumeData: generated.resumeData, templateId: template.id });

    project.status = "ready";
    project.ai = {
      provider: generated.provider,
      providerError: generated.providerError,
      promptVersion: generated.promptVersion,
      resumeData: generated.resumeData,
      renderedHtml,
      latexSource,
      feedback: generated.feedback,
    nextAction: generated.nextAction,
    messages: [
      {
        role: "assistant",
        content: generated.assistantMessage || generated.nextAction,
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
  const template = getTemplate(project.templateId);
  const generated = await continueResumeChat({ project, message, template });
  const renderedHtml = renderResumeHtml({ resumeData: generated.resumeData, templateId: project.templateId });
  const latexSource = renderResumeLatex({ resumeData: generated.resumeData, templateId: project.templateId });

  project.ai = {
    ...(project.ai || {}),
    provider: generated.provider,
    providerError: generated.providerError,
    promptVersion: generated.promptVersion,
    resumeData: generated.resumeData || project.ai?.resumeData,
    renderedHtml,
    latexSource,
    feedback: generated.feedback,
    nextAction: generated.nextAction,
    messages: [
      ...(project.ai?.messages || []),
      { role: "user", content: message },
      { role: "assistant", content: generated.assistantMessage },
    ],
  };

  await project.save();
  return toProjectResponse(project);
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
