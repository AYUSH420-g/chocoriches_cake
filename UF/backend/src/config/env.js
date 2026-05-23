import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../../..");
const backendRoot = path.resolve(__dirname, "../..");

dotenv.config({ path: path.resolve(projectRoot, ".env") });
dotenv.config({ path: path.resolve(backendRoot, ".env") });
dotenv.config();

const allowedOrigins = new Set(
  [
    process.env.CLIENT_URL,
    process.env.CLIENT_ORIGIN,
    "http://localhost:5173",
    "http://localhost:5174",
  ].filter(Boolean)
);

export const config = {
  port: process.env.PORT || 3001,
  apiPrefix: process.env.API_PREFIX || "/api/v1",
  distDir: path.resolve(projectRoot, "frontend/dist"),
  allowedOrigins,
  adminSeed: {
    name: process.env.ADMIN_NAME || "ChocoRiches Admin",
    email: process.env.ADMIN_EMAIL || "admin@chocoriches.com",
    password: process.env.ADMIN_PASSWORD || "ChocoAdmin@2026",
  },
  jwtSecret: process.env.JWT_SECRET || process.env.SESSION_SECRET || "chocoriches-demo",
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "",
};
