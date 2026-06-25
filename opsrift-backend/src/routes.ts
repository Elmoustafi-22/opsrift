import { Router } from "express";
import authRouter from "./modules/auth/auth.routes";
import taskRouter from "./modules/tasks/task.routes";
import docRouter from "./modules/docs/doc.routes";
import userRouter from "./modules/users/user.routes";
import notificationRouter from "./modules/notifications/notification.routes";

const router = Router();

// Mount Routes
router.use("/auth", authRouter);
router.use("/tasks", taskRouter);
router.use("/docs", docRouter);
router.use("/users", userRouter);
router.use("/notifications", notificationRouter);

export default router;

