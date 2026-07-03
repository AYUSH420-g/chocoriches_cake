import express from "express";
import { addAddress, deleteAddress, login, googleLogin, logout, register, updateProfile, forgotPassword, resetPassword } from "../controllers/authController.js";
import { authenticate, optionalAuth } from "../middleware/authMiddleware.js";
import { asyncRoute } from "../utils/asyncRoute.js";
import { createStrictLimiter } from "../middleware/rateLimiter.js";

export const authRouter = express.Router();

authRouter.post("/register", createStrictLimiter(10, "auth-register"), asyncRoute(register));
authRouter.post("/login", createStrictLimiter(10, "auth-login"), asyncRoute(login));
authRouter.post("/google", createStrictLimiter(15, "auth-google"), asyncRoute(googleLogin));
authRouter.post("/logout", optionalAuth, asyncRoute(logout));
authRouter.post("/forgot-password", createStrictLimiter(5, "auth-forgot"), asyncRoute(forgotPassword));
authRouter.post("/reset-password", createStrictLimiter(10, "auth-reset"), asyncRoute(resetPassword));

authRouter.patch("/profile", authenticate, asyncRoute(updateProfile));
authRouter.post("/addresses", authenticate, asyncRoute(addAddress));
authRouter.delete("/addresses/:id", authenticate, asyncRoute(deleteAddress));
