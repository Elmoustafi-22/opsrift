import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "./notification.controller";

const router = Router();

// Protect all notification routes
router.use(protect);

// GET /api/notifications
router.get("/", getNotifications);

// PATCH /api/notifications/:id/read
router.patch("/:id/read", markAsRead);

// PATCH /api/notifications/mark-all-read
router.patch("/mark-all-read", markAllAsRead);

export default router;
