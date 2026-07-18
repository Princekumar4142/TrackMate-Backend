import { Router } from "express";
import {
  addFacility,
  verifyFacility,
  getNearbyFacilities,
  getFacilityTypes,
} from "../controllers/facilityController.js";
import { locationLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.get("/types", getFacilityTypes);
router.get("/nearby", getNearbyFacilities);
router.post("/add", locationLimiter, addFacility);
router.post("/:id/verify", locationLimiter, verifyFacility);

export default router;
