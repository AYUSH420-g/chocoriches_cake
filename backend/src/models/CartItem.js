import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    productId: { type: String, required: true, index: true },
    sessionId: { type: String, index: true },
    userEmail: { type: String, index: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    size: { type: String, required: true },
    weight: { type: String },
    sameDayDelivery: { type: Boolean, default: false },
    quantity: { type: Number, required: true, min: 1 },
    messageOnCake: { type: String },
  },
  { timestamps: true }
);

export const CartItem = mongoose.models.CartItem || mongoose.model("CartItem", cartItemSchema);
