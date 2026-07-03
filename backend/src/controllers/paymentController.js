import crypto from "node:crypto";
import Razorpay from "razorpay";
import { config } from "../config/env.js";
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

export function razorpayConfig(_req, res) {
  res.json({ keyId: config.razorpayKeyId, currency: "INR" });
}

export async function createRazorpayOrder(req, res) {
  const razorpay = razorpayClient();
  if (!razorpay) {
    res.status(503).json({ message: "Razorpay is not configured." });
    return;
  }

  const checkout = await calculateCheckout({
    user: req.user,
    deliveryPincode: req.body.deliveryPincode,
    deliveryOption: req.body.deliveryOption,
    deliveryDate: req.body.deliveryDate,
  });
  if (checkout.totalPaise < 100) {
    res.status(422).json({ message: "Order total must be at least ₹1." });
    return;
  }

  const order = await razorpay.orders.create({
    amount: checkout.totalPaise,
    currency: "INR",
    receipt: createRazorpayReceipt(),
    notes: {
      source: "chocoriches",
      customerId: String(req.user._id || req.user.id || req.user.email),
    },
  });

  res.status(201).json({
    id: order.id,
    amount: order.amount,
    currency: order.currency,
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
    
    // Process webhook event safely (e.g. update order status)
    const event = req.body.event;
    console.log(`[Webhook] Received Razorpay Event: ${event}`);
    
    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
