import { logger } from "../../utils/logger.js";
import { sha256 } from "../../utils/hash.js";
import { extractVisibleLinksFromText } from "../../utils/links.js";
import { generateInitialResumeData, continueResumeChat } from "../ai/resume-generation.service.js";
import { compileLatexToPdf } from "../render/latex-compile.service.js";
import { readRenderedPdf, saveRenderedPdf } from "../render/render-storage.service.js";
import { renderResumeLatex } from "../render/resume-render.service.js";
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

function toProjectResponse(project) {
  const ai = project.ai?.toObject ? project.ai.toObject() : project.ai;
  const status = project.status === "failed" && ai?.latexSource ? "ready" : project.status;

  return {
    id: project.id,
    title: project.title,
    status,
    resumeId: project.resumeId,
    target: project.target,
    templateId: project.templateId,
    ai,
    activeVersionId: project.activeVersionId,
    updatedAt: project.updatedAt,
  };
}

function toPlainAi(ai) {
  return ai?.toObject ? ai.toObject() : ai || {};
}

function clearPdfCache(ai) {
  const nextAi = { ...toPlainAi(ai) };
  delete nextAi.pdf;
  return nextAi;
}

function withSafePdf(ai, pdf) {
  const nextAi = { ...toPlainAi(ai) };

  if (pdf?.fileId && pdf?.latexHash) {
    nextAi.pdf = pdf;
  } else {
    delete nextAi.pdf;
  }

  return nextAi;
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

async function compileAndStoreProjectPdf({ project, requestId, force = false }) {
  const latexSource = project.ai?.latexSource;

  if (!latexSource) {
    const error = new Error("Resume is not ready for preview.");
    error.statusCode = 400;
    error.code = "RESUME_PREVIEW_NOT_READY";
    throw error;
  }

  const latexHash = getLatexHash(latexSource);
  const cachedPdf = toPlainAi(project.ai).pdf;
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

        if (project.status !== "ready") {
          project.status = "ready";
          await project.save();
        }

        return {
          pdf,
          filename,
          compiler: cachedPdf.compiler || "cached",
          pageCount: cachedPdf.pageCount,
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

  const pdf = {
      fileId,
      latexHash,
      compiledAt: new Date(),
      compiler: compiled.compiler,
      pageCount,
    };
  project.ai = withSafePdf(project.ai, pdf);
  project.status = "ready";
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

async function createVersionAndCompileProject({ project, source, label, changeSummary, requestId }) {
  const version = await createResumeVersion({
    project,
    source,
    label,
    changeSummary,
    requestId,
  });
  project.activeVersionId = version._id;
  await project.save();

  try {
    await compileAndStoreProjectPdf({ project, requestId, force: true });
  } catch (error) {
    const latestAi = clearPdfCache(project.ai);
    project.status = "failed";
    project.ai = {
      ...latestAi,
      providerError: {
        code: error.code || "PDF_COMPILE_FAILED",
        message: "The resume draft was created, but the PDF compiler could not build the preview.",
      },
      messages: [
        ...(latestAi.messages || []),
        {
          role: "assistant",
          content: "I created the resume draft, but the PDF compiler could not build the preview. Please retry after the compiler is available.",
          metadata: {
            didModifyResume: false,
            changeSummary: [],
            quickReplies: ["Retry preview", "Review resume data", "Try another template"],
            errorCode: error.code || "PDF_COMPILE_FAILED",
          },
        },
      ],
    };
    await project.save();

    logger.warn("project.pdf.compile_failed_after_draft", {
      requestId,
      module: "projects",
      projectId: project.id,
      code: error.code || "PDF_COMPILE_FAILED",
    });
  }

  return version;
}

function buildSourceResumeFallbackDraft({ resume, templateId, providerError }) {
  const resumeData = reconcileResumeLinks({
    resumeData: normalizeResumeData(resume.resumeData || {}),
    sourceLinks: resume.extraction?.sourceLinks || [],
  });
  const latexSource = renderResumeLatex({ resumeData, templateId });

  return {
    provider: "source_resume",
    providerError,
    promptVersion: "source-resume-fallback-v1",
    resumeData,
    latexSource,
    feedback: [
      "Generated from the uploaded resume because the AI provider could not return a usable structured draft.",
      "Your original sections and verified source links were preserved where available.",
      "You can retry AI polish from chat after the provider is stable.",
    ],
    nextAction: "Review the generated PDF, then ask for one focused improvement or paste a job description.",
    assistantMessage:
      "I could not use the AI provider for the first polish pass, so I generated a clean draft directly from your uploaded resume data and preserved the links I could verify. The PDF is ready to review, and we can retry AI improvements from chat when the provider is stable.",
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
    project.ai = withSafePdf({
      provider: generated.provider,
      providerError: generated.providerError,
      promptVersion: generated.promptVersion,
      resumeData,
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
    await createVersionAndCompileProject({
      project,
      source: "initial_generation",
      label: "Initial draft",
      changeSummary: generated.feedback,
      requestId,
    });
    return toProjectResponse(project);
  } catch (error) {
    const providerError = error.providerError || {
      code: error.code || "LLM_GENERATION_FAILED",
      message: error.message,
    };
    const fallback = buildSourceResumeFallbackDraft({ resume, templateId: template.id, providerError });

    project.status = "ready";
    project.ai = withSafePdf({
      ...clearPdfCache(project.ai),
      provider: fallback.provider,
      providerError,
      promptVersion: fallback.promptVersion,
      resumeData: fallback.resumeData,
      latexSource: fallback.latexSource,
      feedback: fallback.feedback,
      nextAction: fallback.nextAction,
      messages: [
        ...(toPlainAi(project.ai).messages || []),
        {
          role: "assistant",
          content: fallback.assistantMessage,
          metadata: {
            didModifyResume: true,
            changeSummary: fallback.feedback,
            quickReplies: ["Review PDF", "Improve wording", "Fix links"],
            providerFallback: true,
            errorCode: providerError.code,
          },
        },
      ],
    });
    await project.save();
    await createVersionAndCompileProject({
      project,
      source: "initial_generation",
      label: "Source resume draft",
      changeSummary: fallback.feedback,
      requestId,
    });

    logger.warn("project.template_generation.ai_fallback", {
      requestId,
      module: "projects",
      projectId: project.id,
      resumeId: String(project.resumeId),
      code: providerError.code,
    });

    return toProjectResponse(project);
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
  const currentResumeData = normalizeResumeData(aiState.resumeData || resume.resumeData || {});
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
  } catch (error) {
    const providerError = error.providerError || {
      code: error.code || "LLM_CHAT_FAILED",
      message: error.message,
    };

    if (!aiState.latexSource && project.templateId) {
      const fallback = buildSourceResumeFallbackDraft({ resume, templateId: project.templateId, providerError });
      project.status = "ready";
      project.ai = withSafePdf({
        ...clearPdfCache(aiState),
        provider: fallback.provider,
        providerError,
        promptVersion: fallback.promptVersion,
        resumeData: fallback.resumeData,
        latexSource: fallback.latexSource,
        feedback: fallback.feedback,
        nextAction: fallback.nextAction,
        messages: [
          ...storedMessages,
          { role: "user", content: message },
          {
            role: "assistant",
            content: fallback.assistantMessage,
            metadata: {
              didModifyResume: true,
              changeSummary: fallback.feedback,
              quickReplies: ["Review PDF", "Improve wording", "Fix links"],
              providerFallback: true,
              errorCode: providerError.code,
            },
          },
        ],
      });
      await project.save();
      await createVersionAndCompileProject({
        project,
        source: "chat_edit",
        label: "Recovered source resume draft",
        changeSummary: fallback.feedback,
        requestId,
      });

      logger.warn("project.chat.ai_fallback", {
        requestId,
        module: "projects",
        projectId: project.id,
        resumeId: String(project.resumeId),
        code: providerError.code,
      });

      return toProjectResponse(project);
    }

    project.status = aiState.latexSource ? "ready" : "failed";
    project.ai = withSafePdf({
      ...aiState,
      provider: "bedrock",
      providerError,
      messages: [
        ...storedMessages,
        { role: "user", content: message },
        {
          role: "assistant",
          content: "I could not update the draft because the AI provider is unavailable right now. Your current resume is unchanged, and you can retry once the provider is ready.",
          metadata: {
            didModifyResume: false,
            changeSummary: [],
            suggestions: [],
            questions: [],
            quickReplies: ["Retry this change", "Check project links", "Improve wording"],
            safetyNotes: ["Resume data was left unchanged after provider failure."],
            errorCode: providerError.code,
          },
        },
      ],
    }, aiState.pdf);
    await project.save();

    logger.warn("project.chat.provider.failed", {
      requestId,
      module: "projects",
      projectId: project.id,
      resumeId: String(project.resumeId),
      code: providerError.code,
    });

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
  const latexHash = getLatexHash(latexSource);
  const shouldCompilePdf = didResumeChange || !aiState.pdf?.fileId || aiState.pdf?.latexHash !== latexHash;
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

  const nextAiBase = didResumeChange ? clearPdfCache(project.ai) : withSafePdf(project.ai, aiState.pdf);
  project.status = shouldCompilePdf ? "processing" : "ready";
  project.ai = withSafePdf({
    ...nextAiBase,
    provider: generated.provider,
    providerError: generated.providerError,
    promptVersion: generated.promptVersion,
    resumeData: nextResumeData,
    latexSource,
    feedback: generated.suggestions || [],
    nextAction: getChatNextAction({ project, generated }),
    messages: [
      ...(aiState.messages || []),
      { role: "user", content: message },
      { role: "assistant", content: generated.assistantMessage, metadata },
    ],
  }, didResumeChange ? undefined : aiState.pdf);

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
  }

  if (shouldCompilePdf) {
    try {
      await compileAndStoreProjectPdf({ project, requestId, force: true });
    } catch (error) {
      const latestAi = clearPdfCache(project.ai);
      project.status = latestAi.latexSource ? "ready" : "failed";
      project.ai = {
        ...latestAi,
        providerError: {
          code: error.code || "PDF_COMPILE_FAILED",
          message: "The resume update was saved, but the PDF preview could not be rebuilt yet.",
        },
        messages: [
          ...(latestAi.messages || []),
          {
            role: "assistant",
            content: "I saved the resume change, but the PDF preview could not be rebuilt yet. Please retry the preview or download in a moment.",
            metadata: {
              didModifyResume: false,
              changeSummary: [],
              quickReplies: ["Reload preview", "Fix links", "Improve wording"],
              errorCode: error.code || "PDF_COMPILE_FAILED",
            },
          },
        ],
      };
      await project.save();

      logger.warn("project.chat.pdf_compile.failed", {
        requestId,
        module: "projects",
        projectId: project.id,
        code: error.code || "PDF_COMPILE_FAILED",
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

  project.status = "ready";
  project.ai = {
    ...clearPdfCache(project.ai),
    resumeData: version.resumeData,
    latexSource: version.latexSource,
    messages: [
      ...(toPlainAi(project.ai).messages || []),
      {
        role: "assistant",
        content: `Restored version ${version.versionNumber}.`,
        metadata: {
          changeSummary: [`Restored ${version.label || `version ${version.versionNumber}`}`],
          quickReplies: ["Review the PDF", "Make this more concise", "Target a job description"],
        },
      },
    ],
  };
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
  await compileAndStoreProjectPdf({ project, requestId, force: true });

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
