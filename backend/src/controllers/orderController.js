import { isDatabaseConnected } from "../db.js";
import { Order } from "../models/Order.js";
import { cakeCapacityStatus, isDeliveryDateBlocked, isPincodeServiceable } from "../services/availabilityService.js";
import { adminOrderView, publicOrderView, todayIso } from "../utils/formatters.js";
import { memory } from "../utils/memoryStore.js";

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
    .map((item) => (typeof item === "string" ? item : item?.name))
    .filter(Boolean);
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
  const items = orderItems(req.body.items);
  const itemCount = orderItemCount(req.body.items) || items.length;

  if (!customerEmail) {
    res.status(400).json({ message: "Customer email is required." });
    return;
  }

  if (!items.length) {
    res.status(400).json({ message: "Order must contain at least one product." });
    return;
  }

  if (!(await isPincodeServiceable(deliveryPincode))) {
    res.status(422).json({ message: "Delivery is not available for this pincode." });
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
    total: Number(req.body.total) || 0,
    status: "Processing",
    items,
    itemCount,
    customerName,
    customerEmail,
    customerPhone,
    deliveryAddress,
    deliveryPincode,
    deliveryDate,
    payment: req.body.payment || {},
  };

  if (isDatabaseConnected()) {
    const created = await Order.create(order);
    res.status(201).json(publicOrderView(created.toObject()));
    return;
  }

  memory.orders.push(order);
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
