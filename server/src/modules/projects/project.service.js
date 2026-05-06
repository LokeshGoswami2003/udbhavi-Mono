import { logger } from "../../utils/logger.js";
import { sha256 } from "../../utils/hash.js";
import { extractVisibleLinksFromText } from "../../utils/links.js";
import { generateInitialResumeData, continueResumeChat } from "../ai/resume-generation.service.js";
import { compileLatexToPdf } from "../render/latex-compile.service.js";
import { readRenderedPdf, saveRenderedPdf } from "../render/render-storage.service.js";
import {
  renderResumeLatex,
  renderResumeLatexAtCompactionLevel,
  RENDER_COMPACTION_LEVELS,
} from "../render/resume-render.service.js";
import { normalizeResumeData } from "../resumes/resume-data.js";
import { reconcileResumeLinks } from "../resumes/resume-link-reconcile.service.js";
import { applyResumePatchOps } from "../resumes/resume-patch.service.js";
import { getLatestResumeForUser, getResumeForUser } from "../resumes/resume.service.js";
import { readResumeFile } from "../resumes/resume-storage.service.js";
import { getTemplate } from "../templates/template.service.js";
import {
  createResumeVersion,
  getProjectVersion,
  listProjectVersions,
  toResumeVersionResponse,
} from "../versions/version.service.js";
import { Project } from "./project.model.js";

function toPlainAi(ai) {
  if (!ai) {
    return {};
  }
  return ai.toObject ? ai.toObject() : ai;
}

function withSafePdf(ai, pdf) {
  const next = { ...toPlainAi(ai) };
  if (pdf?.fileId && pdf?.latexHash) {
    next.pdf = pdf;
  } else {
    delete next.pdf;
  }
  return next;
}

function clearPdfCache(ai) {
  const next = { ...toPlainAi(ai) };
  delete next.pdf;
  return next;
}

function toProjectResponse(project) {
  const ai = toPlainAi(project.ai);

  return {
    id: project.id,
    title: project.title,
    status: project.status,
    resumeId: project.resumeId,
    target: project.target,
    templateId: project.templateId,
    ai,
    activeVersionId: project.activeVersionId,
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

async function getLatestResumeContextForProject({ userId, project, requestId, event }) {
  const latestResume = await getLatestResumeForUser(userId);

  if (String(latestResume._id) !== String(project.resumeId)) {
    logger.info("project.resume_context.latest_selected", {
      requestId,
      module: "projects",
      event,
      projectId: project.id,
      previousResumeId: String(project.resumeId),
      latestResumeId: latestResume.id,
    });
    project.resumeId = latestResume._id;
  }

  return withSourceDocument(latestResume);
}

function getProjectPdfFilename(project) {
  return `${project.title.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "resume"}.pdf`;
}

function countPdfPages(pdf) {
  return (pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length || 1;
}

function getLatexHash(latexSource) {
  return sha256(Buffer.from(String(latexSource || ""), "utf8"));
}

function getChatNextAction({ project, generated }) {
  if (generated.questions?.length) {
    return generated.questions[0];
  }

  if (!project.target?.jobDescription) {
    return "Paste a job description to check role fit.";
  }

  return "Review role fit and tune the resume for this job description.";
}

function isLightConversationMessage(message = "") {
  return /^(hi|hello|hey|yo|hiya|hii|thanks|thank you|ok|okay|cool|nice|great)[\s!.]*$/i.test(String(message).trim());
}

function getLightConversationReply(message = "") {
  if (/thank/i.test(message)) {
    return "You’re welcome. I’m here whenever you want to tune this resume for a specific role or fix a specific section.";
  }

  return "Hi! I’m here and ready to help with this resume. You can paste a job description for a role-match review, ask me to improve wording, or point me to a specific section.";
}

async function renderAndCompileProjectPdfForOnePage({ project, resumeData, requestId }) {
  let lastResult = null;
  for (let level = 0; level < RENDER_COMPACTION_LEVELS; level += 1) {
    const latexSource = renderResumeLatexAtCompactionLevel({
      resumeData,
      templateId: project.templateId,
      level,
    });
    project.ai = {
      ...toPlainAi(project.ai),
      latexSource,
    };
    project.ai = clearPdfCache(project.ai);
    await project.save();
    const result = await compileAndStoreProjectPdf({ project, requestId, force: true });
    lastResult = result;
    if ((result.pageCount || 1) <= 1) {
      logger.info("project.pdf.one_page.success", {
        requestId,
        module: "render",
        projectId: project.id,
        compactionLevel: level,
        pageCount: result.pageCount,
      });
      return result;
    }
    logger.info("project.pdf.one_page.retrying", {
      requestId,
      module: "render",
      projectId: project.id,
      compactionLevel: level,
      pageCount: result.pageCount,
    });
  }
  return lastResult;
}

async function compileAndStoreProjectPdf({ project, requestId, force = false }) {
  const latexSource = project.ai?.latexSource;

  if (!latexSource) {
    const error = new Error("Resume is not ready for preview.");
    error.statusCode = 400;
    error.code = "RESUME_PREVIEW_NOT_READY";
    throw error;
  }

  const latexHash = getLatexHash(latexSource);
  const aiState = toPlainAi(project.ai);
  const cachedPdf = aiState.pdf;
  const filename = getProjectPdfFilename(project);

  if (!force && cachedPdf?.fileId && cachedPdf.latexHash === latexHash) {
    try {
      const pdf = await readRenderedPdf(cachedPdf.fileId);

      if (pdf?.length) {
        logger.info("project.pdf.cache.hit", {
          requestId,
          module: "render",
          projectId: project.id,
          fileId: String(cachedPdf.fileId),
          latexHash,
        });

        return {
          pdf,
          filename,
          compiler: cachedPdf.compiler || "cached",
          pageCount: cachedPdf.pageCount || 1,
          cached: true,
          latexHash,
          fileId: cachedPdf.fileId,
        };
      }
    } catch (error) {
      logger.warn("project.pdf.cache.miss", {
        requestId,
        module: "render",
        projectId: project.id,
        fileId: String(cachedPdf.fileId),
        code: error.code || "PDF_CACHE_READ_FAILED",
      });
    }
  }

  const compiled = await compileLatexToPdf({
    latexSource,
    projectId: project.id,
    requestId,
  });
  const pageCount = countPdfPages(compiled.pdf);
  const fileId = await saveRenderedPdf({
    filename,
    pdf: compiled.pdf,
    metadata: {
      userId: String(project.userId),
      projectId: project.id,
      latexHash,
      compiler: compiled.compiler,
      pageCount,
    },
  });

  project.ai = withSafePdf(project.ai, {
    fileId,
    latexHash,
    compiledAt: new Date(),
    compiler: compiled.compiler,
    pageCount,
  });
  await project.save();

  logger.info("project.pdf.cached", {
    requestId,
    module: "render",
    projectId: project.id,
    fileId: String(fileId),
    latexHash,
    compiler: compiled.compiler,
    pageCount,
  });

  return {
    pdf: compiled.pdf,
    filename,
    compiler: compiled.compiler,
    pageCount,
    cached: false,
    latexHash,
    fileId,
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

export async function selectTemplateAndGenerate({ userId, projectId, templateId, requestId }) {
  const project = await getProjectForUser({ userId, projectId });
  const resume = await getLatestResumeContextForProject({ userId, project, requestId, event: "template_generation" });
  const template = getTemplate(templateId);

  project.templateId = template.id;
  project.status = "processing";
  await project.save();

  try {
    const generated = await generateInitialResumeData({ project: { ...project.toObject(), templateId: template.id }, resume, template });
    const resumeData = reconcileResumeLinks({
      resumeData: generated.resumeData,
      sourceLinks: resume.extraction?.sourceLinks || [],
    });
    const latexSource = renderResumeLatex({ resumeData, templateId: template.id });

    project.status = "ready";
    project.ai = clearPdfCache({
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
            quickReplies: ["Paste a job description", "Check role match", "Improve wording"],
          },
        },
      ],
    });

    await project.save();
    const version = await createResumeVersion({
      project,
      source: "initial_generation",
      label: "Initial draft",
      changeSummary: generated.feedback,
      requestId,
    });
    project.activeVersionId = version._id;
    await project.save();
    await renderAndCompileProjectPdfForOnePage({ project, resumeData, requestId });
    return toProjectResponse(project);
  } catch (error) {
    const aiState = toPlainAi(project.ai);
    project.status = "failed";
    project.ai = clearPdfCache({
      ...aiState,
      provider: "bedrock",
      providerError: error.providerError || {
        code: error.code || "LLM_GENERATION_FAILED",
        message: error.message,
      },
      messages: [
        ...(aiState.messages || []),
        {
          role: "assistant",
          content: "I could not generate this draft because the AI provider is unavailable. Please retry after the provider is ready.",
        },
      ],
    });
    await project.save();
    throw error;
  }
}

export async function addProjectMessage({ userId, projectId, message, requestId }) {
  const project = await getProjectForUser({ userId, projectId });
  if (isLightConversationMessage(message)) {
    const aiState = toPlainAi(project.ai);
    const assistantMessage = getLightConversationReply(message);

    project.ai = {
      ...aiState,
      nextAction: project.target?.jobDescription
        ? "Ask for a focused role-match review or wording improvement."
        : "Paste a job description to check role fit.",
      messages: [
        ...(aiState.messages || []),
        { role: "user", content: message },
        {
          role: "assistant",
          content: assistantMessage,
          metadata: {
            intent: "small_talk",
            didModifyResume: false,
            changeSummary: [],
            suggestions: [],
            questions: [],
            quickReplies: project.target?.jobDescription
              ? ["Tune for this JD", "Improve wording", "Check project links"]
              : ["Paste job description", "Improve wording", "Fix links"],
            safetyNotes: [],
            evidenceChecked: {
              checkedCurrentDraft: false,
              checkedOriginalSource: false,
              checkedSourceLinks: false,
              linkUpdates: [],
            },
          },
        },
      ],
    };
    await project.save();
    return toProjectResponse(project);
  }

  const resume = await getLatestResumeContextForProject({ userId, project, requestId, event: "chat_edit" });
  const aiState = toPlainAi(project.ai);
  const currentResumeData = normalizeResumeData(aiState.resumeData || {});
  const storedMessages = aiState.messages || [];

  logger.info("project.chat.context.loaded", {
    requestId,
    module: "projects",
    projectId: project.id,
    resumeId: String(project.resumeId),
    messageCount: storedMessages.length,
    hasSourceDocument: Boolean(resume.sourceDocument),
    hasFallbackRawText: Boolean(resume.extraction?.rawText),
  });

  let generated;
  try {
    generated = await continueResumeChat({
      project: { ...project.toObject(), ai: { ...aiState, resumeData: currentResumeData, messages: storedMessages } },
      resume,
      message,
    });
  } catch (chatError) {
    logger.warn("project.chat.generation.failed", {
      requestId,
      module: "projects",
      projectId: project.id,
      code: chatError.code || "CHAT_GENERATION_FAILED",
    });
    project.ai = {
      ...aiState,
      messages: [
        ...storedMessages,
        { role: "user", content: message },
        {
          role: "assistant",
          content:
            "I could not reach the AI provider just now. Please try again in a moment, or rephrase the request and I will retry.",
          metadata: {
            intent: "error",
            didModifyResume: false,
            changeSummary: [],
            suggestions: [],
            questions: [],
            quickReplies: ["Retry", "Improve wording", "Fix links"],
            safetyNotes: ["AI provider error."],
          },
        },
      ],
    };
    await project.save();
    return toProjectResponse(project);
  }
  let didApplyGeneratedPatch = generated.didModifyResume;
  let patchedResumeData = currentResumeData;

  if (generated.didModifyResume) {
    try {
      patchedResumeData = applyResumePatchOps(currentResumeData, generated.patchOps);
    } catch (error) {
      didApplyGeneratedPatch = false;
      generated.assistantMessage =
        "I understood the edit, but I could not apply it safely to the resume structure yet. Please point me to the exact section or paste the missing detail, and I’ll make the change cleanly.";
      generated.changeSummary = [];
      generated.questions = generated.questions?.length
        ? generated.questions
        : ["Which exact section should this change go into?"];
      generated.quickReplies = ["Improve summary", "Update project", "Add experience"];
      generated.safetyNotes = [...(generated.safetyNotes || []), "Skipped unsafe patch operation."];

      logger.warn("project.chat.patch.skipped", {
        requestId,
        module: "projects",
        projectId: project.id,
        resumeId: String(project.resumeId),
        code: error.code || "RESUME_PATCH_INVALID",
      });
    }
  }
  const userProvidedLinks = extractVisibleLinksFromText(message).map((link) => ({ ...link, source: "manual" }));
  const nextResumeData = reconcileResumeLinks({
    resumeData: patchedResumeData,
    sourceLinks: resume.extraction?.sourceLinks || [],
    userProvidedLinks,
  });
  const didResumeChange = didApplyGeneratedPatch || JSON.stringify(nextResumeData) !== JSON.stringify(currentResumeData);
  const latexSource = renderResumeLatex({ resumeData: nextResumeData, templateId: project.templateId });
  const metadata = {
    intent: generated.intent,
    didModifyResume: didResumeChange,
    changeSummary: generated.changeSummary,
    suggestions: generated.suggestions,
    questions: generated.questions,
    quickReplies: generated.quickReplies,
    safetyNotes: generated.safetyNotes,
    evidenceChecked: generated.evidenceChecked,
  };

  const previousPdf = aiState.pdf;
  const baseAi = {
    ...aiState,
    provider: generated.provider,
    providerError: generated.providerError,
    promptVersion: generated.promptVersion,
    resumeData: nextResumeData,
    renderedHtml: undefined,
    latexSource,
    feedback: generated.suggestions || [],
    nextAction: getChatNextAction({ project, generated }),
    messages: [
      ...storedMessages,
      { role: "user", content: message },
      { role: "assistant", content: generated.assistantMessage, metadata },
    ],
  };

  project.ai = didResumeChange ? clearPdfCache(baseAi) : withSafePdf(baseAi, previousPdf);

  await project.save();
  if (didResumeChange) {
    const version = await createResumeVersion({
      project,
      source: "chat_edit",
      label: `Chat edit ${new Date().toLocaleDateString("en-IN")}`,
      changeSummary: generated.changeSummary,
      requestId,
    });
    project.activeVersionId = version._id;
    await project.save();
    try {
      await renderAndCompileProjectPdfForOnePage({ project, resumeData: nextResumeData, requestId });
    } catch (compileError) {
      logger.warn("project.chat.compile.failed", {
        requestId,
        module: "projects",
        projectId: project.id,
        code: compileError.code || "PDF_COMPILE_FAILED",
      });
    }
  }

  return toProjectResponse(project);
}

export async function compileProjectPdf({ userId, projectId, requestId }) {
  const project = await getProjectForUser({ userId, projectId });
  return compileAndStoreProjectPdf({ project, requestId });
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

export async function getProjectVersions({ userId, projectId }) {
  await getProjectForUser({ userId, projectId });
  return listProjectVersions({ userId, projectId });
}

export async function getProjectVersionForUser({ userId, projectId, versionId }) {
  await getProjectForUser({ userId, projectId });
  return toResumeVersionResponse(await getProjectVersion({ userId, projectId, versionId }));
}

export async function restoreProjectVersion({ userId, projectId, versionId, requestId }) {
  const project = await getProjectForUser({ userId, projectId });
  const version = await getProjectVersion({ userId, projectId, versionId });

  const aiState = toPlainAi(project.ai);
  project.status = "ready";
  project.ai = clearPdfCache({
    ...aiState,
    resumeData: version.resumeData,
    renderedHtml: undefined,
    latexSource: version.latexSource,
    messages: [
      ...(aiState.messages || []),
      {
        role: "assistant",
        content: `Restored version ${version.versionNumber}.`,
        metadata: {
          changeSummary: [`Restored ${version.label || `version ${version.versionNumber}`}`],
          quickReplies: ["Review the PDF", "Make this more concise", "Target a job description"],
        },
      },
    ],
  });
  await project.save();

  const restoredVersion = await createResumeVersion({
    project,
    source: "restore",
    label: `Restored version ${version.versionNumber}`,
    changeSummary: [`Restored ${version.label || `version ${version.versionNumber}`}`],
    requestId,
  });
  project.activeVersionId = restoredVersion._id;
  await project.save();
  await renderAndCompileProjectPdfForOnePage({ project, resumeData: version.resumeData, requestId });

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
