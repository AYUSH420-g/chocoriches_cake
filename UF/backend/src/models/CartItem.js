import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

export const CartItem = mongoose.models.CartItem || mongoose.model("CartItem", cartItemSchema);
