import express from "express";
import { addAddress, deleteAddress, login, googleLogin, logout, register, updateProfile, forgotPassword, resetPassword } from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { asyncRoute } from "../utils/asyncRoute.js";

export const authRouter = express.Router();

authRouter.post("/register", asyncRoute(register));
authRouter.post("/login", asyncRoute(login));
authRouter.post("/google", asyncRoute(googleLogin));
authRouter.post("/logout", logout);
authRouter.post("/forgot-password", asyncRoute(forgotPassword));
authRouter.post("/reset-password", asyncRoute(resetPassword));

authRouter.patch("/profile", authenticate, asyncRoute(updateProfile));
authRouter.post("/addresses", authenticate, asyncRoute(addAddress));
authRouter.delete("/addresses/:id", authenticate, asyncRoute(deleteAddress));

