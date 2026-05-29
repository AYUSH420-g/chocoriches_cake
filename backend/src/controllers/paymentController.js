import crypto from "node:crypto";
import Razorpay from "razorpay";
import { config } from "../config/env.js";

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

  const amount = Math.max(100, Math.round(Number(req.body.amount) || 0));
  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt: createRazorpayReceipt(),
    notes: {
      source: "chocoriches",
      ...req.body.notes,
    },
  });

  res.status(201).json({
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: config.razorpayKeyId,
  });
}

export async function verifyRazorpayPayment(req, res) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
  if (!config.razorpayKeySecret) {
    res.status(503).json({ message: "Razorpay is not configured." });
    return;
  }
  
  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", config.razorpayKeySecret)
    .update(sign)
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    res.status(200).json({ message: "Payment verified successfully", verified: true });
  } else {
    res.status(400).json({ message: "Invalid signature sent", verified: false });
  }
}
