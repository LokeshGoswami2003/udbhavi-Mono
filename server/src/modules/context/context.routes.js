import { Router } from "express";
import { getContext } from "./context.controller.js";

const router = Router();

router.get("/me/context", getContext);

export default router;
