import express from "express";
import { addAddress, deleteAddress, login, logout, register, updateProfile } from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { asyncRoute } from "../utils/asyncRoute.js";

export const authRouter = express.Router();

authRouter.post("/register", asyncRoute(register));
authRouter.post("/login", asyncRoute(login));
authRouter.post("/logout", logout);

authRouter.patch("/profile", authenticate, asyncRoute(updateProfile));
authRouter.post("/addresses", authenticate, asyncRoute(addAddress));
authRouter.delete("/addresses/:id", authenticate, asyncRoute(deleteAddress));

