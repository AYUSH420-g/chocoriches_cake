import express from "express";
import multer from "multer";
import { uploadImage } from "../controllers/uploadController.js";
import { requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Assuming only admin can upload product images
router.post("/", requireAdmin, upload.single("image"), uploadImage);

export const uploadRouter = router;
