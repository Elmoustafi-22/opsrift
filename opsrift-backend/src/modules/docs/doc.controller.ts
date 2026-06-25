import { Request, Response, NextFunction } from "express";
import Task from "../tasks/task.model";
import Doc from "./doc.model";
import { generateDraft, reviewNotes, refineNotes } from "../../services/ai.service";

export const getDocDraft = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId).populate("assignedTo", "name email");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const draft = await generateDraft(task);
    return res.json({ draft });
  } catch (error) {
    next(error);
  }
};

export const submitDoc = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { taskId, notes, outcome } = req.body;

    if (!taskId || !notes || !outcome) {
      return res.status(400).json({ message: "taskId, notes, and outcome are required" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Access control: staff can only document their own tasks
    if (req.user?.role === "staff" && task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    const doc = await Doc.create({
      taskId,
      submittedBy: req.user?.id,
      notes,
      outcome,
    });

    // Mark task as doc attached
    task.docAttached = true;
    task.status = "done";
    await task.save();

    return res.status(201).json(doc);
  } catch (error) {
    next(error);
  }
};

export const getDocs = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const docs = await Doc.find()
      .populate("taskId", "title description dueDate")
      .populate("submittedBy", "name email role")
      .sort({ createdAt: -1 });
    return res.json(docs);
  } catch (error) {
    next(error);
  }
};

export const reviewDocNotes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { notes, taskTitle } = req.body;
    if (!notes) {
      return res.status(400).json({ message: "Notes content is required" });
    }

    const review = await reviewNotes(taskTitle || "General Task", notes);
    return res.json(review);
  } catch (error) {
    next(error);
  }
};

export const exportDocsToCSV = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const docs = await Doc.find()
      .populate("taskId", "title description dueDate status")
      .populate("submittedBy", "name email role")
      .sort({ createdAt: -1 });

    // Set headers for download
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=documentation_report_${Date.now()}.csv`);

    // Write CSV Headers
    res.write("Doc ID,Task Title,Task Description,Task Status,Submitted By,Outcome,Notes,Submitted At\n");

    for (const doc of docs) {
      const docId = doc._id.toString();
      const taskTitle = doc.taskId ? `"${(doc.taskId as any).title.replace(/"/g, '""')}"` : "Unknown Task";
      const taskDescription = doc.taskId ? `"${((doc.taskId as any).description || "").replace(/"/g, '""')}"` : "";
      const taskStatus = doc.taskId ? (doc.taskId as any).status : "";
      const submittedBy = doc.submittedBy ? `"${(doc.submittedBy as any).name} (${(doc.submittedBy as any).email})"` : "Unknown User";
      const outcome = doc.outcome;
      const notes = `"${doc.notes.replace(/"/g, '""')}"`;
      const submittedAt = doc.createdAt ? new Date(doc.createdAt).toISOString() : "";

      res.write(`${docId},${taskTitle},${taskDescription},${taskStatus},${submittedBy},${outcome},${notes},${submittedAt}\n`);
    }

    res.end();
  } catch (error) {
    next(error);
  }
};

export const refineDocNotes = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { notes, taskTitle } = req.body;
    if (!notes || !notes.trim()) {
      return res.status(400).json({ message: "Please write your notes first before refining." });
    }
    const { refinedNotes, suggestedOutcome } = await refineNotes(taskTitle || "Task", notes);
    return res.json({ refinedNotes, suggestedOutcome });
  } catch (error) {
    next(error);
  }
};
