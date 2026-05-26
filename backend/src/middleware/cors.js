import cors from "cors";
import { config } from "../config/env.js";

export function corsMiddleware() {
  return cors({
    origin(origin, callback) {
      const isLocalDevOrigin = /^http:\/\/localhost:\d+$/.test(origin || "");
      if (!origin || config.allowedOrigins.has(origin) || isLocalDevOrigin) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  });
}
