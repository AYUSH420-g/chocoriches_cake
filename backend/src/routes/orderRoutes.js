import express from "express";
import { allOrders, createOrder, myOrders, trackOrder } from "../controllers/orderController.js";
import { authenticate, optionalAuth } from "../middleware/authMiddleware.js";
import { asyncRoute } from "../utils/asyncRoute.js";
import { strictLimiter } from "../middleware/rateLimiter.js";

export const orderRouter = express.Router();

orderRouter.post("/", strictLimiter, optionalAuth, asyncRoute(createOrder));
orderRouter.get("/my", authenticate, asyncRoute(myOrders));
orderRouter.get("/track/:id", asyncRoute(trackOrder));
orderRouter.get("/", authenticate, asyncRoute(myOrders));
orderRouter.get("/all", authenticate, asyncRoute(allOrders));
