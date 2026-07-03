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
const isProduction = process.env.NODE_ENV === "production";

const allowedOrigins = new Set(
  [
    cleanOrigin(process.env.CLIENT_URL),
    cleanOrigin(process.env.CLIENT_ORIGIN),
    ...(!isProduction ? ["http://localhost:5173", "http://localhost:5174"] : []),
    "https://www.chocoriches.in",
    "https://chocoriches.in"
  ].filter(Boolean)
);

export const config = {
  isProduction,
  port: process.env.PORT || 3001,
  apiPrefix: process.env.API_PREFIX || "/api/v1",
  clientUrl: cleanOrigin(process.env.CLIENT_URL || process.env.CLIENT_ORIGIN) || (isProduction ? "https://chocoriches.in" : "http://localhost:5173"),
  trustProxy: process.env.TRUST_PROXY === "true" || process.env.TRUST_PROXY === "1",
  distDir: path.resolve(projectRoot, "frontend/dist"),
  allowedOrigins,
  adminSeed: {
    name: process.env.ADMIN_NAME || "ChocoRiches Admin",
    email: process.env.ADMIN_EMAIL || "admin@chocoriches.com",
    password: process.env.ADMIN_PASSWORD,
    totpSecret: String(process.env.ADMIN_TOTP_SECRET || "").replace(/\s+/g, "").toUpperCase(),
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

if (String(config.jwtSecret).length < 32) {
  throw new Error("CRITICAL SECURITY ERROR: JWT_SECRET must contain at least 32 characters.");
}

if (!config.adminSeed.password) {
  throw new Error("CRITICAL SECURITY ERROR: ADMIN_PASSWORD environment variable is missing. You must define a secure password for the admin account in your .env file or server environment settings.");
}

if (String(config.adminSeed.password).length < 12) {
  throw new Error("CRITICAL SECURITY ERROR: ADMIN_PASSWORD must contain at least 12 characters.");
}

if (!/[a-z]/.test(config.adminSeed.password) || !/[A-Z]/.test(config.adminSeed.password) || !/\d/.test(config.adminSeed.password) || !/[^A-Za-z0-9]/.test(config.adminSeed.password)) {
  throw new Error("CRITICAL SECURITY ERROR: ADMIN_PASSWORD must include uppercase, lowercase, number, and special characters.");
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.adminSeed.email)) {
  throw new Error("CRITICAL SECURITY ERROR: ADMIN_EMAIL must be a valid email address.");
}

if (isProduction && !config.clientUrl.startsWith("https://")) {
  throw new Error("CRITICAL SECURITY ERROR: CLIENT_URL must use HTTPS in production.");
}

if (isProduction && !process.env.MONGODB_URI) {
  throw new Error("CRITICAL SECURITY ERROR: MONGODB_URI is required in production.");
}

if (config.adminSeed.totpSecret && (!/^[A-Z2-7]+$/.test(config.adminSeed.totpSecret) || config.adminSeed.totpSecret.length < 32)) {
  throw new Error("CRITICAL SECURITY ERROR: ADMIN_TOTP_SECRET must be a Base32 secret of at least 32 characters.");
}

if (isProduction && !config.adminSeed.totpSecret) {
  throw new Error("CRITICAL SECURITY ERROR: ADMIN_TOTP_SECRET is required in production.");
}
