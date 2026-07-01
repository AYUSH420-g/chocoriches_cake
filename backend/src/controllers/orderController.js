import { isDatabaseConnected } from "../db.js";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { CartItem } from "../models/CartItem.js";
import { cakeCapacityStatus, isDeliveryDateBlocked, pincodeStatus } from "../services/availabilityService.js";
import { getSiteSetting } from "../services/availabilityService.js";
import { adminOrderView, publicOrderView, todayIso, productPriceForWeight, productId as getProductId } from "../utils/formatters.js";
import { memory } from "../utils/memoryStore.js";
import { sendEmail } from "../utils/email.js";
import { findProductForCart } from "../controllers/productController.js";

function formatPrice(amount) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}

function orderLookupFilter(id) {
  const value = String(id || "").trim();
  if (/^[0-9a-fA-F]{24}$/.test(value)) {
    return { $or: [{ _id: value }, { id: value }] };
  }
  return { id: value };
}

function orderItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter(Boolean)
    .map(item => {
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      return { ...item, quantity: qty };
    });
}

function orderItemCount(items) {
  if (!Array.isArray(items)) {
    return 0;
  }

  return items.reduce((count, item) => {
    if (typeof item === "string") {
      return count + 1;
    }
    return count + Math.max(1, Number(item?.quantity || 1));
  }, 0);
}

export async function createOrder(req, res) {
  const deliveryPincode = String(req.body.deliveryPincode || req.body.pincode || "").trim();
  const deliveryDate = String(req.body.deliveryDate || todayIso()).slice(0, 10);
  const customerName = String(req.body.name || req.body.customerName || req.user?.name || "").trim();
  const customerEmail = String(req.user?.email || req.body.customerEmail || req.body.email || "").trim().toLowerCase();
  const customerPhone = String(req.body.phone || req.body.customerPhone || req.user?.phone || "").trim();
  const deliveryAddress = String(req.body.address || req.body.deliveryAddress || "").trim();
  const deliveryOption = String(req.body.deliveryOption || "pickup").trim().toLowerCase();
  const rawItems = orderItems(req.body.items);
  const itemCount = orderItemCount(req.body.items) || rawItems.length;

  // ── SERVER-SIDE PRICE CALCULATION ──
  // Never trust req.body.total. Recalculate from actual DB prices.
  const owner = customerEmail
    ? { userEmail: customerEmail }
    : { sessionId: String(req.get("x-cart-session") || "guest") };

  // Fetch the user's actual cart from the database
  const cartItems = isDatabaseConnected()
    ? await CartItem.find(owner).lean()
    : memory.cartItems.filter((ci) => Object.entries(owner).every(([k, v]) => String(ci[k] || "") === String(v)));

  // For each cart item, verify price against the Product DB
  let serverTotal = 0;
  const items = [];
  let isStampRewardOrder = false;
  let userRecord = null;
  if (isDatabaseConnected() && customerEmail) {
    userRecord = await User.findOne({ email: customerEmail });
  }

  for (const ci of cartItems) {
    const dbProduct = await findProductForCart(ci.productId);
    let verifiedPrice = dbProduct
      ? productPriceForWeight(dbProduct, ci.size || ci.weight || "")
      : Number(ci.price || 0);

    if (ci.isStampReward && userRecord && userRecord.stampCount >= 5) {
      verifiedPrice = 1;
      isStampRewardOrder = true;
    }

    const qty = Math.max(1, parseInt(ci.quantity, 10) || 1);
    serverTotal += verifiedPrice * qty;
    items.push({
      name: ci.name || (dbProduct ? dbProduct.name : "Cake"),
      quantity: qty,
      size: ci.size || ci.weight || "",
      price: verifiedPrice,
      productId: ci.productId,
      messageOnCake: ci.messageOnCake || "",
      baseFlavour: ci.baseFlavour || "",
      creamFlavour: ci.creamFlavour || "",
      isStampReward: ci.isStampReward || false,
    });
  }

  // If cart was empty in DB, fall back to raw items but still verify each
  if (items.length === 0 && rawItems.length > 0) {
    for (const ri of rawItems) {
      const dbProduct = ri.productId ? await findProductForCart(ri.productId) : null;
      let verifiedPrice = dbProduct
        ? productPriceForWeight(dbProduct, ri.size || "")
        : 0;

      if (ri.isStampReward && userRecord && userRecord.stampCount >= 5) {
        verifiedPrice = 1;
        isStampRewardOrder = true;
      }

      const qty = Math.max(1, parseInt(ri.quantity, 10) || 1);
      serverTotal += verifiedPrice * qty;
      items.push({
        name: ri.name || (dbProduct ? dbProduct.name : "Cake"),
        quantity: qty,
        size: ri.size || "",
        price: verifiedPrice,
        productId: ri.productId || "",
        messageOnCake: ri.messageOnCake || "",
        baseFlavour: ri.baseFlavour || "",
        creamFlavour: ri.creamFlavour || "",
        isStampReward: ri.isStampReward || false,
      });
    }
  }

  const pStatus = await pincodeStatus(deliveryPincode);
  if (!pStatus.serviceable) {
    res.status(422).json({ message: "Delivery is not available for this pincode." });
    return;
  }
  const deliveryFee = deliveryOption === "pickup" ? 0 : (pStatus.deliveryCharge || 0);
  serverTotal += deliveryFee;

  if (!customerEmail) {
    res.status(400).json({ message: "Customer email is required." });
    return;
  }

  if (!items.length) {
    res.status(400).json({ message: "Order must contain at least one product." });
    return;
  }

  if (await isDeliveryDateBlocked(deliveryDate)) {
    res.status(422).json({ message: "Delivery is blocked for the selected date." });
    return;
  }

  const capacity = await cakeCapacityStatus(deliveryDate, itemCount);
  if (!capacity.allowed) {
    res.status(422).json({ message: capacity.message });
    return;
  }

  const order = {
    id: `CR-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date()),
    total: serverTotal,
    status: "Processing",
    items,
    itemCount,
    customerName,
    customerEmail,
    customerPhone,
    deliveryAddress,
    deliveryPincode,
    deliveryDate,
    deliveryTimeSlot: String(req.body.deliveryTimeSlot || "").trim(),
    deliveryOption,
    payment: req.body.payment || {},
    isStampRewardOrder,
  };

  if (isDatabaseConnected()) {
    const created = await Order.create(order);
    
    if (userRecord) {
      if (isStampRewardOrder) {
        userRecord.stampCount = 0;
      } else {
        userRecord.stampCount = Math.min(5, (userRecord.stampCount || 0) + 1);
      }
      await userRecord.save();
    }
    
    const itemDetails = items.map(i => `${i.name || "Cake"} (Qty: ${i.quantity || 1})`).join(", ");
    const adminEmailContent = `
New Order Received!
-------------------
Order ID: ${order.id}
Customer Name: ${customerName}
Customer Email: ${customerEmail}
Customer Phone: ${customerPhone}

Items: ${itemDetails}
Total Price: ${formatPrice(order.total)}
Delivery Option: ${deliveryOption === "delivery" ? "Chocoriches Will Deliver" : "Customer Will Pickup (Near Bikanerwala Nehrunagar)"}
Delivery Date: ${deliveryDate}
Delivery Address: ${deliveryAddress}
Pincode: ${deliveryPincode}
`.trim();

    // Send to admin
    sendEmail({
      to: "99ayushsoni@gmail.com",
      subject: `New Order Alert: ${order.id} - ${formatPrice(order.total)}`,
      text: adminEmailContent
    }).catch(console.error);

    // Send to customer
    sendEmail({
      to: customerEmail,
      subject: `Order Confirmed: ${order.id}`,
      text: `Hi ${customerName},\n\nYour order ${order.id} has been placed successfully for ${formatPrice(order.total)}.\n\nItems: ${itemDetails}`
    }).catch(console.error);
    
    res.status(201).json(publicOrderView(created.toObject()));
    return;
  }

  memory.orders.push(order);
  
  if (customerEmail) {
    const memoryUser = memory.users.find((u) => String(u.email).toLowerCase() === customerEmail.toLowerCase());
    if (memoryUser) {
      if (isStampRewardOrder) {
        memoryUser.stampCount = 0;
      } else {
        memoryUser.stampCount = Math.min(5, (memoryUser.stampCount || 0) + 1);
      }
    }
  }

  const itemDetails = items.map(i => `${i.name || "Cake"} (Qty: ${i.quantity || 1})`).join(", ");
  const adminEmailContent = `
New Order Received!
-------------------
Order ID: ${order.id}
Customer Name: ${customerName}
Customer Email: ${customerEmail}
Customer Phone: ${customerPhone}

Items: ${itemDetails}
Total Price: ${formatPrice(order.total)}
Delivery Option: ${deliveryOption === "delivery" ? "Chocoriches Will Deliver" : "Customer Will Pickup (Near Bikanerwala Nehrunagar)"}
Delivery Date: ${deliveryDate}
Delivery Address: ${deliveryAddress}
Pincode: ${deliveryPincode}
`.trim();

  // Send to admin
  sendEmail({
    to: "99ayushsoni@gmail.com",
    subject: `New Order Alert: ${order.id} - ${formatPrice(order.total)}`,
    text: adminEmailContent
  }).catch(console.error);

  // Send to customer
  sendEmail({
    to: customerEmail,
    subject: `Order Confirmed: ${order.id}`,
    text: `Hi ${customerName},\n\nYour order ${order.id} has been placed successfully for ${formatPrice(order.total)}.\n\nItems: ${itemDetails}`
  }).catch(console.error);

  res.status(201).json(publicOrderView(order));
}

export async function myOrders(req, res) {
  const email = String(req.user.email || "").toLowerCase();
  const orders = isDatabaseConnected()
    ? await Order.find({ customerEmail: email }).sort({ createdAt: -1 }).lean()
    : memory.orders.filter((order) => String(order.customerEmail || "").toLowerCase() === email);

  res.json(orders.map(publicOrderView));
}

export async function allOrders(_req, res) {
  const orders = isDatabaseConnected()
    ? await Order.find({}).sort({ createdAt: -1 }).lean()
    : memory.orders;

  res.json(orders.map(publicOrderView));
}

export async function trackOrder(req, res) {
  const requestedId = String(req.params.id || req.query.orderId || "").trim();
  const order = isDatabaseConnected()
    ? await Order.findOne(orderLookupFilter(requestedId)).lean()
    : memory.orders.find((item) => String(item.id) === requestedId);

  if (!order) {
    res.status(404).json({ message: "Order not found." });
    return;
  }

  const requestedEmail = String(req.query.email || "").trim().toLowerCase();
  const safeOrder = publicOrderView(order);
  if (requestedEmail && safeOrder.customerEmail.toLowerCase() !== requestedEmail) {
    res.status(404).json({ message: "Order not found for this email." });
    return;
  }

  res.json(safeOrder);
}

export async function updateOrder(req, res) {
  if (isDatabaseConnected()) {
    const order = await Order.findOneAndUpdate(orderLookupFilter(req.params.id), req.body, { new: true }).lean();
    if (!order) {
      res.status(404).json({ message: "Order not found." });
      return;
    }
    res.json(adminOrderView(order));
    return;
  }

  let updatedOrder = null;
  memory.orders = memory.orders.map((order) => {
    if (String(order.id) !== String(req.params.id)) {
      return order;
    }
    updatedOrder = { ...order, ...req.body };
    return updatedOrder;
  });

  if (!updatedOrder) {
    res.status(404).json({ message: "Order not found." });
    return;
  }

  res.json(adminOrderView(updatedOrder));
}

export async function adminOrders(_req, res) {
  const orders = isDatabaseConnected()
    ? await Order.find({}).sort({ createdAt: -1 }).lean()
    : memory.orders;

  res.json(orders.map(adminOrderView));
}
