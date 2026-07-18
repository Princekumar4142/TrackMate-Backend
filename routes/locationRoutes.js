import { Router } from "express";
import { updateLocation } from "../controllers/locationController.js";
import { locationLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.post("/:code/update", locationLimiter, updateLocation);

export default router;
