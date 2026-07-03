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

export async function createOrder(req, res) {
  const customerEmail = String(req.user.email || "").trim().toLowerCase();
  const customerName = String(req.body.name || req.user.name || "").trim().slice(0, 100);
  const customerPhone = String(req.body.phone || req.user.phone || "").replace(/\D/g, "").slice(0, 15);
  const deliveryAddress = String(req.body.address || "").trim().slice(0, 500);
  const deliveryDate = String(req.body.deliveryDate || "").slice(0, 10);
  const deliveryTimeSlot = String(req.body.deliveryTimeSlot || "").trim();

  if (!customerName || customerPhone.length < 7 || !deliveryAddress) {
    res.status(400).json({ message: "Valid customer name, phone, and address are required." });
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate) || deliveryDate < todayIso()) {
    res.status(422).json({ message: "Please select a valid future delivery date." });
    return;
  }
  if (!DELIVERY_SLOTS.has(deliveryTimeSlot)) {
    res.status(422).json({ message: "Please select a valid delivery time slot." });
    return;
  }

  // Return a customer's already-created order before reading their now-cleared
  // cart. This makes payment callbacks safely idempotent without allowing a
  // payment ID to be reused by another account.
  const requestedPaymentId = String(req.body.payment?.razorpay_payment_id || "").trim().slice(0, 100);
  if (requestedPaymentId) {
    const existingOrder = isDatabaseConnected()
      ? await Order.findOne({ "payment.razorpayPaymentId": requestedPaymentId }).lean()
      : memory.orders.find((item) => item.payment?.razorpayPaymentId === requestedPaymentId);
    if (existingOrder) {
      if (String(existingOrder.customerEmail).toLowerCase() !== customerEmail) {
        res.status(409).json({ message: "This payment has already been used." });
        return;
      }
      res.status(200).json(publicOrderView(existingOrder));
      return;
    }
  }

  const checkout = await calculateCheckout({
    user: req.user,
    deliveryPincode: req.body.deliveryPincode,
    deliveryOption: req.body.deliveryOption,
    deliveryDate,
  });

  if (deliveryDate === todayIso() && (!checkout.allSameDayEligible || indiaHour() < 6 || indiaHour() >= 18)) {
    res.status(422).json({ message: "One or more cart items are not eligible for same-day delivery." });
    return;
  }

  if (await isDeliveryDateBlocked(deliveryDate)) {
    res.status(422).json({ message: "Delivery is blocked for the selected date." });
    return;
  }

  const capacity = await cakeCapacityStatus(deliveryDate, checkout.itemCount);
  if (!capacity.allowed) {
    res.status(422).json({ message: capacity.message });
    return;
  }

  const verifiedPayment = await verifyPaymentForCheckout({
    payment: req.body.payment,
    expectedAmountPaise: checkout.totalPaise,
    user: req.user,
  });

  const order = {
    id: createPublicOrderId(),
    date: new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date()),
    total: checkout.total,
    status: "Processing",
    items: checkout.items,
    itemCount: checkout.itemCount,
    customerName,
    customerEmail,
    customerPhone,
    deliveryAddress,
    deliveryPincode: checkout.deliveryPincode,
    deliveryDate,
    deliveryTimeSlot,
    deliveryOption: checkout.deliveryOption,
    payment: verifiedPayment,
    isStampRewardOrder: checkout.isStampRewardOrder,
  };

  if (isDatabaseConnected()) {
    const session = await Order.startSession();
    let created;
    try {
      await session.withTransaction(async () => {
        if (checkout.isStampRewardOrder) {
          const rewardClaim = await User.updateOne(
            { email: customerEmail, stampCount: { $gte: 5 } },
            { $set: { stampCount: 0 } },
            { session }
          );
          if (rewardClaim.modifiedCount !== 1) {
            const error = new Error("This loyalty reward has already been used.");
            error.statusCode = 409;
            throw error;
          }
        } else {
          await User.updateOne(
            { email: customerEmail },
            [{ $set: { stampCount: { $min: [5, { $add: [{ $ifNull: ["$stampCount", 0] }, 1] }] } } }],
            { session }
          );
        }
        [created] = await Order.create([order], { session });
        await CartItem.deleteMany({ userEmail: customerEmail }, { session });
      });
    } catch (error) {
      if (error?.code === 11000 && requestedPaymentId) {
        const duplicate = await Order.findOne({ "payment.razorpayPaymentId": requestedPaymentId }).lean();
        if (duplicate && String(duplicate.customerEmail).toLowerCase() === customerEmail) {
          res.status(200).json(publicOrderView(duplicate));
          return;
        }
      }
      throw error;
    } finally {
      await session.endSession();
    }
    
    const itemDetails = checkout.items.map(i => `${i.name || "Cake"} (Qty: ${i.quantity || 1})`).join(", ");
    const adminEmailContent = `
New Order Received!
-------------------
Order ID: ${order.id}
Customer Name: ${customerName}
Customer Email: ${customerEmail}
Customer Phone: ${customerPhone}

Items: ${itemDetails}
Total Price: ${formatPrice(order.total)}
Delivery Option: ${checkout.deliveryOption === "delivery" ? "Chocoriches Will Deliver" : "Customer Will Pickup (Near Bikanerwala Nehrunagar)"}
Delivery Date: ${deliveryDate}
Delivery Address: ${deliveryAddress}
Pincode: ${checkout.deliveryPincode}
`.trim();

    // Send to admin
    sendEmail({
      to: config.adminSeed.email,
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
  memory.cartItems = memory.cartItems.filter((item) => String(item.userEmail || "").toLowerCase() !== customerEmail);
  const memoryUser = memory.users.find((u) => String(u.email).toLowerCase() === customerEmail);
  if (memoryUser) {
    memoryUser.stampCount = checkout.isStampRewardOrder ? 0 : Math.min(5, Number(memoryUser.stampCount || 0) + 1);
  }

  const itemDetails = checkout.items.map(i => `${i.name || "Cake"} (Qty: ${i.quantity || 1})`).join(", ");
  const adminEmailContent = `
New Order Received!
-------------------
Order ID: ${order.id}
Customer Name: ${customerName}
Customer Email: ${customerEmail}
Customer Phone: ${customerPhone}

Items: ${itemDetails}
Total Price: ${formatPrice(order.total)}
Delivery Option: ${checkout.deliveryOption === "delivery" ? "Chocoriches Will Deliver" : "Customer Will Pickup (Near Bikanerwala Nehrunagar)"}
Delivery Date: ${deliveryDate}
Delivery Address: ${deliveryAddress}
Pincode: ${checkout.deliveryPincode}
`.trim();

  // Send to admin
  sendEmail({
    to: config.adminSeed.email,
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
