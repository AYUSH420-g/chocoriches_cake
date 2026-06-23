import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../../..");
const backendRoot = path.resolve(__dirname, "../..");

dotenv.config({ path: path.resolve(projectRoot, ".env") });
dotenv.config({ path: path.resolve(backendRoot, ".env") });
dotenv.config();

const cleanOrigin = (url) => url ? url.trim().replace(/\/+$/, "") : "";

const allowedOrigins = new Set(
  [
    cleanOrigin(process.env.CLIENT_URL),
    cleanOrigin(process.env.CLIENT_ORIGIN),
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
    password: process.env.ADMIN_PASSWORD,
  },
  jwtSecret: process.env.JWT_SECRET || process.env.SESSION_SECRET,
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
};

if (!config.jwtSecret) {
  throw new Error("CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing. You must provide a secure random string for JWT_SECRET in your .env file or server environment settings.");
}

if (!config.adminSeed.password) {
  throw new Error("CRITICAL SECURITY ERROR: ADMIN_PASSWORD environment variable is missing. You must define a secure password for the admin account in your .env file or server environment settings.");
}
