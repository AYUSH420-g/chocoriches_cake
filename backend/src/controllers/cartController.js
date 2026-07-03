import crypto from "node:crypto";
import { isDatabaseConnected } from "../db.js";
import { CartItem } from "../models/CartItem.js";
import { User } from "../models/User.js";
import { cakeCapacityStatus } from "../services/availabilityService.js";
import { productId, todayIso } from "../utils/formatters.js";
import { memory } from "../utils/memoryStore.js";
import { findProductForCart, productCartSnapshot } from "./productController.js";

function cartOwner(req) {
  const userEmail = String(req.user?.email || "").trim().toLowerCase();
  if (userEmail) {
    return { userEmail };
  }

  const sessionId = String(req.get("x-cart-session") || "").trim();
  return /^[A-Za-z0-9-]{16,100}$/.test(sessionId) ? { sessionId } : null;
}

function cartOwnerOrError(req, res) {
  const owner = cartOwner(req);
  if (!owner) res.status(400).json({ message: "A valid cart session is required." });
  return owner;
}

function ownerMatches(item, owner) {
  return Object.entries(owner).every(([key, value]) => String(item[key] || "") === String(value));
}

async function ownerCartQuantity(owner, requestedDate) {
  const cartItems = isDatabaseConnected()
    ? await CartItem.find(owner).lean()
    : memory.cartItems.filter((item) => ownerMatches(item, owner));

  return cartItems.reduce((count, item) => {
    const itemDate = item.deliveryDate || todayIso();
    if (requestedDate && itemDate !== requestedDate) return count;
    return count + Number(item.quantity || 0);
  }, 0);
}

export async function getCart(req, res) {
  const owner = cartOwner(req);
  if (!owner) {
    res.status(400).json({ message: "A valid cart session is required." });
    return;
  }
  const cartItems = isDatabaseConnected()
    ? await CartItem.find(owner).sort({ createdAt: 1 }).lean()
    : memory.cartItems.filter((item) => ownerMatches(item, owner));

  res.json(cartItems.map(({ _id, __v, createdAt, updatedAt, ...item }) => item));
}

export async function addCartItem(req, res) {
  const { productId: productIdValue, size = "6 Inch (Serves 8-10)", quantity = 1, baseFlavour, creamFlavour, deliveryDate, isStampReward = false } = req.body;
  const product = await findProductForCart(productIdValue);
  if (!product) {
    res.status(404).json({ message: "Product not found." });
    return;
  }

  const requestedProductId = productId(product);
  const requestedSize = String(size || "Half Kg").trim().slice(0, 50);
  const normalizedBaseFlavour = String(baseFlavour || "").slice(0, 80);
  const normalizedCreamFlavour = String(creamFlavour || "").slice(0, 80);
  const rewardRequested = isStampReward === true;
  const parsedQuantity = Number(quantity);
  if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 9) {
    res.status(400).json({ message: "Quantity must be between 1 and 9." });
    return;
  }
  const nextQuantity = rewardRequested ? 1 : parsedQuantity;
  const owner = cartOwnerOrError(req, res);
  if (!owner) return;
  const requestedDate = String(deliveryDate || "").slice(0, 10);
  const today = todayIso();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate) || requestedDate < today) {
    res.status(422).json({ message: "Please select a valid delivery date." });
    return;
  }
  if (requestedDate === today && !product.sameDayDelivery) {
    res.status(422).json({ message: "This product is available from tomorrow." });
    return;
  }
  const currentIndiaHour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
  if (requestedDate === today && (currentIndiaHour < 6 || currentIndiaHour >= 18)) {
    res.status(422).json({ message: "Same-day ordering is available between 6:00 AM and 6:00 PM." });
    return;
  }

  // Prevent adding more than 1 stamp reward item
  if (rewardRequested) {
    if (!req.user) {
      res.status(401).json({ message: "Please login to redeem a loyalty reward." });
      return;
    }
    const rewardUser = isDatabaseConnected()
      ? await User.findOne({ email: req.user.email }).lean()
      : memory.users.find((item) => item.email === req.user.email);
    if (Number(rewardUser?.stampCount || 0) < 5) {
      res.status(403).json({ message: "Five stamps are required to redeem this reward." });
      return;
    }
    const existingCartItems = isDatabaseConnected()
      ? await CartItem.find(owner).lean()
      : memory.cartItems.filter((item) => ownerMatches(item, owner));
    const hasExistingReward = existingCartItems.some((item) => item.isStampReward);
    if (hasExistingReward) {
      res.status(422).json({ message: "You can only add one reward item." });
      return;
    }
  }

  const capacity = await cakeCapacityStatus(requestedDate, nextQuantity, await ownerCartQuantity(owner, requestedDate));
  if (!capacity.allowed) {
    res.status(422).json({ message: capacity.message });
    return;
  }

  if (isDatabaseConnected()) {
    const existingItem = await CartItem.findOne({ ...owner, productId: requestedProductId, size: requestedSize, baseFlavour: normalizedBaseFlavour, creamFlavour: normalizedCreamFlavour, deliveryDate: requestedDate, isStampReward: rewardRequested });
    if (existingItem) {
      if (!rewardRequested && existingItem.quantity + nextQuantity > 9) {
        res.status(400).json({ message: "Quantity must be between 1 and 9." });
        return;
      }
      Object.assign(existingItem, productCartSnapshot(product, requestedSize), { weight: requestedSize, baseFlavour: normalizedBaseFlavour, creamFlavour: normalizedCreamFlavour });
      if (rewardRequested) {
        existingItem.quantity = 1;
        existingItem.price = 1;
      } else {
        existingItem.quantity += nextQuantity;
      }
      await existingItem.save();
      res.status(200).json(existingItem.toObject());
      return;
    }
  } else {
    const existingItem = memory.cartItems.find(
      (item) => ownerMatches(item, owner) && String(item.productId || item.id) === requestedProductId && item.size === requestedSize && item.baseFlavour === normalizedBaseFlavour && item.creamFlavour === normalizedCreamFlavour && item.deliveryDate === requestedDate && item.isStampReward === rewardRequested
    );
    if (existingItem) {
      if (!rewardRequested && existingItem.quantity + nextQuantity > 9) {
        res.status(400).json({ message: "Quantity must be between 1 and 9." });
        return;
      }
      Object.assign(existingItem, productCartSnapshot(product, requestedSize), { weight: requestedSize, baseFlavour: normalizedBaseFlavour, creamFlavour: normalizedCreamFlavour });
      if (rewardRequested) {
        existingItem.quantity = 1;
        existingItem.price = 1;
      } else {
        existingItem.quantity += nextQuantity;
      }
      res.status(200).json(existingItem);
      return;
    }
  }

  const snapshot = productCartSnapshot(product, requestedSize);
  const item = {
    id: crypto.randomUUID(),
    productId: requestedProductId,
    ...owner,
    ...snapshot,
    price: rewardRequested ? 1 : snapshot.price,
    size: requestedSize,
    weight: requestedSize,
    quantity: nextQuantity,
    baseFlavour: normalizedBaseFlavour,
    creamFlavour: normalizedCreamFlavour,
    deliveryDate: requestedDate,
    isStampReward: rewardRequested,
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
  if (req.body.quantity !== undefined) {
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9) {
      res.status(400).json({ message: "Quantity must be between 1 and 9." });
      return;
    }
    updates.quantity = quantity;
  }
  if (req.body.messageOnCake !== undefined) updates.messageOnCake = String(req.body.messageOnCake).slice(0, 30);
  if (req.body.deliveryDate !== undefined) {
    const deliveryDate = String(req.body.deliveryDate).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate) || deliveryDate < todayIso()) {
      res.status(422).json({ message: "Please select a valid delivery date." });
      return;
    }
    updates.deliveryDate = deliveryDate;
  }

  const owner = cartOwnerOrError(req, res);
  if (!owner) return;
  const cartItems = isDatabaseConnected()
    ? await CartItem.find(owner).lean()
    : memory.cartItems.filter((item) => ownerMatches(item, owner));
  const currentItem = cartItems.find((item) => item.id === req.params.id);
  if (!currentItem) {
    res.status(404).json({ message: "Cart item not found." });
    return;
  }
  if (updates.deliveryDate === todayIso() && !currentItem.sameDayDelivery) {
    res.status(422).json({ message: "This product is available from tomorrow." });
    return;
  }
  
  if (updates.quantity && currentItem) {
    // Stamp reward items are locked at quantity 1
    if (currentItem.isStampReward) {
      updates.quantity = 1;
    }
    const requestedDate = updates.deliveryDate || currentItem.deliveryDate || todayIso();
    // only count reserved quantity for the same date!
    const reservedQuantity = cartItems.reduce((count, item) => count + ((item.id === req.params.id || item.deliveryDate !== requestedDate) ? 0 : Number(item.quantity || 0)), 0);
    const capacity = await cakeCapacityStatus(requestedDate, updates.quantity, reservedQuantity);
    if (currentItem && !capacity.allowed) {
      res.status(422).json({ message: capacity.message });
      return;
    }
  }

  if (isDatabaseConnected()) {
    const item = await CartItem.findOneAndUpdate({ ...owner, id: req.params.id }, updates, { new: true }).lean();
    if (!item) {
      res.status(404).json({ message: "Cart item not found." });
      return;
    }
    res.json(item);
    return;
  }

  memory.cartItems = memory.cartItems.map((item) =>
    ownerMatches(item, owner) && item.id === req.params.id ? { ...item, ...updates } : item
  );
  res.json(memory.cartItems.find((item) => ownerMatches(item, owner) && item.id === req.params.id));
}

export async function removeCartItem(req, res) {
  const owner = cartOwnerOrError(req, res);
  if (!owner) return;
  if (isDatabaseConnected()) {
    await CartItem.deleteOne({ ...owner, id: req.params.id });
  } else {
    memory.cartItems = memory.cartItems.filter((item) => !(ownerMatches(item, owner) && item.id === req.params.id));
  }

  res.status(204).end();
}

export async function clearCart(req, res) {
  const owner = cartOwnerOrError(req, res);
  if (!owner) return;
  if (isDatabaseConnected()) {
    await CartItem.deleteMany(owner);
  } else {
    memory.cartItems = memory.cartItems.filter((item) => !ownerMatches(item, owner));
  }

  res.status(204).end();
}
