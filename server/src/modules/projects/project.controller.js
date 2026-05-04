import {
  addProjectMessage,
  createProject,
  deleteProject,
  getProjectForUser,
  listProjects,
  selectTemplateAndGenerate,
  updateProject,
} from "./project.service.js";

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
    });
    res.json({ ok: true, data: { project } });
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

export async function removeProject(req, res, next) {
  try {
    const project = await deleteProject({ userId: req.user._id, projectId: req.params.projectId });
    res.json({ ok: true, data: { project } });
  } catch (error) {
    next(error);
  }
}
