import { isDatabaseConnected } from "../db.js";
import { User } from "../models/User.js";
import { sessionToken, verifySignedToken } from "../utils/auth.js";
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

function tokenMatchesUser(payload, user) {
  return Number(payload?.tokenVersion || 0) === Number(user?.tokenVersion || 0);
}

export async function authenticate(req, res, next) {
  const payload = verifySignedToken(sessionToken(req, "user"));
  if (!payload) {
    res.status(401).json({ message: "Please login to continue." });
    return;
  }

  const user = await findUserFromPayload(payload);
  if (!user || !tokenMatchesUser(payload, user)) {
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
  if (!sessionToken(req, "user")) {
    next();
    return;
  }

  await authenticate(req, res, next);
}

export async function requireAdmin(req, res, next) {
  const payload = verifySignedToken(sessionToken(req, "admin"));
  if (!payload || payload.role !== "admin") {
    res.status(404).json({ message: "Not Found" });
    return;
  }

  const admin = await findUserFromPayload(payload);
  if (!admin || admin.role !== "admin" || admin.isBlocked || !tokenMatchesUser(payload, admin)) {
    res.status(404).json({ message: "Not Found" });
    return;
  }

  req.auth = payload;
  req.admin = admin;
  next();
}
