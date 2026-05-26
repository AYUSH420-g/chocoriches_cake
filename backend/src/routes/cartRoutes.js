import express from "express";
import { addCartItem, clearCart, getCart, removeCartItem, updateCartItem } from "../controllers/cartController.js";
import { optionalAuth } from "../middleware/authMiddleware.js";
import { asyncRoute } from "../utils/asyncRoute.js";

export const cartRouter = express.Router();

cartRouter.use(optionalAuth);
cartRouter.get("/", asyncRoute(getCart));
cartRouter.delete("/", asyncRoute(clearCart));
cartRouter.post("/items", asyncRoute(addCartItem));
cartRouter.patch("/items/:id", asyncRoute(updateCartItem));
cartRouter.delete("/items/:id", asyncRoute(removeCartItem));
