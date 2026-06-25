import { Request, Response, NextFunction } from "express";
import Task from "./task.model";
import User from "../users/user.model";
import Doc from "../docs/doc.model";
import {
  breakdownGoal,
  prioritizeTasks,
  generateWeeklySummary,
  generateTaskBreakdown,
} from "../../services/ai.service";

export const createTask = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { title, description, assignedTo, dueDate } = req.body;

    if (!title || !assignedTo || !dueDate) {
      return res.status(400).json({ message: "Title, assignedTo, and dueDate are required" });
    }

    // Verify assignee exists and is staff
    const assignee = await User.findById(assignedTo);
    if (!assignee || assignee.role !== "staff") {
      return res.status(400).json({ message: "Task must be assigned to a valid staff member" });
    }

    const aiBreakdown = await generateTaskBreakdown(title, description || "");

    const task = await Task.create({
      title,
      description,
      aiBreakdown,
      assignedTo,
      createdBy: req.user?.id,
      dueDate: new Date(dueDate),
      status: "pending",
    });

    return res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

export const getTasks = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    let query: any = {};

    // Staff can only see their own tasks
    if (req.user?.role === "staff") {
      query.assignedTo = req.user.id;
    }

    const tasks = await Task.find(query)
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    return res.json(tasks);
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Access control: staff can only see their own tasks
    if (req.user?.role === "staff" && task.assignedTo._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    // On-the-fly generation fallback for legacy/seeded tasks
    if (!task.aiBreakdown && task.title) {
      task.aiBreakdown = await generateTaskBreakdown(task.title, task.description || "");
      await task.save();
    }

    return res.json(task);
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Access control: staff can only update their own tasks
    if (req.user?.role === "staff" && task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    const validTransitions: Record<string, string[]> = {
      pending: ["inprogress"],
      inprogress: ["done"],
      overdue: ["done"],
      done: [],
    };

    const currentStatus = task.status;
    if (!validTransitions[currentStatus].includes(status)) {
      return res.status(400).json({
        message: `Invalid status transition from ${currentStatus} to ${status}`,
      });
    }

    task.status = status;
    await task.save();

    return res.json(task);
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    // Only Admin has delete access (which is mapped in routing via roles middleware)
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    return res.json({ message: "Task deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const getAITaskBreakdown = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { goal } = req.body;
    if (!goal) {
      return res.status(400).json({ message: "Goal is required" });
    }
    const subtasks = await breakdownGoal(goal);
    return res.json(subtasks);
  } catch (error) {
    next(error);
  }
};

export const createTasksBulk = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { tasks } = req.body;
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ message: "Tasks array is required" });
    }

    const createdTasks = [];
    for (const taskData of tasks) {
      const { title, description, assignedTo, dueDate } = taskData;
      if (!title || !assignedTo || !dueDate) {
        return res.status(400).json({
          message: "Title, assignedTo, and dueDate are required for all tasks",
        });
      }

      const assignee = await User.findById(assignedTo);
      if (!assignee) {
        return res.status(400).json({
          message: `Staff member not found for ID ${assignedTo}`,
        });
      }

      const aiBreakdown = await generateTaskBreakdown(title, description || "");

      const task = await Task.create({
        title,
        description,
        aiBreakdown,
        assignedTo,
        createdBy: req.user?.id,
        dueDate: new Date(dueDate),
        status: "pending",
      });
      createdTasks.push(task);
    }

    return res.status(201).json(createdTasks);
  } catch (error) {
    next(error);
  }
};

export const getAITaskPrioritization = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const tasks = await Task.find({
      assignedTo: req.user?.id,
      status: { $in: ["pending", "inprogress"] },
    }).select("_id title description dueDate");

    if (tasks.length === 0) {
      return res.json([]);
    }

    const taskDataForAI = tasks.map((t) => ({
      taskId: t._id,
      title: t.title,
      description: t.description || "",
      dueDate: t.dueDate,
    }));

    const prioritization = await prioritizeTasks(taskDataForAI);
    return res.json(prioritization);
  } catch (error) {
    next(error);
  }
};

export const getAIWeeklySummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const docs = await Doc.find({
      createdAt: { $gte: sevenDaysAgo },
    })
      .populate("taskId", "title description dueDate")
      .populate("submittedBy", "name email role");

    if (docs.length === 0) {
      return res.json({
        summary: "No operations were completed or documented in the last 7 days.",
      });
    }

    const completedTasksWithDocs = docs.map((d: any) => ({
      title: d.taskId?.title || "Unknown Task",
      description: d.taskId?.description || "",
      completedBy: d.submittedBy?.name || "Unknown Operator",
      notes: d.notes,
      outcome: d.outcome,
      completedAt: d.createdAt,
    }));

    const summary = await generateWeeklySummary(completedTasksWithDocs);
    return res.json({ summary });
  } catch (error) {
    next(error);
  }
};

export const exportTasksToCSV = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    let query: any = {};

    // Staff can only export their own tasks
    if (req.user?.role === "staff") {
      query.assignedTo = req.user.id;
    }

    const tasks = await Task.find(query)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    // Set headers for download
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=tasks_report_${Date.now()}.csv`);

    // Write CSV Headers
    res.write("Task ID,Title,Description,Status,Assigned To,Created By,Due Date,Doc Attached,Created At\n");

    for (const task of tasks) {
      const taskId = task._id.toString();
      const title = `"${task.title.replace(/"/g, '""')}"`;
      const description = `"${(task.description || "").replace(/"/g, '""')}"`;
      const status = task.status;
      const assignedTo = task.assignedTo ? `"${(task.assignedTo as any).name} (${(task.assignedTo as any).email})"` : "Unassigned";
      const createdBy = task.createdBy ? `"${(task.createdBy as any).name} (${(task.createdBy as any).email})"` : "System";
      const dueDate = task.dueDate ? new Date(task.dueDate).toISOString() : "";
      const docAttached = task.docAttached ? "Yes" : "No";
      const createdAt = task.createdAt ? new Date(task.createdAt).toISOString() : "";

      res.write(`${taskId},${title},${description},${status},${assignedTo},${createdBy},${dueDate},${docAttached},${createdAt}\n`);
    }

    res.end();
  } catch (error) {
    next(error);
  }
};
