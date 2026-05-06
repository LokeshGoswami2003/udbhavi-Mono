import {
  addProjectMessage,
  compileProjectPdf,
  createProject,
  deleteProject,
  getProjectForUser,
  getProjectLatexSource,
  getProjectVersionForUser,
  getProjectVersions,
  listProjects,
  restoreProjectVersion,
  selectTemplateAndGenerate,
  updateProject,
} from "./project.service.js";

function setPdfHeaders(res, compiled, disposition) {
  res.setHeader("content-type", "application/pdf");
  res.setHeader("content-disposition", `${disposition}; filename="${compiled.filename}"`);
  res.setHeader("cache-control", "no-store");
  res.setHeader("x-latex-compiler", compiled.compiler || "unknown");
  res.setHeader("x-pdf-latex-hash", compiled.latexHash || "");
  res.setHeader("x-pdf-page-count", String(compiled.pageCount || 1));
  res.setHeader("x-pdf-cached", String(Boolean(compiled.cached)));
}

export async function getProjects(req, res, next) {
  try {
    res.json({ ok: true, data: { projects: await listProjects(req.user._id) } });
  } catch (error) {
    next(error);
  }
}

export async function postProject(req, res, next) {
  try {
    const project = await createProject({ userId: req.user._id, body: req.body, requestId: req.id });
    res.status(201).json({ ok: true, data: { project } });
  } catch (error) {
    next(error);
  }
}

export async function getProject(req, res, next) {
  try {
    const project = await getProjectForUser({ userId: req.user._id, projectId: req.params.projectId });
    res.json({ ok: true, data: { project } });
  } catch (error) {
    next(error);
  }
}

export async function postProjectTemplate(req, res, next) {
  try {
    const project = await selectTemplateAndGenerate({
      userId: req.user._id,
      projectId: req.params.projectId,
      templateId: req.body.templateId,
      requestId: req.id,
    });
    res.json({ ok: true, data: { project } });
  } catch (error) {
    next(error);
  }
}

export async function postProjectMessage(req, res, next) {
  try {
    const project = await addProjectMessage({
      userId: req.user._id,
      projectId: req.params.projectId,
      message: req.body.message,
      requestId: req.id,
    });
    res.json({ ok: true, data: { project } });
  } catch (error) {
    next(error);
  }
}

export async function getProjectPdf(req, res, next) {
  try {
    const compiled = await compileProjectPdf({
      userId: req.user._id,
      projectId: req.params.projectId,
      requestId: req.id,
    });

    setPdfHeaders(res, compiled, "attachment");
    res.send(compiled.pdf);
  } catch (error) {
    next(error);
  }
}

export async function getProjectPreviewPdf(req, res, next) {
  try {
    const compiled = await compileProjectPdf({
      userId: req.user._id,
      projectId: req.params.projectId,
      requestId: req.id,
    });

    setPdfHeaders(res, compiled, "inline");
    res.send(compiled.pdf);
  } catch (error) {
    next(error);
  }
}

export async function getProjectSourceTex(req, res, next) {
  try {
    const source = await getProjectLatexSource({
      userId: req.user._id,
      projectId: req.params.projectId,
    });

    res.setHeader("content-type", "application/x-tex; charset=utf-8");
    res.setHeader("content-disposition", `attachment; filename="${source.filename}"`);
    res.send(source.latexSource);
  } catch (error) {
    next(error);
  }
}

export async function patchProject(req, res, next) {
  try {
    const project = await updateProject({ userId: req.user._id, projectId: req.params.projectId, body: req.body });
    res.json({ ok: true, data: { project } });
  } catch (error) {
    next(error);
  }
}

export async function getProjectVersionList(req, res, next) {
  try {
    const versions = await getProjectVersions({
      userId: req.user._id,
      projectId: req.params.projectId,
    });
    res.json({ ok: true, data: { versions } });
  } catch (error) {
    next(error);
  }
}

export async function getProjectVersionDetail(req, res, next) {
  try {
    const version = await getProjectVersionForUser({
      userId: req.user._id,
      projectId: req.params.projectId,
      versionId: req.params.versionId,
    });
    res.json({ ok: true, data: { version } });
  } catch (error) {
    next(error);
  }
}

export async function postProjectVersionRestore(req, res, next) {
  try {
    const project = await restoreProjectVersion({
      userId: req.user._id,
      projectId: req.params.projectId,
      versionId: req.params.versionId,
      requestId: req.id,
    });
    res.json({ ok: true, data: { project } });
  } catch (error) {
    next(error);
  }
}

export async function removeProject(req, res, next) {
  try {
    const project = await deleteProject({ userId: req.user._id, projectId: req.params.projectId });
    res.json({ ok: true, data: { project } });
  } catch (error) {
    next(error);
  }
}
