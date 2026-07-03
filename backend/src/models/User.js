import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  id: { type: String, required: true, maxlength: 100 },
  label: { type: String, required: true, maxlength: 30 },
  name: { type: String, required: true, maxlength: 100 },
  phone: { type: String, required: true, match: /^\d{10}$/ },
  address: { type: String, required: true, maxlength: 500 },
  pincode: { type: String, required: true, match: /^\d{6}$/ },
  city: { type: String, required: true, maxlength: 100 },
  landmark: { type: String, maxlength: 200 },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, maxlength: 15 },
    passwordHash: { type: String },
    salt: { type: String },
    // Legacy records used 100k iterations. New/rehash writes explicitly store 210k.
    passwordIterations: { type: Number, default: 100000 },
    tokenVersion: { type: Number, default: 0 },
    lastAdminTotpCounter: { type: Number, default: -1, select: false },
    emailVerified: { type: Boolean, default: false },
    authProviders: [{ type: String, enum: ["local", "google"] }],
    emailVerificationToken: { type: String },
    emailVerificationExpire: { type: Date },
    avatar: { type: String },
    membership: { type: String, default: "Connoisseur Member" },
    role: { type: String, enum: ["user", "admin"], default: "user", index: true },
    isBlocked: { type: Boolean, default: false, index: true },
    blockedReason: { type: String, maxlength: 300 },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    stampCount: { type: Number, default: 0 },
    addresses: [addressSchema],
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
