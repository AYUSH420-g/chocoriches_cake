import mongoose from "mongoose";

const servicePincodeSchema = new mongoose.Schema(
  {
    pincode: { type: String, required: true, unique: true, trim: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const ServicePincode =
  mongoose.models.ServicePincode || mongoose.model("ServicePincode", servicePincodeSchema);
