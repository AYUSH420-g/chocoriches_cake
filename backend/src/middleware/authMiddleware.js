import { isDatabaseConnected } from "../db.js";
import { User } from "../models/User.js";
import { bearerToken, verifySignedToken } from "../utils/auth.js";
import { memory } from "../utils/memoryStore.js";

function userMatchesPayload(user, payload) {
  const id = String(user._id || user.id || "");
  return id === String(payload.sub || "") || user.email === payload.email;
}

async function findUserFromPayload(payload) {
  if (!payload?.email && !payload?.sub) {
    return null;
  }

  if (isDatabaseConnected()) {
    const filter = /^[0-9a-fA-F]{24}$/.test(String(payload.sub || ""))
      ? { _id: payload.sub }
      : { email: payload.email };
    return User.findOne(filter).lean();
  }

  return memory.users.find((user) => userMatchesPayload(user, payload)) || null;
}

export async function authenticate(req, res, next) {
  const payload = verifySignedToken(bearerToken(req));
  if (!payload) {
    res.status(401).json({ message: "Please login to continue." });
    return;
  }

  const user = await findUserFromPayload(payload);
  if (!user) {
    res.status(401).json({ message: "User session is no longer valid." });
    return;
  }

  if (user.isBlocked) {
    res.status(403).json({ message: user.blockedReason || "This account is blocked." });
    return;
  }

  req.auth = payload;
  req.user = user;
  next();
}

export async function optionalAuth(req, res, next) {
  if (!bearerToken(req)) {
    next();
    return;
  }

  await authenticate(req, res, next);
}

export async function requireAdmin(req, res, next) {
  const payload = verifySignedToken(bearerToken(req));
  if (!payload || payload.role !== "admin") {
    res.status(401).json({ message: "Admin access required." });
    return;
  }

  const admin = await findUserFromPayload(payload);
  if (!admin || admin.role !== "admin" || admin.isBlocked) {
    res.status(401).json({ message: "Admin access required." });
    return;
  }

  req.auth = payload;
  req.admin = admin;
  next();
}
