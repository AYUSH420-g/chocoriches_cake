import express from "express";
import { createRazorpayOrder, razorpayConfig } from "../controllers/paymentController.js";
import { asyncRoute } from "../utils/asyncRoute.js";

export const paymentRouter = express.Router();

paymentRouter.get("/razorpay/config", razorpayConfig);
paymentRouter.post("/razorpay/orders", asyncRoute(createRazorpayOrder));
