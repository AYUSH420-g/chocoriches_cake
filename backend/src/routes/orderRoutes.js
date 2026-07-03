import express from "express";
import { allOrders, createOrder, myOrders, trackOrder } from "../controllers/orderController.js";
import { authenticate, optionalAuth, requireAdmin } from "../middleware/authMiddleware.js";
import { asyncRoute } from "../utils/asyncRoute.js";
import { createStrictLimiter } from "../middleware/rateLimiter.js";

export const orderRouter = express.Router();

orderRouter.post("/", createStrictLimiter(10, "order-create"), authenticate, asyncRoute(createOrder));
orderRouter.get("/my", authenticate, asyncRoute(myOrders));
orderRouter.get("/track/:id", createStrictLimiter(20, "order-track"), optionalAuth, asyncRoute(trackOrder));
orderRouter.get("/", authenticate, asyncRoute(myOrders));
orderRouter.get("/all", requireAdmin, asyncRoute(allOrders));
