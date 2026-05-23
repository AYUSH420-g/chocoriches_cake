import { isDatabaseConnected } from "../db.js";
import { CartItem } from "../models/CartItem.js";
import { productId } from "../utils/formatters.js";
import { memory } from "../utils/memoryStore.js";
import { findProductForCart, productCartSnapshot } from "./productController.js";

export async function getCart(_req, res) {
  const cartItems = isDatabaseConnected()
    ? await CartItem.find({}).sort({ createdAt: 1 }).lean()
    : memory.cartItems;

  res.json(cartItems.map(({ _id, __v, createdAt, updatedAt, ...item }) => item));
}

export async function addCartItem(req, res) {
  const { productId: productIdValue, size = "6 Inch (Serves 8-10)", quantity = 1 } = req.body;
  const product = await findProductForCart(productIdValue);
  const item = {
    id: `${productId(product)}-${Date.now()}`,
    ...productCartSnapshot(product),
    size,
    quantity: Math.max(1, Number(quantity) || 1),
  };

  if (isDatabaseConnected()) {
    await CartItem.create(item);
  } else {
    memory.cartItems.push(item);
  }

  res.status(201).json(item);
}

export async function updateCartItem(req, res) {
  const quantity = Math.max(1, Number(req.body.quantity) || 1);

  if (isDatabaseConnected()) {
    const item = await CartItem.findOneAndUpdate({ id: req.params.id }, { quantity }, { new: true }).lean();
    res.json(item || { id: req.params.id, quantity });
    return;
  }

  memory.cartItems = memory.cartItems.map((item) =>
    item.id === req.params.id ? { ...item, quantity } : item
  );
  res.json(memory.cartItems.find((item) => item.id === req.params.id));
}

export async function removeCartItem(req, res) {
  if (isDatabaseConnected()) {
    await CartItem.deleteOne({ id: req.params.id });
  } else {
    memory.cartItems = memory.cartItems.filter((item) => item.id !== req.params.id);
  }

  res.status(204).end();
}
