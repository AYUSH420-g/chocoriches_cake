import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, index: true, maxlength: 100 },
    userId: { type: String, required: true, index: true, maxlength: 100 },
    userName: { type: String, required: true, maxlength: 100 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

// Prevent a user from submitting multiple reviews for the same product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

export const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);
