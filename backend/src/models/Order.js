import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    date: { type: String, required: true },
    total: { type: Number, required: true },
    status: { type: String, required: true },
    items: [{ type: mongoose.Schema.Types.Mixed, required: true }],
    itemCount: { type: Number, default: 0 },
    customerName: { type: String },
    customerEmail: { type: String },
    customerPhone: { type: String },
    deliveryAddress: { type: String },
    deliveryPincode: { type: String },
    deliveryDate: { type: String },
    deliveryTimeSlot: { type: String },
    deliveryOption: { type: String, default: "pickup" },
    payment: { type: mongoose.Schema.Types.Mixed },
    isStampRewardOrder: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
