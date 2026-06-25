import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware";
import { role } from "../../middlewares/roles.middleware";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTaskStatus,
  deleteTask,
  getAITaskBreakdown,
  createTasksBulk,
  getAITaskPrioritization,
  getAIWeeklySummary,
  exportTasksToCSV,
} from "./task.controller";

const router = Router();

// All task routes require authentication
router.use(protect);

// GET /api/tasks: Staff get assigned tasks; Manager/Admin get all
router.get("/", getTasks);

// GET /api/tasks/export/csv: Export user-accessible tasks as CSV
router.get("/export/csv", exportTasksToCSV);

// GET /api/tasks/ai-weekly-summary (Manager/Admin only)
router.get("/ai-weekly-summary", role(["manager", "admin"]), getAIWeeklySummary);

// POST /api/tasks/ai-prioritize (Staff, Manager, Admin)
router.post("/ai-prioritize", getAITaskPrioritization);

// POST /api/tasks/ai-breakdown (Manager/Admin only)
router.post("/ai-breakdown", role(["manager", "admin"]), getAITaskBreakdown);

// POST /api/tasks/bulk (Manager/Admin only)
router.post("/bulk", role(["manager", "admin"]), createTasksBulk);

// GET /api/tasks/:id
router.get("/:id", getTaskById);

// POST /api/tasks (Manager/Admin only)
router.post("/", role(["manager", "admin"]), createTask);

// PATCH /api/tasks/:id/status (Staff, Manager, Admin)
router.patch("/:id/status", updateTaskStatus);

// DELETE /api/tasks/:id (Admin only - soft delete)
router.delete("/:id", role(["admin"]), deleteTask);

export default router;

