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
