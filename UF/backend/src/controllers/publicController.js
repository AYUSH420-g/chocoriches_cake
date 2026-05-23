import { isDatabaseConnected } from "../db.js";
import { getSiteSetting, activeBlockedDates, activeCategories, pincodeStatus } from "../services/availabilityService.js";

export function health(_req, res) {
  res.json({
    ok: true,
    database: isDatabaseConnected() ? "mongodb" : "memory",
    service: "chocoriches-api",
  });
}

export async function settings(_req, res) {
  res.json(await getSiteSetting());
}

export async function categories(_req, res) {
  res.json(await activeCategories());
}

export async function checkPincode(req, res) {
  res.json(await pincodeStatus(req.params.pincode));
}

export async function blockedDates(_req, res) {
  res.json(await activeBlockedDates());
}
