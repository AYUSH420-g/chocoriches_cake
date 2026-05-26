import express from "express";
import { listProducts, productDetail } from "../controllers/productController.js";
import { asyncRoute } from "../utils/asyncRoute.js";

export const productRouter = express.Router();

productRouter.get("/", asyncRoute(listProducts));
productRouter.get("/:id", asyncRoute(productDetail));
