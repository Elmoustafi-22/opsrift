import express from "express";
import type { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import routes from "./routes";
import { errorHandler } from "./middlewares/error.middleware";

const app: Application = express();

// Enable trust proxy for rate limiting behind reverse proxies (e.g., Render)
app.set("trust proxy", 1);

// Security headers
app.use(helmet());

// CORS configuration matching the front-end URL
const corsOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

// Rate limiting strictly for Auth endpoints to avoid brute-forcing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes per IP
  message: "Too many login attempts, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiter to auth routes only
app.use("/api/auth", authLimiter);

// Mount API Routes under /api prefix
app.use("/api", routes);

app.get("/", (_req, res) => {
  res.json({
    message: "Opsrift API is running!",
  });
});

// Error handling middleware
app.use(errorHandler);

export default app;
