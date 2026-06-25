import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware";
import { getStaffUsers } from "./user.controller";
import { role } from "../../middlewares/roles.middleware";

const router = Router();

// Protect all user routes
router.use(protect);

// GET /api/users - Manager or Admin only can list users
router.get("/", role(["manager", "admin"]), getStaffUsers);

export default router;
