import express from "express";
import { createRazorpayOrder, razorpayConfig, verifyRazorpayPayment, razorpayWebhook } from "../controllers/paymentController.js";
import { asyncRoute } from "../utils/asyncRoute.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { createStrictLimiter } from "../middleware/rateLimiter.js";

export const paymentRouter = express.Router();

paymentRouter.get("/razorpay/config", razorpayConfig);
paymentRouter.post("/razorpay/orders", createStrictLimiter(10, "payment-create"), authenticate, asyncRoute(createRazorpayOrder));
paymentRouter.post("/razorpay/verify", createStrictLimiter(10, "payment-verify"), authenticate, asyncRoute(verifyRazorpayPayment));
paymentRouter.post("/razorpay/webhook", asyncRoute(razorpayWebhook));
