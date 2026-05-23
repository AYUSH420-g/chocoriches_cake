import mongoose from "mongoose";

const servicePincodeSchema = new mongoose.Schema(
  {
    pincode: { type: String, required: true, unique: true, trim: true, index: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    deliveryFee: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const ServicePincode =
  mongoose.models.ServicePincode || mongoose.model("ServicePincode", servicePincodeSchema);
