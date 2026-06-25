import { Request, Response, NextFunction } from "express";
import User, { IUser } from "./user.model";

export const getStaffUsers = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const validRoles: IUser["role"][] = ["admin", "manager", "staff"];
    const queryRole = req.query.role as string;
    const filterRole: IUser["role"] = validRoles.includes(queryRole as IUser["role"])
      ? (queryRole as IUser["role"])
      : "staff";

    const users = await User.find({ role: filterRole, isActive: true })
      .select("name email role")
      .sort({ name: 1 });
    return res.json(users);
  } catch (error) {
    next(error);
  }
};
