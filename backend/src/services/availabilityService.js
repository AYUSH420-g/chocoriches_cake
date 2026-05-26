import { isDatabaseConnected } from "../db.js";
import { BlockedDate } from "../models/BlockedDate.js";
import { Category } from "../models/Category.js";
import { Order } from "../models/Order.js";
import { ServicePincode } from "../models/ServicePincode.js";
import { SiteSetting } from "../models/SiteSetting.js";
import { memory } from "../utils/memoryStore.js";
import { blockedDateView, categoryView, pincodeView, settingView, todayIso } from "../utils/formatters.js";

export async function getSiteSetting() {
  const setting = isDatabaseConnected()
    ? await SiteSetting.findOne({ key: "site" }).lean()
    : memory.setting;

  return settingView(setting);
}

export async function updateSiteSetting(updates) {
  const payload = {
    maintenanceMode: Boolean(updates.maintenanceMode),
    maintenanceMessage: updates.maintenanceMessage || memory.setting.maintenanceMessage,
    dailyCakeLimit: Math.max(0, Number(updates.dailyCakeLimit || 0)),
  };

  if (isDatabaseConnected()) {
    const setting = await SiteSetting.findOneAndUpdate(
      { key: "site" },
      { key: "site", ...payload },
      { new: true, upsert: true }
    ).lean();
    return settingView(setting);
  }

  memory.setting = { ...memory.setting, ...payload };
  return settingView(memory.setting);
}

export async function activeCategories() {
  const categories = isDatabaseConnected()
    ? await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean()
    : memory.categories.filter((category) => category.isActive !== false);

  return categories.map(categoryView);
}

export async function activeBlockedDates() {
  const dates = isDatabaseConnected()
    ? await BlockedDate.find({ isActive: true }).sort({ date: 1 }).lean()
    : memory.blockedDates.filter((date) => date.isActive);

  return dates.map(blockedDateView);
}

export async function pincodeStatus(pincode) {
  const requestedPincode = String(pincode || "").trim();
  const activePincodeCount = isDatabaseConnected()
    ? await ServicePincode.countDocuments({ isActive: true })
    : memory.pincodes.filter((item) => item.isActive).length;
  const pincodeRecord = isDatabaseConnected()
    ? await ServicePincode.findOne({ pincode: requestedPincode, isActive: true }).lean()
    : memory.pincodes.find((item) => item.pincode === requestedPincode && item.isActive);

  const serviceable = activePincodeCount > 0 && Boolean(pincodeRecord);
  return {
    serviceable,
    pincode: pincodeRecord ? pincodeView(pincodeRecord) : null,
    message: serviceable
      ? "Delivery is available for this pincode."
      : "Delivery is not available for this pincode.",
  };
}

export async function isPincodeServiceable(pincode) {
  return (await pincodeStatus(pincode)).serviceable;
}

export async function isDeliveryDateBlocked(date) {
  const deliveryDate = String(date || todayIso()).slice(0, 10);
  const blockedDate = isDatabaseConnected()
    ? await BlockedDate.findOne({ date: deliveryDate, isActive: true }).lean()
    : memory.blockedDates.find((item) => item.date === deliveryDate && item.isActive);

  return Boolean(blockedDate);
}

function orderCakeCount(order = {}) {
  if (Number(order.itemCount || 0) > 0) {
    return Number(order.itemCount);
  }

  return Array.isArray(order.items) ? order.items.length : 0;
}

export async function orderedCakeCountForDate(date) {
  const deliveryDate = String(date || todayIso()).slice(0, 10);
  const orders = isDatabaseConnected()
    ? await Order.find({ deliveryDate, status: { $ne: "Cancelled" } }).lean()
    : memory.orders.filter((order) => order.deliveryDate === deliveryDate && order.status !== "Cancelled");

  return orders.reduce((count, order) => count + orderCakeCount(order), 0);
}

export async function cakeCapacityStatus(date, requestedQuantity = 1, reservedQuantity = 0) {
  const setting = await getSiteSetting();
  const dailyCakeLimit = Number(setting.dailyCakeLimit || 0);
  const deliveryDate = String(date || todayIso()).slice(0, 10);

  if (dailyCakeLimit <= 0) {
    return {
      allowed: true,
      dailyCakeLimit,
      remaining: Infinity,
      message: "Cake limit is not enabled.",
    };
  }

  const alreadyOrdered = await orderedCakeCountForDate(deliveryDate);
  const requested = Math.max(1, Number(requestedQuantity || 1));
  const reserved = Math.max(0, Number(reservedQuantity || 0));
  const remaining = Math.max(0, dailyCakeLimit - alreadyOrdered - reserved);

  return {
    allowed: requested <= remaining,
    dailyCakeLimit,
    alreadyOrdered,
    reserved,
    requested,
    remaining,
    deliveryDate,
    message: requested <= remaining
      ? `${remaining} cake${remaining === 1 ? "" : "s"} available for this date.`
      : `Daily cake limit reached for ${deliveryDate}. Please choose another date.`,
  };
}
