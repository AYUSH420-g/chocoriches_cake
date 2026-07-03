import mongoose from "mongoose";

const rateLimitEntrySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    count: { type: Number, required: true, min: 0, default: 0 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: false, versionKey: false }
);

export const RateLimitEntry =
  mongoose.models.RateLimitEntry || mongoose.model("RateLimitEntry", rateLimitEntrySchema);
