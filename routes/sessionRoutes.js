import { Router } from "express";
import {
  createSession,
  joinSession,
  getSession,
  pauseSession,
  resumeSession,
  endSession,
  getHistory,
} from "../controllers/sessionController.js";
import { joinLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.post("/create", createSession);
router.post("/:code/join", joinLimiter, joinSession);
router.get("/:code", getSession);
router.patch("/:code/pause", pauseSession);
router.patch("/:code/resume", resumeSession);
router.delete("/:code", endSession);
router.get("/history/all", getHistory);

export default router;
