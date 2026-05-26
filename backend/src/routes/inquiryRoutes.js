import express from "express";
import { submitInquiry } from "../controllers/inquiryController.js";
import { asyncRoute } from "../utils/asyncRoute.js";

export const inquiryRouter = express.Router();

inquiryRouter.post("/", asyncRoute(submitInquiry));
