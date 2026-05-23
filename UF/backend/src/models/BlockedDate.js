import mongoose from "mongoose";

const blockedDateSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true, index: true },
    reason: { type: String },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const BlockedDate = mongoose.models.BlockedDate || mongoose.model("BlockedDate", blockedDateSchema);
