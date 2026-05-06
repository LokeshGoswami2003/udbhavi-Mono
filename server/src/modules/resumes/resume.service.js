import { logger } from "../../utils/logger.js";
import mongoose from "mongoose";
import { sha256 } from "../../utils/hash.js";
import { clearResumeContext, completeOnboarding, setPrimaryResumeContext } from "../user-data/user-data.service.js";
import { normalizeResumeData } from "./resume-data.js";
import { extractResume } from "./resume-extract.service.js";
import { deleteResumeFile, readResumeFile, saveResumeFile } from "./resume-storage.service.js";
import { Resume } from "./resume.model.js";

function notFound() {
  const error = new Error("Resume not found.");
  error.statusCode = 404;
  error.code = "RESUME_NOT_FOUND";
  return error;
}

function invalidResumeId() {
  const error = new Error("Resume id is invalid.");
  error.statusCode = 400;
  error.code = "RESUME_ID_INVALID";
  return error;
}

function toExtractionResponse(extraction, { includeRawText = true } = {}) {
  if (!extraction) {
    return extraction;
  }

  const value = extraction.toObject ? extraction.toObject() : extraction;

  return {
    ...value,
    rawText: includeRawText ? value.rawText : undefined,
    sourceLinks: includeRawText ? value.sourceLinks : undefined,
    linkCount: value.links?.length || 0,
    sourceLinkCount: value.sourceLinks?.length || 0,
  };
}

function toResumeResponse(resume, options = {}) {
  return {
    id: resume.id,
    label: resume.label,
    sourceType: resume.sourceType,
    isPrimary: resume.isPrimary,
    file: resume.file
      ? {
          originalName: resume.file.originalName,
          mimeType: resume.file.mimeType,
          size: resume.file.size,
        }
      : undefined,
    extraction: toExtractionResponse(resume.extraction, options),
    resumeData: resume.resumeData,
    updatedAt: resume.updatedAt,
  };
}

export async function listResumes(userId) {
  const resumes = await Resume.find({ userId, deletedAt: null }).sort({ isPrimary: -1, updatedAt: -1 });
  return resumes.map((resume) => toResumeResponse(resume, { includeRawText: false }));
}

export async function getResumeForUser({ userId, resumeId }) {
  if (!mongoose.isValidObjectId(resumeId)) {
    throw invalidResumeId();
  }

  const resume = await Resume.findOne({ _id: resumeId, userId, deletedAt: null });

  if (!resume) {
    throw notFound();
  }

  return resume;
}

export async function getResumeDetails({ userId, resumeId }) {
  const resume = await getResumeForUser({ userId, resumeId });
  return toResumeResponse(resume, { includeRawText: true });
}

export async function getLatestResumeForUser(userId) {
  const resume = await Resume.findOne({ userId, deletedAt: null }).sort({ updatedAt: -1 });

  if (!resume) {
    throw notFound();
  }

  return resume;
}

export async function getResumeSourceFile({ userId, resumeId }) {
  const resume = await getResumeForUser({ userId, resumeId });

  if (!resume.file?.fileId) {
    const error = new Error("This resume does not have an uploaded source file.");
    error.statusCode = 404;
    error.code = "RESUME_SOURCE_FILE_NOT_FOUND";
    throw error;
  }

  const file = await readResumeFile(resume.file.fileId);

  return {
    file,
    filename: resume.file.originalName || `${resume.label || "resume"}.pdf`,
    mimeType: resume.file.mimeType || "application/octet-stream",
  };
}

export async function createUploadedResume({ userId, file, requestId }) {
  if (!file) {
    const error = new Error("Choose a resume file to upload.");
    error.statusCode = 400;
    error.code = "RESUME_FILE_REQUIRED";
    throw error;
  }

  logger.info("resume.upload.accepted", {
    requestId,
    module: "resumes",
    userId: userId.toString(),
    mimeType: file.mimetype,
    fileSize: file.size,
  });

  const extracted = await extractResume(file, { requestId });
  const fileId = await saveResumeFile(file);
  const hasPrimary = await Resume.exists({ userId, isPrimary: true, deletedAt: null });

  const resume = await Resume.create({
    userId,
    sourceType: "upload",
    label: file.originalname.replace(/\.[^.]+$/, "") || "Uploaded resume",
    isPrimary: !hasPrimary,
    file: {
      storage: "gridfs",
      fileId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      sha256: sha256(file.buffer),
    },
    extraction: {
      status: "ready",
      parser: extracted.parser,
      rawText: extracted.rawText,
      links: extracted.links,
      sourceLinks: extracted.sourceLinks,
      extractionQuality: extracted.extractionQuality,
      parsedAt: new Date(),
    },
    resumeData: extracted.resumeData,
  });

  if (resume.isPrimary) {
    await setPrimaryResumeContext({ userId, resume });
  }

  logger.info("resume.extraction.completed", {
    requestId,
    module: "resumes",
    userId: userId.toString(),
    resumeId: resume.id,
    linkCount: extracted.links.length,
    sourceLinkCount: extracted.sourceLinks.length,
    embeddedLinkCount: extracted.extractionQuality.embeddedLinkCount,
    visibleLinkCount: extracted.extractionQuality.visibleLinkCount,
  });

  return toResumeResponse(resume);
}

export async function createManualResume({ userId, body }) {
  const hasPrimary = await Resume.exists({ userId, isPrimary: true, deletedAt: null });
  const resume = await Resume.create({
    userId,
    sourceType: "manual",
    label: body.label?.trim() || "Manual resume",
    isPrimary: !hasPrimary,
    extraction: {
      status: "ready",
      parser: "manual",
      rawText: "",
      links: [],
      sourceLinks: [],
      extractionQuality: {
        rawTextChars: 0,
        visibleLinkCount: 0,
        embeddedLinkCount: 0,
        totalLinkCount: 0,
        parserWarnings: [],
      },
      parsedAt: new Date(),
    },
    resumeData: normalizeResumeData(body.resumeData),
  });

  if (resume.isPrimary) {
    await setPrimaryResumeContext({ userId, resume });
  }

  return toResumeResponse(resume);
}

export async function updateResume({ userId, resumeId, body }) {
  const resume = await getResumeForUser({ userId, resumeId });

  if (body.label) {
    resume.label = body.label.trim();
  }

  if (body.resumeData) {
    resume.resumeData = normalizeResumeData(body.resumeData);
  }

  await resume.save();
  await completeOnboarding({ userId, resume });

  return toResumeResponse(resume);
}

export async function setPrimaryResume({ userId, resumeId }) {
  const resume = await getResumeForUser({ userId, resumeId });

  await Resume.updateMany({ userId }, { $set: { isPrimary: false } });
  resume.isPrimary = true;
  await resume.save();
  await setPrimaryResumeContext({ userId, resume });

  return toResumeResponse(resume);
}

export async function deleteResume({ userId, resumeId }) {
  const resume = await getResumeForUser({ userId, resumeId });

  resume.deletedAt = new Date();
  resume.isPrimary = false;
  await resume.save();
  await deleteResumeFile(resume.file?.fileId).catch(() => undefined);

  const nextPrimary = await Resume.findOne({ userId, deletedAt: null }).sort({ updatedAt: -1 });

  if (nextPrimary) {
    await setPrimaryResume({ userId, resumeId: nextPrimary.id });
  } else {
    await clearResumeContext(userId);
  }

  return { id: resume.id };
}
