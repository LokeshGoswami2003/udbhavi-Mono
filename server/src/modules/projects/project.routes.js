import { Router } from "express";
import {
  getProject,
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
router.patch("/projects/:projectId", patchProject);
router.post("/projects/:projectId/template", postProjectTemplate);
router.post("/projects/:projectId/messages", postProjectMessage);
router.delete("/projects/:projectId", removeProject);

export default router;
