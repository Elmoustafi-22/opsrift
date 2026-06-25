import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware";
import { role } from "../../middlewares/roles.middleware";
import { getDocDraft, submitDoc, getDocs, reviewDocNotes, exportDocsToCSV, refineDocNotes } from "./doc.controller";

const router = Router();

// Protect all document endpoints
router.use(protect);

// GET /api/docs/draft/:taskId (Staff only, or Manager/Admin if needed)
router.get("/draft/:taskId", getDocDraft);

// POST /api/docs/review-notes (Staff, Manager, Admin)
router.post("/review-notes", reviewDocNotes);

// POST /api/docs/refine-notes (Staff refine their raw notes with AI)
router.post("/refine-notes", refineDocNotes);

// GET /api/docs/export/csv (Manager/Admin only)
router.get("/export/csv", role(["manager", "admin"]), exportDocsToCSV);

// POST /api/docs (Staff, Manager, Admin)
router.post("/", submitDoc);

// GET /api/docs (Manager/Admin only)
router.get("/", role(["manager", "admin"]), getDocs);

export default router;

