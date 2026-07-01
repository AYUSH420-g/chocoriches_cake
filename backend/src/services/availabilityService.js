import { isDatabaseConnected } from "../db.js";
import { BlockedDate } from "../models/BlockedDate.js";
import { Category } from "../models/Category.js";
import { Subcategory } from "../models/Subcategory.js";
import { Order } from "../models/Order.js";
import { ServicePincode } from "../models/ServicePincode.js";
import { SiteSetting } from "../models/SiteSetting.js";
import { memory } from "../utils/memoryStore.js";
import { blockedDateView, categoryView, subcategoryView, pincodeView, settingView, todayIso } from "../utils/formatters.js";

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

export async function activeSubcategories() {
  const subcategories = isDatabaseConnected()
    ? await Subcategory.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean()
    : (memory.subcategories || []).filter((subcat) => subcat.isActive !== false);

  return subcategories.map(subcategoryView);
}

export async function activeBlockedDates() {
  const dates = isDatabaseConnected()
    ? await BlockedDate.find({ isActive: true }).sort({ date: 1 }).lean()
    : memory.blockedDates.filter((date) => date.isActive);

  return dates.map(blockedDateView);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distance in km
}

const STORE_COORDS = { lat: 23.0223833, lon: 72.5279559 }; // 380015 (Ambawadi center)
const pincodeCoordsCache = new Map();

async function getPincodeCoordinates(pincode) {
  if (pincodeCoordsCache.has(pincode)) {
    return pincodeCoordsCache.get(pincode);
  }
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json`, {
      headers: { "User-Agent": "NChocoDeliveryApp/1.0" }
    });
    const data = await response.json();
    if (data && data.length > 0) {
      const coords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      pincodeCoordsCache.set(pincode, coords);
      return coords;
    }
  } catch (error) {
    console.error(`Failed to fetch coordinates for pincode ${pincode}:`, error);
  }
  return null;
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
  
  let deliveryCharge = 0;
  if (serviceable) {
    const coords = await getPincodeCoordinates(requestedPincode);
    if (coords) {
      const distance = calculateDistance(STORE_COORDS.lat, STORE_COORDS.lon, coords.lat, coords.lon);
      // Delivery charge formula: distance * 2 (two-way) * 8 rs per km
      deliveryCharge = Math.ceil(distance * 2 * 8);
    } else {
      // Fallback charge if coordinates are not found
      deliveryCharge = 50; 
    }
  }

  return {
    serviceable,
    deliveryCharge,
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
      : `We reach our max capacity for ${deliveryDate} plz dont add more.`,
  };
}
