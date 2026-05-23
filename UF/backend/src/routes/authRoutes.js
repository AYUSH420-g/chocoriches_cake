import express from "express";
import { login, logout, register } from "../controllers/authController.js";
import { asyncRoute } from "../utils/asyncRoute.js";

export const authRouter = express.Router();

authRouter.post("/register", asyncRoute(register));
authRouter.post("/login", asyncRoute(login));
authRouter.post("/logout", logout);
