import express from "express";
import { addReview, getProductReviews, getUserReviews } from "../controllers/reviewController.js";
import { authenticate, optionalAuth } from "../middleware/authMiddleware.js";
import { asyncRoute } from "../utils/asyncRoute.js";

export const reviewRouter = express.Router();

reviewRouter.post("/", authenticate, asyncRoute(addReview));
reviewRouter.get("/me", authenticate, asyncRoute(getUserReviews));
reviewRouter.get("/product/:productId", optionalAuth, asyncRoute(getProductReviews));
