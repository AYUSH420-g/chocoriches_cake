import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    phone: { type: String },
    passwordHash: { type: String },
    salt: { type: String },
    avatar: { type: String },
    membership: { type: String, default: "Connoisseur Member" },
    role: { type: String, enum: ["user", "admin"], default: "user", index: true },
    isBlocked: { type: Boolean, default: false, index: true },
    blockedReason: { type: String },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
