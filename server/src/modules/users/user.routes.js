import { Router } from "express";
import { syncUser } from "../../middleware/sync-user.js";
import { getMe } from "./user.controller.js";

const router = Router();

router.get("/me", syncUser, getMe);

export default router;
