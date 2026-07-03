import express from "express";
import { adminLogin, logout } from "../controllers/authController.js";
import * as admin from "../controllers/adminController.js";
import { requireAdmin } from "../middleware/authMiddleware.js";
import { asyncRoute } from "../utils/asyncRoute.js";
import { createStrictLimiter } from "../middleware/rateLimiter.js";

export const adminRouter = express.Router();

adminRouter.post("/login", createStrictLimiter(5, "admin-login"), asyncRoute(adminLogin));
adminRouter.post("/logout", requireAdmin, asyncRoute(logout));

adminRouter.use(requireAdmin);

adminRouter.get("/summary", asyncRoute(admin.summary));
adminRouter.get("/users", asyncRoute(admin.users));
adminRouter.patch("/users/:id/block", asyncRoute(admin.blockUser));

adminRouter.get("/products", asyncRoute(admin.products));
adminRouter.post("/products", asyncRoute(admin.createProduct));
adminRouter.patch("/products/:id", asyncRoute(admin.updateProduct));
adminRouter.delete("/products/:id", asyncRoute(admin.deleteProduct));

adminRouter.get("/categories", asyncRoute(admin.categories));
adminRouter.post("/categories", asyncRoute(admin.createCategory));
adminRouter.patch("/categories/:id", asyncRoute(admin.updateCategory));
adminRouter.delete("/categories/:id", asyncRoute(admin.deleteCategory));

adminRouter.get("/subcategories", asyncRoute(admin.subcategories));
adminRouter.post("/subcategories", asyncRoute(admin.createSubcategory));
adminRouter.patch("/subcategories/:id", asyncRoute(admin.updateSubcategory));
adminRouter.delete("/subcategories/:id", asyncRoute(admin.deleteSubcategory));

adminRouter.get("/pincodes", asyncRoute(admin.pincodes));
adminRouter.post("/pincodes", asyncRoute(admin.createPincode));
adminRouter.patch("/pincodes/:id", asyncRoute(admin.updatePincode));
adminRouter.delete("/pincodes/:id", asyncRoute(admin.deletePincode));

adminRouter.get("/blocked-dates", asyncRoute(admin.blockedDates));
adminRouter.post("/blocked-dates", asyncRoute(admin.createBlockedDate));
adminRouter.patch("/blocked-dates/:id", asyncRoute(admin.updateBlockedDate));
adminRouter.delete("/blocked-dates/:id", asyncRoute(admin.deleteBlockedDate));

adminRouter.get("/orders", asyncRoute(admin.orders));
adminRouter.patch("/orders/:id", asyncRoute(admin.updateOrder));

adminRouter.get("/inquiries", asyncRoute(admin.inquiries));
adminRouter.get("/settings", asyncRoute(admin.settings));
adminRouter.patch("/settings", asyncRoute(admin.saveSettings));
