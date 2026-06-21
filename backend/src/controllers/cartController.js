import { isDatabaseConnected } from "../db.js";
import { CartItem } from "../models/CartItem.js";
import { cakeCapacityStatus } from "../services/availabilityService.js";
import { productId } from "../utils/formatters.js";
import { memory } from "../utils/memoryStore.js";
import { findProductForCart, productCartSnapshot } from "./productController.js";

function cartOwner(req) {
  const userEmail = String(req.user?.email || "").trim().toLowerCase();
  if (userEmail) {
    return { userEmail };
  }

  const sessionId = String(req.get("x-cart-session") || "").trim();
  return { sessionId: sessionId || "guest" };
}

function ownerMatches(item, owner) {
  return Object.entries(owner).every(([key, value]) => String(item[key] || "") === String(value));
}

async function ownerCartQuantity(owner) {
  const cartItems = isDatabaseConnected()
    ? await CartItem.find(owner).lean()
    : memory.cartItems.filter((item) => ownerMatches(item, owner));

  return cartItems.reduce((count, item) => count + Number(item.quantity || 0), 0);
}

export async function getCart(req, res) {
  const owner = cartOwner(req);
  const cartItems = isDatabaseConnected()
    ? await CartItem.find(owner).sort({ createdAt: 1 }).lean()
    : memory.cartItems.filter((item) => ownerMatches(item, owner));

  res.json(cartItems.map(({ _id, __v, createdAt, updatedAt, ...item }) => item));
}

export async function addCartItem(req, res) {
  const { productId: productIdValue, size = "6 Inch (Serves 8-10)", quantity = 1, baseFlavour, creamFlavour } = req.body;
  const product = await findProductForCart(productIdValue);
  if (!product) {
    res.status(404).json({ message: "Product not found." });
    return;
  }

  const requestedProductId = productId(product);
  const requestedSize = String(size || "Half Kg");
  const nextQuantity = Math.max(1, Number(quantity) || 1);
  const owner = cartOwner(req);
  const capacity = await cakeCapacityStatus(new Date().toISOString().slice(0, 10), nextQuantity, await ownerCartQuantity(owner));
  if (!capacity.allowed) {
    res.status(422).json({ message: capacity.message });
    return;
  }

  if (isDatabaseConnected()) {
    const existingItem = await CartItem.findOne({ ...owner, productId: requestedProductId, size: requestedSize, baseFlavour, creamFlavour });
    if (existingItem) {
      Object.assign(existingItem, productCartSnapshot(product, requestedSize), { weight: requestedSize, baseFlavour, creamFlavour });
      existingItem.quantity += nextQuantity;
      await existingItem.save();
      res.status(200).json(existingItem.toObject());
      return;
    }
  } else {
    const existingItem = memory.cartItems.find(
      (item) => ownerMatches(item, owner) && String(item.productId || item.id) === requestedProductId && item.size === requestedSize && item.baseFlavour === baseFlavour && item.creamFlavour === creamFlavour
    );
    if (existingItem) {
      Object.assign(existingItem, productCartSnapshot(product, requestedSize), { weight: requestedSize, baseFlavour, creamFlavour });
      existingItem.quantity += nextQuantity;
      res.status(200).json(existingItem);
      return;
    }
  }

  const item = {
    id: `${requestedProductId}-${Date.now()}`,
    productId: requestedProductId,
    ...owner,
    ...productCartSnapshot(product, requestedSize),
    size: requestedSize,
    weight: requestedSize,
    quantity: nextQuantity,
    baseFlavour,
    creamFlavour,
  };

  if (isDatabaseConnected()) {
    await CartItem.create(item);
  } else {
    memory.cartItems.push(item);
  }

  res.status(201).json(item);
}

export async function updateCartItem(req, res) {
  const updates = {};
  if (req.body.quantity !== undefined) updates.quantity = Math.max(1, Number(req.body.quantity) || 1);
  if (req.body.messageOnCake !== undefined) updates.messageOnCake = String(req.body.messageOnCake);

  const owner = cartOwner(req);
  const cartItems = isDatabaseConnected()
    ? await CartItem.find(owner).lean()
    : memory.cartItems.filter((item) => ownerMatches(item, owner));
  const currentItem = cartItems.find((item) => item.id === req.params.id);
  
  if (updates.quantity) {
    const reservedQuantity = cartItems.reduce((count, item) => count + (item.id === req.params.id ? 0 : Number(item.quantity || 0)), 0);
    const capacity = await cakeCapacityStatus(new Date().toISOString().slice(0, 10), updates.quantity, reservedQuantity);
    if (currentItem && !capacity.allowed) {
      res.status(422).json({ message: capacity.message });
      return;
    }
  }

  if (isDatabaseConnected()) {
    const item = await CartItem.findOneAndUpdate({ ...owner, id: req.params.id }, updates, { new: true }).lean();
    res.json(item || { id: req.params.id, ...updates });
    return;
  }

  memory.cartItems = memory.cartItems.map((item) =>
    ownerMatches(item, owner) && item.id === req.params.id ? { ...item, ...updates } : item
  );
  res.json(memory.cartItems.find((item) => ownerMatches(item, owner) && item.id === req.params.id));
}

export async function removeCartItem(req, res) {
  const owner = cartOwner(req);
  if (isDatabaseConnected()) {
    await CartItem.deleteOne({ ...owner, id: req.params.id });
  } else {
    memory.cartItems = memory.cartItems.filter((item) => !(ownerMatches(item, owner) && item.id === req.params.id));
  }

  res.status(204).end();
}

export async function clearCart(req, res) {
  const owner = cartOwner(req);
  if (isDatabaseConnected()) {
    await CartItem.deleteMany(owner);
  } else {
    memory.cartItems = memory.cartItems.filter((item) => !ownerMatches(item, owner));
  }

  res.status(204).end();
}
