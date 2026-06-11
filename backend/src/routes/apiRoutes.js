import express from "express";
import { profile } from "../controllers/authController.js";
import { blockedDates, categories, subcategories, checkPincode, health, settings } from "../controllers/publicController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { asyncRoute } from "../utils/asyncRoute.js";
import { adminRouter } from "./adminRoutes.js";
import { authRouter } from "./authRoutes.js";
import { cartRouter } from "./cartRoutes.js";
import { inquiryRouter } from "./inquiryRoutes.js";
import { orderRouter } from "./orderRoutes.js";
import { paymentRouter } from "./paymentRoutes.js";
import { productRouter } from "./productRoutes.js";
import { reviewRouter } from "./reviewRoutes.js";
import { uploadRouter } from "./uploadRoutes.js";

export const apiRouter = express.Router();

apiRouter.get("/health", health);
apiRouter.get("/settings", asyncRoute(settings));
apiRouter.get("/categories", asyncRoute(categories));
apiRouter.get("/subcategories", asyncRoute(subcategories));
apiRouter.get("/pincodes/check/:pincode", asyncRoute(checkPincode));
apiRouter.get("/blocked-dates", asyncRoute(blockedDates));

apiRouter.get("/profile", authenticate, profile);
apiRouter.use("/auth", authRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/cart", cartRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/payments", paymentRouter);
apiRouter.use("/inquiries", inquiryRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/reviews", reviewRouter);
apiRouter.use("/upload", uploadRouter);
