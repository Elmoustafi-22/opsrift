import Task from "../modules/tasks/task.model";
import Notification from "../modules/notifications/notification.model";
import User from "../modules/users/user.model";
import Doc from "../modules/docs/doc.model";
import { generateWeeklySummary } from "../services/ai.service";

// Setup hourly escalation routine & register other cron jobs
export const initEscalationCron = async () => {
  try {
    const cron = await import("node-cron");
    const schedule = cron.default ? cron.default.schedule : (cron as any).schedule;

    // 1. Task Escalation Cron (Runs Hourly)
    schedule("0 * * * *", async () => {
      console.log("Running task escalation cron job checking for overdue entries...");
      try {
        const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
        
        // Find tasks that need to be escalated
        const tasksToEscalate = await Task.find({
          status: "inprogress",
          dueDate: { $lt: cutoff },
        });

        if (tasksToEscalate.length > 0) {
          for (const task of tasksToEscalate) {
            task.status = "overdue";
            await task.save();

            // Create notification for assigned staff member
            await Notification.create({
              userId: task.assignedTo,
              type: "MESSAGE",
              title: "Task Escalated to Overdue",
              body: `Task "${task.title}" is overdue by more than 48 hours. Please update documentation immediately.`,
              referenceId: task._id,
            });

            // Create notification for the manager who created it
            if (task.createdBy) {
              await Notification.create({
                userId: task.createdBy,
                type: "MESSAGE",
                title: "Operator Task Overdue Alert",
                body: `Task "${task.title}" has been escalated to overdue.`,
                referenceId: task._id,
              });
            }
          }
          console.log(`Escalated ${tasksToEscalate.length} overdue tasks with notifications dispatched.`);
        }
      } catch (error) {
        console.error("Error executing task escalation cron job:", error);
      }
    });

    // 2. Daily Due Reminders Cron (Runs Daily at 7 AM)
    schedule("0 7 * * *", async () => {
      console.log("Running daily due soon reminder cron job...");
      try {
        const now = new Date();
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

        const tasksDueSoon = await Task.find({
          status: { $in: ["pending", "inprogress"] },
          dueDate: { $gte: now, $lte: tomorrow },
        });

        for (const task of tasksDueSoon) {
          await Notification.create({
            userId: task.assignedTo,
            type: "MESSAGE",
            title: "Task Due Soon Reminder",
            body: `Task "${task.title}" is due soon. Final deadline: ${new Date(
              task.dueDate
            ).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}.`,
            referenceId: task._id,
          });
        }
        console.log(`Dispatched ${tasksDueSoon.length} due soon task reminders.`);
      } catch (error) {
        console.error("Error executing daily due reminders cron job:", error);
      }
    });

    // 3. Weekly AI Summary Report Announcement Cron (Runs Mondays at 8 AM)
    schedule("0 8 * * 1", async () => {
      console.log("Running weekly AI summary announcement cron job...");
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const docs = await Doc.find({
          createdAt: { $gte: sevenDaysAgo },
        })
          .populate("taskId")
          .populate("submittedBy");

        if (docs.length > 0) {
          const completedTasksWithDocs = docs.map((d: any) => ({
            title: d.taskId?.title || "Unknown Task",
            description: d.taskId?.description || "",
            completedBy: d.submittedBy?.name || "Unknown Operator",
            notes: d.notes,
            outcome: d.outcome,
            completedAt: d.createdAt,
          }));

          const summaryText = await generateWeeklySummary(completedTasksWithDocs);

          // Find all manager and admin users to send the weekly announcement to
          const managers = await User.find({ role: { $in: ["manager", "admin"] } });
          for (const manager of managers) {
            await Notification.create({
              userId: manager._id,
              type: "ANNOUNCEMENT",
              title: "Weekly AI Operational Summary",
              body: summaryText.substring(0, 350) + "...",
              link: "/tasks", // Takes them back to tasks page to review
            });
          }
          console.log(`Dispatched Weekly AI Summary announcements to ${managers.length} managers.`);
        }
      } catch (error) {
        console.error("Error executing weekly AI summary announcement cron job:", error);
      }
    });

    console.log("Task escalation, daily reminders, and weekly AI cron jobs initialized.");
  } catch (error) {
    console.error("Failed to import node-cron dynamically:", error);
  }
};
