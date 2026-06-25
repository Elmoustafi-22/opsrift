import { Request, Response, NextFunction } from "express";
import Notification from "./notification.model";

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const notifications = await Notification.find({ userId: req.user?.id })
      .sort({ createdAt: -1 })
      .limit(50); // limit to last 50 entries to keep it light
    return res.json(notifications);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.id },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.json(notification);
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    await Notification.updateMany(
      { userId: req.user?.id, read: false },
      { $set: { read: true } }
    );
    return res.json({ message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
};
