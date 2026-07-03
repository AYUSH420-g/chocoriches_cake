import express from "express";
import multer from "multer";
import { uploadImage } from "../controllers/uploadController.js";
import { requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 1, parts: 2 },
  fileFilter(_req, file, callback) {
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
    const allowedExtension = /\.(jpe?g|png|webp|gif)$/i.test(file.originalname || "");
    if (!allowedTypes.has(file.mimetype) || !allowedExtension) {
      const error = new Error("Only JPEG, PNG, WebP, and GIF images are allowed.");
      error.status = 400;
      callback(error);
      return;
    }
    callback(null, true);
  },
});

// Assuming only admin can upload product images
router.post("/", requireAdmin, upload.single("image"), uploadImage);

export const uploadRouter = router;
