import rateLimit from "express-rate-limit";
import { SharedRateLimitStore } from "../services/rateLimitStore.js";

// Global rate limiter applied to all API endpoints
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per `window` (here, per 15 minutes)
  message: {
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: new SharedRateLimitStore("global"),
});

// Use a separate store per sensitive action so login attempts do not consume a
// customer's checkout, tracking, or contact allowance.
export function createStrictLimiter(max = 10, prefix = `sensitive-${max}`) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    message: {
      message: "Too many attempts from this IP, please try again after 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new SharedRateLimitStore(prefix),
  });
}
