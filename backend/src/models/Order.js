import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true, maxlength: 100 },
    date: { type: String, required: true },
    total: { type: Number, required: true, min: 1 },
    status: { type: String, required: true, enum: ["Processing", "Packed", "Out For Delivery", "Delivered", "Cancelled"] },
    items: [{ type: mongoose.Schema.Types.Mixed, required: true }],
    itemCount: { type: Number, default: 0 },
    customerName: { type: String, maxlength: 100 },
    customerEmail: { type: String, maxlength: 254, index: true },
    customerPhone: { type: String, maxlength: 15 },
    deliveryAddress: { type: String, maxlength: 500 },
    deliveryPincode: { type: String, maxlength: 6 },
    deliveryDate: { type: String },
    deliveryTimeSlot: { type: String },
    deliveryOption: { type: String, enum: ["pickup", "delivery"], default: "pickup" },
    payment: { type: mongoose.Schema.Types.Mixed },
    isStampRewardOrder: { type: Boolean, default: false },
    cancelReason: { type: String, maxlength: 300 },
  },
  { timestamps: true }
);

orderSchema.index({ "payment.razorpayPaymentId": 1 }, { unique: true, sparse: true });

export const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
