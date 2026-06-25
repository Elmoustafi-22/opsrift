import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import User from "../modules/users/user.model";

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: Missing or malformed token" });
  }

  try {
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: Token missing" });
    }
    const decoded = verifyToken(token);
    
    // Optional: check if user still exists and is active
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Unauthorized: User account inactive or deleted" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized: Invalid or expired token",
    });
  }
};