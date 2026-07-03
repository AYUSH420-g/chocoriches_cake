import mongoose from "mongoose";

const subcategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 120 },
    category: { type: String, required: true, index: true, maxlength: 80 }, // Referencing category name
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Subcategory = mongoose.models.Subcategory || mongoose.model("Subcategory", subcategorySchema);
