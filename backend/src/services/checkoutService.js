import { isDatabaseConnected } from "../db.js";
import { CartItem } from "../models/CartItem.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { productId, productPriceForWeight } from "../utils/formatters.js";
import { memory } from "../utils/memoryStore.js";
import { pincodeStatus } from "./availabilityService.js";

function checkoutError(message, statusCode = 422) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function productForCartItem(cartItem) {
  const requestedId = String(cartItem.productId || "");
  if (isDatabaseConnected()) {
    return Product.findOne({
      isActive: { $ne: false },
      $or: [{ id: requestedId }, ...(requestedId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: requestedId }] : [])],
    }).lean();
  }
  return memory.products.find((product) => productId(product) === requestedId && product.isActive !== false) || null;
}

export async function calculateCheckout({ user, deliveryPincode, deliveryOption = "pickup", deliveryDate = "" }) {
  const userEmail = String(user?.email || "").trim().toLowerCase();
  if (!userEmail) throw checkoutError("Please login to continue.", 401);

  const normalizedPincode = String(deliveryPincode || "").replace(/\D/g, "").slice(0, 6);
  if (normalizedPincode.length !== 6) throw checkoutError("A valid 6-digit pincode is required.", 400);

  const normalizedDeliveryOption = String(deliveryOption || "pickup").trim().toLowerCase();
  if (!["pickup", "delivery"].includes(normalizedDeliveryOption)) {
    throw checkoutError("Invalid delivery option.", 400);
  }

  const cartItems = isDatabaseConnected()
    ? await CartItem.find({ userEmail }).sort({ createdAt: 1 }).lean()
    : memory.cartItems.filter((item) => String(item.userEmail || "").toLowerCase() === userEmail);
  if (!cartItems.length) throw checkoutError("Your cart is empty.", 400);
  const normalizedDeliveryDate = String(deliveryDate || "").slice(0, 10);
  if (normalizedDeliveryDate && cartItems.some((item) => item.deliveryDate && item.deliveryDate !== normalizedDeliveryDate)) {
    throw checkoutError("All cart items must use the selected delivery date.");
  }
  if (cartItems.filter((item) => item.isStampReward).length > 1) {
    throw checkoutError("Only one loyalty reward can be used per order.");
  }

  const userRecord = isDatabaseConnected()
    ? await User.findOne({ email: userEmail }).lean()
    : memory.users.find((item) => String(item.email || "").toLowerCase() === userEmail);

  let subtotal = 0;
  let isStampRewardOrder = false;
  let allSameDayEligible = true;
  const items = [];

  for (const cartItem of cartItems) {
    const product = await productForCartItem(cartItem);
    if (!product) throw checkoutError("A product in your cart is no longer available.");

    const quantity = Number(cartItem.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9) {
      throw checkoutError("Cart quantities must be between 1 and 9.");
    }

    let price = productPriceForWeight(product, cartItem.size || cartItem.weight || "");
    if (cartItem.isStampReward) {
      if (!userRecord || Number(userRecord.stampCount || 0) < 5) {
        throw checkoutError("This loyalty reward is no longer available.");
      }
      price = 1;
      isStampRewardOrder = true;
    } else if (cartItem.isFreePromo) {
      price = 0;
    }

    subtotal += price * quantity;
    allSameDayEligible = allSameDayEligible && Boolean(product.sameDayDelivery);
    items.push({
      name: product.name,
      quantity,
      size: cartItem.size || cartItem.weight || "",
      price,
      productId: productId(product),
      messageOnCake: String(cartItem.messageOnCake || "").slice(0, 30),
      baseFlavour: String(cartItem.baseFlavour || "").slice(0, 80),
      creamFlavour: String(cartItem.creamFlavour || "").slice(0, 80),
      isStampReward: Boolean(cartItem.isStampReward),
      isFreePromo: Boolean(cartItem.isFreePromo),
    });
  }

  const service = await pincodeStatus(normalizedPincode);
  if (!service.serviceable) throw checkoutError("Delivery is not available for this pincode.");

  const deliveryFee = normalizedDeliveryOption === "delivery" ? Number(service.deliveryCharge || 0) : 0;
  const total = subtotal + deliveryFee;

  return {
    cartItems,
    allSameDayEligible,
    deliveryFee,
    deliveryOption: normalizedDeliveryOption,
    deliveryPincode: normalizedPincode,
    isStampRewardOrder,
    itemCount: items.reduce((count, item) => count + item.quantity, 0),
    items,
    subtotal,
    total,
    totalPaise: Math.round(total * 100),
    userRecord,
  };
}
