import { Router } from "express";
import multer from "multer";
import {
  createManual,
  getResume,
  getResumeSourceFile,
  getResumes,
  makePrimary,
  patchResume,
  removeResume,
  uploadResume,
} from "./resume.controller.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get("/resumes", getResumes);
router.post("/resumes/upload", upload.single("file"), uploadResume);
router.post("/resumes/manual", createManual);
router.get("/resumes/:resumeId", getResume);
router.get("/resumes/:resumeId/source-file", getResumeSourceFile);
router.patch("/resumes/:resumeId", patchResume);
router.post("/resumes/:resumeId/primary", makePrimary);
router.delete("/resumes/:resumeId", removeResume);

export default router;
