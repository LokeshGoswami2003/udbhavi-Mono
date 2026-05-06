import {
  createManualResume,
  createUploadedResume,
  deleteResume,
  getResumeDetails,
  getResumeSourceFile,
  listResumes,
  setPrimaryResume,
  updateResume,
} from "./resume.service.js";

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
    const resume = await getResumeDetails({ userId: req.user._id, resumeId: req.params.resumeId });
    res.json({ ok: true, data: { resume } });
  } catch (error) {
    next(error);
  }
}

export async function getResumeSource(req, res, next) {
  try {
    const source = await getResumeSourceFile({ userId: req.user._id, resumeId: req.params.resumeId });

    res.setHeader("content-type", source.mimeType);
    res.setHeader("content-disposition", `inline; filename="${source.filename}"`);
    res.setHeader("cache-control", "no-store");
    res.send(source.file);
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

export async function removeResume(req, res, next) {
  try {
    res.json({ ok: true, data: { resume: await deleteResume({ userId: req.user._id, resumeId: req.params.resumeId }) } });
  } catch (error) {
    next(error);
  }
}
