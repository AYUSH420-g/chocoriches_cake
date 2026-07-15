import crypto from "node:crypto";
import Razorpay from "razorpay";
import { config } from "../config/env.js";
import { isDatabaseConnected } from "../db.js";
import { Order } from "../models/Order.js";
import { memory } from "../utils/memoryStore.js";
import { calculateCheckout } from "../services/checkoutService.js";

function razorpayClient() {
  if (!config.razorpayKeyId || !config.razorpayKeySecret) {
    return null;
  }

  return new Razorpay({
    key_id: config.razorpayKeyId,
    key_secret: config.razorpayKeySecret,
  });
}

function createRazorpayReceipt() {
  return `cr_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
}

function createPublicOrderId() {
  return `CR-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
}

export function razorpayConfig(_req, res) {
  res.json({ keyId: config.razorpayKeyId, currency: "INR" });
}

export async function createRazorpayOrder(req, res) {
  const razorpay = razorpayClient();
  if (!razorpay) {
    res.status(503).json({ message: "Razorpay is not configured." });
    return;
  }

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

  const checkout = await calculateCheckout({
    user: req.user,
    deliveryPincode: req.body.deliveryPincode,
    deliveryOption: req.body.deliveryOption,
    deliveryDate: deliveryDate,
  });
  if (checkout.totalPaise < 100) {
    res.status(422).json({ message: "Order total must be at least ₹1." });
    return;
  }

  const razorpayOrder = await razorpay.orders.create({
    amount: checkout.totalPaise,
    currency: "INR",
    receipt: createRazorpayReceipt(),
    notes: {
      source: "chocoriches",
      customerId: String(req.user._id || req.user.id || req.user.email),
    },
  });

  const order = {
    id: createPublicOrderId(),
    date: new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date()),
    total: checkout.total,
    status: "Pending Payment",
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
    payment: {
      razorpayOrderId: razorpayOrder.id,
    },
    isStampRewardOrder: checkout.isStampRewardOrder,
  };

  if (isDatabaseConnected()) {
    await Order.create(order);
  } else {
    memory.orders.push(order);
  }

  res.status(201).json({
    id: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: config.razorpayKeyId,
  });
}

function signaturesMatch(received, expected) {
  const receivedBuffer = Buffer.from(String(received || ""));
  const expectedBuffer = Buffer.from(String(expected || ""));
  return receivedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

export async function verifyPaymentForCheckout({ payment, expectedAmountPaise, user }) {
  const razorpay = razorpayClient();
  if (!razorpay) {
    const error = new Error("Razorpay is not configured.");
    error.statusCode = 503;
    throw error;
  }

  const orderId = String(payment?.razorpay_order_id || "").slice(0, 100);
  const paymentId = String(payment?.razorpay_payment_id || "").slice(0, 100);
  const signature = String(payment?.razorpay_signature || "").slice(0, 256);
  if (!/^order_[A-Za-z0-9]+$/.test(orderId) || !/^pay_[A-Za-z0-9]+$/.test(paymentId) || !signature) {
    const error = new Error("Valid Razorpay payment details are required.");
    error.statusCode = 402;
    throw error;
  }

  const expectedSignature = crypto
    .createHmac("sha256", config.razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  if (!signaturesMatch(signature, expectedSignature)) {
    const error = new Error("Payment signature verification failed.");
    error.statusCode = 402;
    throw error;
  }

  const [razorpayOrder, razorpayPayment] = await Promise.all([
    razorpay.orders.fetch(orderId),
    razorpay.payments.fetch(paymentId),
  ]);
  const expectedCustomerId = String(user._id || user.id || user.email);
  const valid = Number(razorpayOrder.amount) === Number(expectedAmountPaise)
    && razorpayOrder.currency === "INR"
    && razorpayOrder.notes?.source === "chocoriches"
    && String(razorpayOrder.notes?.customerId || "") === expectedCustomerId
    && razorpayPayment.order_id === orderId
    && Number(razorpayPayment.amount) === Number(expectedAmountPaise)
    && razorpayPayment.currency === "INR"
    && razorpayPayment.status === "captured";
  if (!valid) {
    const error = new Error("Payment amount or status could not be verified.");
    error.statusCode = 402;
    throw error;
  }

  return {
    mode: "razorpay",
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    status: razorpayPayment.status,
    verifiedAt: new Date().toISOString(),
  };
}

export async function verifyRazorpayPayment(req, res) {
  const checkout = await calculateCheckout({
    user: req.user,
    deliveryPincode: req.body.deliveryPincode,
    deliveryOption: req.body.deliveryOption,
    deliveryDate: req.body.deliveryDate,
  });
  await verifyPaymentForCheckout({ payment: req.body, expectedAmountPaise: checkout.totalPaise, user: req.user });
  res.status(200).json({ message: "Payment verified successfully", verified: true });
}

export async function razorpayWebhook(req, res) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = String(req.headers["x-razorpay-signature"] || "").slice(0, 256);

  if (!secret) {
    res.status(503).json({ message: "Webhook is not configured." });
    return;
  }
  if (!signature || !req.rawBody) {
    res.status(400).json({ message: "Missing signature or raw body" });
    return;
  }
  
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.rawBody)
      .digest("hex");
      
    if (!signaturesMatch(signature, expectedSignature)) {
      res.status(400).json({ message: "Invalid signature" });
      return;
    }
    
    const event = req.body.event;
    console.log(`[Webhook] Received Razorpay Event: ${event}`);

    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = req.body.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      
      const order = isDatabaseConnected() 
        ? await Order.findOne({ "payment.razorpayOrderId": razorpayOrderId })
        : memory.orders.find(o => o.payment?.razorpayOrderId === razorpayOrderId);

      if (order && order.status === "Pending Payment") {
        const { approvePendingOrder } = await import("./orderController.js");
        await approvePendingOrder(order, {
          mode: "razorpay",
          razorpayOrderId: paymentEntity.order_id,
          razorpayPaymentId: paymentEntity.id,
          status: paymentEntity.status,
          verifiedAt: new Date().toISOString(),
        });
        console.log(`[Webhook] Approved pending order ${order.id}`);
      }
    }
    
    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
