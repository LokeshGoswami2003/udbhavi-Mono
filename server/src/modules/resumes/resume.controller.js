import {
  createManualResume,
  createUploadedResume,
  deleteResume,
  getResumeForUser,
  listResumes,
  setPrimaryResume,
  updateResume,
} from "./resume.service.js";
import { readResumeFile } from "./resume-storage.service.js";

export async function getResumes(req, res, next) {
  try {
    res.json({ ok: true, data: { resumes: await listResumes(req.user._id) } });
  } catch (error) {
    next(error);
  }
}

export async function uploadResume(req, res, next) {
  try {
    const resume = await createUploadedResume({
      userId: req.user._id,
      file: req.file,
      requestId: req.id,
    });

    res.status(201).json({ ok: true, data: { resume } });
  } catch (error) {
    next(error);
  }
}

export async function createManual(req, res, next) {
  try {
    const resume = await createManualResume({ userId: req.user._id, body: req.body });
    res.status(201).json({ ok: true, data: { resume } });
  } catch (error) {
    next(error);
  }
}

export async function getResume(req, res, next) {
  try {
    const resume = await getResumeForUser({ userId: req.user._id, resumeId: req.params.resumeId });
    res.json({ ok: true, data: { resume } });
  } catch (error) {
    next(error);
  }
}

export async function patchResume(req, res, next) {
  try {
    const resume = await updateResume({ userId: req.user._id, resumeId: req.params.resumeId, body: req.body });
    res.json({ ok: true, data: { resume } });
  } catch (error) {
    next(error);
  }
}

export async function makePrimary(req, res, next) {
  try {
    const resume = await setPrimaryResume({ userId: req.user._id, resumeId: req.params.resumeId });
    res.json({ ok: true, data: { resume } });
  } catch (error) {
    next(error);
  }
}

export async function getResumeSourceFile(req, res, next) {
  try {
    const resume = await getResumeForUser({ userId: req.user._id, resumeId: req.params.resumeId });

    if (!resume.file?.fileId) {
      const error = new Error("This resume has no original source file (manual entry).");
      error.statusCode = 404;
      error.code = "RESUME_SOURCE_FILE_NOT_FOUND";
      throw error;
    }

    const bytes = await readResumeFile(resume.file.fileId);

    if (!bytes?.length) {
      const error = new Error("Original resume file could not be read.");
      error.statusCode = 404;
      error.code = "RESUME_SOURCE_FILE_NOT_FOUND";
      throw error;
    }

    const filename = resume.file.originalName || `${resume.label || "resume"}`;
    res.setHeader("content-type", resume.file.mimeType || "application/octet-stream");
    res.setHeader("content-disposition", `inline; filename="${filename.replace(/"/g, "")}"`);
    res.setHeader("cache-control", "no-store");
    res.setHeader(
      "access-control-expose-headers",
      "content-disposition,x-request-id",
    );
    res.send(bytes);
  } catch (error) {
    next(error);
  }
}

export async function removeResume(req, res, next) {
  try {
    res.json({ ok: true, data: { resume: await deleteResume({ userId: req.user._id, resumeId: req.params.resumeId }) } });
  } catch (error) {
    next(error);
  }
}
