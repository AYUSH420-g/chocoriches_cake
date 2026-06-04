import express from "express";
import { submitInquiry } from "../controllers/inquiryController.js";
import { asyncRoute } from "../utils/asyncRoute.js";
import { strictLimiter } from "../middleware/rateLimiter.js";

export const inquiryRouter = express.Router();

inquiryRouter.post("/", strictLimiter, asyncRoute(submitInquiry));
