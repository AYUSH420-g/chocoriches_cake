import express from "express";
import { createRazorpayOrder, razorpayConfig, verifyRazorpayPayment } from "../controllers/paymentController.js";
import { asyncRoute } from "../utils/asyncRoute.js";

export const paymentRouter = express.Router();

paymentRouter.get("/razorpay/config", razorpayConfig);
paymentRouter.post("/razorpay/orders", asyncRoute(createRazorpayOrder));
paymentRouter.post("/razorpay/verify", asyncRoute(verifyRazorpayPayment));
