import { Router } from "express";
import {
  getProject,
  getProjectPdf,
  getProjectPreviewPdf,
  getProjectSourceTex,
  getProjects,
  patchProject,
  postProject,
  postProjectMessage,
  postProjectTemplate,
  removeProject,
} from "./project.controller.js";

const router = Router();

router.get("/projects", getProjects);
router.post("/projects", postProject);
router.get("/projects/:projectId", getProject);
router.get("/projects/:projectId/preview.pdf", getProjectPreviewPdf);
router.get("/projects/:projectId/download.pdf", getProjectPdf);
router.get("/projects/:projectId/pdf", getProjectPdf);
router.get("/projects/:projectId/source.tex", getProjectSourceTex);
router.patch("/projects/:projectId", patchProject);
router.post("/projects/:projectId/template", postProjectTemplate);
router.post("/projects/:projectId/messages", postProjectMessage);
router.delete("/projects/:projectId", removeProject);

export default router;
