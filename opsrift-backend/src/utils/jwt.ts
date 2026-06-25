import jwt from "jsonwebtoken";

export interface JwtPayload {
  id: string;
  email: string;
  role: "admin" | "manager" | "staff";
  name: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "fallbacksecret12345";

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};
