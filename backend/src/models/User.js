import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  pincode: { type: String, required: true },
  city: { type: String, required: true },
  landmark: { type: String },
});

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
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    addresses: [addressSchema],
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
