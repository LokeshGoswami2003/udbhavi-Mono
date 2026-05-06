import { logger } from "../../utils/logger.js";
import { ResumeVersion } from "./resume-version.model.js";

function toVersionResponse(version) {
  return {
    id: version.id,
    projectId: version.projectId,
    userId: version.userId,
    versionNumber: version.versionNumber,
    label: version.label,
    resumeData: version.resumeData,
    latexSource: version.latexSource,
    source: version.source,
    changeSummary: version.changeSummary || [],
    createdAt: version.createdAt,
    updatedAt: version.updatedAt,
  };
}

function normalizeChangeSummary(changeSummary) {
  if (!changeSummary) {
    return [];
  }

  return Array.isArray(changeSummary) ? changeSummary.filter(Boolean) : [String(changeSummary)];
}

async function getNextVersionNumber(projectId) {
  const latest = await ResumeVersion.findOne({ projectId }).sort({ versionNumber: -1 }).select("versionNumber");
  return (latest?.versionNumber || 0) + 1;
}

export async function createResumeVersion({ project, source, label, changeSummary = [], requestId }) {
  const resumeData = project.ai?.resumeData;
  const latexSource = project.ai?.latexSource;

  if (!resumeData || !latexSource) {
    const error = new Error("Resume version requires generated resume data and LaTeX source.");
    error.statusCode = 400;
    error.code = "RESUME_VERSION_NOT_READY";
    throw error;
  }

  const version = await ResumeVersion.create({
    projectId: project._id,
    userId: project.userId,
    versionNumber: await getNextVersionNumber(project._id),
    label,
    resumeData,
    latexSource,
    source,
    changeSummary: normalizeChangeSummary(changeSummary),
  });

  logger.info("resume.version.created", {
    requestId,
    module: "versions",
    userId: String(project.userId),
    projectId: project.id,
    versionId: version.id,
    versionNumber: version.versionNumber,
    source,
  });

  return version;
}

export async function listProjectVersions({ userId, projectId }) {
  const versions = await ResumeVersion.find({ userId, projectId }).sort({ versionNumber: -1 });
  return versions.map(toVersionResponse);
}

export async function getProjectVersion({ userId, projectId, versionId }) {
  const version = await ResumeVersion.findOne({ _id: versionId, userId, projectId });

  if (!version) {
    const error = new Error("Resume version not found.");
    error.statusCode = 404;
    error.code = "RESUME_VERSION_NOT_FOUND";
    throw error;
  }

  return version;
}

export function toResumeVersionResponse(version) {
  return toVersionResponse(version);
}
