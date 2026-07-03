import express from "express";
import { submitInquiry } from "../controllers/inquiryController.js";
import { asyncRoute } from "../utils/asyncRoute.js";
import { createStrictLimiter } from "../middleware/rateLimiter.js";

export const inquiryRouter = express.Router();

inquiryRouter.post("/", createStrictLimiter(10, "inquiry-submit"), asyncRoute(submitInquiry));
