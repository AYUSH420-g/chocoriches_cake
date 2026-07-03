import mongoose from "mongoose";

const blockedDateSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true, index: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    reason: { type: String, maxlength: 300 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const BlockedDate = mongoose.models.BlockedDate || mongoose.model("BlockedDate", blockedDateSchema);
