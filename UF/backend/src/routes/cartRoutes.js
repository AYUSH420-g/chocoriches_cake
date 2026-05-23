import express from "express";
import { addCartItem, getCart, removeCartItem, updateCartItem } from "../controllers/cartController.js";
import { asyncRoute } from "../utils/asyncRoute.js";

export const cartRouter = express.Router();

cartRouter.get("/", asyncRoute(getCart));
cartRouter.post("/items", asyncRoute(addCartItem));
cartRouter.patch("/items/:id", asyncRoute(updateCartItem));
cartRouter.delete("/items/:id", asyncRoute(removeCartItem));
