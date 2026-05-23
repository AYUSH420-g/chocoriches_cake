import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    date: { type: String, required: true },
    total: { type: Number, required: true },
    status: { type: String, required: true },
    items: [{ type: String, required: true }],
    customerEmail: { type: String },
    deliveryPincode: { type: String },
    deliveryDate: { type: String },
    payment: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
