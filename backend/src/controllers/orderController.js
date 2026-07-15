import crypto from "node:crypto";
import { config } from "../config/env.js";
import { isDatabaseConnected } from "../db.js";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { CartItem } from "../models/CartItem.js";
import { cakeCapacityStatus, isDeliveryDateBlocked } from "../services/availabilityService.js";
import { calculateCheckout } from "../services/checkoutService.js";
import { adminOrderView, publicOrderView, todayIso } from "../utils/formatters.js";
import { memory } from "../utils/memoryStore.js";
import { sendEmail } from "../utils/email.js";
import { verifyPaymentForCheckout } from "./paymentController.js";

function formatPrice(amount) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}

function orderLookupFilter(id) {
  const value = String(id || "").trim().slice(0, 100);
  if (/^[0-9a-fA-F]{24}$/.test(value)) {
    return { $or: [{ _id: value }, { id: value }] };
  }
  return { id: value };
}

const DELIVERY_SLOTS = new Set([
  "12:00 PM - 02:00 PM",
  "03:00 PM - 06:00 PM",
  "07:00 PM - 10:00 PM",
  "11:15 PM - 11:45 PM",
]);

function indiaHour() {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
}

function createPublicOrderId() {
  return `CR-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
}

export async function approvePendingOrder(orderDocument, paymentDetails) {
  if (orderDocument.status !== "Pending Payment") return orderDocument;

  orderDocument.status = "Processing";
  orderDocument.payment = paymentDetails;

  const customerEmail = String(orderDocument.customerEmail || "").toLowerCase();

  if (isDatabaseConnected()) {
    const session = await Order.startSession();
    try {
      await session.withTransaction(async () => {
        if (orderDocument.isStampRewardOrder) {
          const rewardClaim = await User.updateOne(
            { email: customerEmail, stampCount: { $gte: 5 } },
            { $set: { stampCount: 0 } },
            { session }
          );
          if (rewardClaim.modifiedCount !== 1) {
             // If reward claim fails, we just proceed but log it. The order is already paid.
             console.warn("Failed to claim stamp reward for order", orderDocument.id);
          }
        } else {
          await User.updateOne(
            { email: customerEmail },
            [{ $set: { stampCount: { $min: [5, { $add: [{ $ifNull: ["$stampCount", 0] }, 1] }] } } }],
            { session }
          );
        }
        await orderDocument.save({ session });
        await CartItem.deleteMany({ userEmail: customerEmail }, { session });
      });
    } finally {
      await session.endSession();
    }
  } else {
    memory.cartItems = memory.cartItems.filter((item) => String(item.userEmail || "").toLowerCase() !== customerEmail);
    const memoryUser = memory.users.find((u) => String(u.email).toLowerCase() === customerEmail);
    if (memoryUser) {
      memoryUser.stampCount = orderDocument.isStampRewardOrder ? 0 : Math.min(5, Number(memoryUser.stampCount || 0) + 1);
    }
  }

  const itemDetails = orderDocument.items.map(i => `${i.name || "Cake"} (Qty: ${i.quantity || 1})`).join(", ");
  const adminEmailContent = `
New Order Received!
-------------------
Order ID: ${orderDocument.id}
Customer Name: ${orderDocument.customerName}
Customer Email: ${orderDocument.customerEmail}
Customer Phone: ${orderDocument.customerPhone}

Items: ${itemDetails}
Total Price: ${formatPrice(orderDocument.total)}
Delivery Option: ${orderDocument.deliveryOption === "delivery" ? "Chocoriches Will Deliver" : "Customer Will Pickup (Near Bikanerwala Nehrunagar)"}
Delivery Date: ${orderDocument.deliveryDate}
Delivery Address: ${orderDocument.deliveryAddress}
Pincode: ${orderDocument.deliveryPincode}
`.trim();

  // Send to admin
  sendEmail({
    to: config.adminSeed.email,
    subject: `New Order Alert: ${orderDocument.id} - ${formatPrice(orderDocument.total)}`,
    text: adminEmailContent
  }).catch(console.error);

  // Send to customer
  sendEmail({
    to: customerEmail,
    subject: `Order Confirmed: ${orderDocument.id}`,
    text: `Hi ${orderDocument.customerName},\n\nYour order ${orderDocument.id} has been placed successfully for ${formatPrice(orderDocument.total)}.\n\nItems: ${itemDetails}`
  }).catch(console.error);

  return orderDocument;
}

export async function createOrder(req, res) {
  const customerEmail = String(req.user.email || "").trim().toLowerCase();
  
  const requestedPaymentId = String(req.body.payment?.razorpay_payment_id || "").trim().slice(0, 100);
  const requestedOrderId = String(req.body.payment?.razorpay_order_id || "").trim().slice(0, 100);
  
  if (!requestedPaymentId || !requestedOrderId) {
    res.status(400).json({ message: "Payment details are required." });
    return;
  }

  let order = isDatabaseConnected()
    ? await Order.findOne({ "payment.razorpayOrderId": requestedOrderId })
    : memory.orders.find((item) => item.payment?.razorpayOrderId === requestedOrderId);

  if (!order) {
    res.status(404).json({ message: "Pending order not found. Please try again." });
    return;
  }

  if (String(order.customerEmail).toLowerCase() !== customerEmail) {
    res.status(403).json({ message: "Not authorized for this order." });
    return;
  }

  if (order.status !== "Pending Payment") {
     // Order is already processed (e.g. by webhook)
     res.status(200).json(publicOrderView(order.toObject ? order.toObject() : order));
     return;
  }

  const verifiedPayment = await verifyPaymentForCheckout({
    payment: req.body.payment,
    expectedAmountPaise: Math.round(order.total * 100),
    user: req.user,
  });

  const updatedOrder = await approvePendingOrder(order, verifiedPayment);
  res.status(200).json(publicOrderView(updatedOrder.toObject ? updatedOrder.toObject() : updatedOrder));
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

  const requestedEmail = String(req.user?.email || req.query.email || "").trim().toLowerCase().slice(0, 254);
  if (!requestedEmail) {
    res.status(400).json({ message: "Order email is required." });
    return;
  }
  const safeOrder = publicOrderView(order);
  if (safeOrder.customerEmail.toLowerCase() !== requestedEmail) {
    res.status(404).json({ message: "Order not found for this email." });
    return;
  }

  res.json(safeOrder);
}

export async function updateOrder(req, res) {
  const allowedStatuses = ["Processing", "Packed", "Out For Delivery", "Delivered", "Cancelled"];
  const updates = {};
  if (req.body.status !== undefined) {
    if (!allowedStatuses.includes(req.body.status)) {
      res.status(400).json({ message: "Invalid order status." });
      return;
    }
    updates.status = req.body.status;
  }
  if (req.body.cancelReason !== undefined) updates.cancelReason = String(req.body.cancelReason).trim().slice(0, 300);
  if (!Object.keys(updates).length) {
    res.status(400).json({ message: "No valid order updates provided." });
    return;
  }

  if (isDatabaseConnected()) {
    const order = await Order.findOneAndUpdate(orderLookupFilter(req.params.id), updates, { new: true, runValidators: true }).lean();
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
    updatedOrder = { ...order, ...updates };
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
