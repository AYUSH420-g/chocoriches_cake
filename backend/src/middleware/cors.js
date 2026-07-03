import cors from "cors";
import { config } from "../config/env.js";

export function corsMiddleware() {
  return cors({
    origin(origin, callback) {
      const cleanOrigin = origin ? origin.trim().replace(/\/+$/, "") : "";
      const isLocalDevOrigin = !config.isProduction && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(cleanOrigin);
      if (!origin || config.allowedOrigins.has(cleanOrigin) || isLocalDevOrigin) {
        callback(null, true);
        return;
      }
      const error = new Error("Origin is not allowed.");
      error.status = 403;
      callback(error);
    },
    credentials: true,
  });
}
