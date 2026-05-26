import cors from "cors";
import { config } from "../config/env.js";

export function corsMiddleware() {
  return cors({
    origin(origin, callback) {
      const cleanOrigin = origin ? origin.trim().replace(/\/+$/, "") : "";
      const isLocalDevOrigin = /^http:\/\/localhost:\d+$/.test(cleanOrigin);
      if (!origin || config.allowedOrigins.has(cleanOrigin) || isLocalDevOrigin) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  });
}
