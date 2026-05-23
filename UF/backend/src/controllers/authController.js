import { isDatabaseConnected } from "../db.js";
import { User } from "../models/User.js";
import { hashPassword, signToken, verifyPassword } from "../utils/auth.js";
import { publicUser } from "../utils/formatters.js";
import { memory, profileUser } from "../utils/memoryStore.js";

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function authResponse(user) {
  const safeUser = publicUser(user);
  return {
    user: safeUser,
    token: signToken({
      sub: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
      name: safeUser.name,
    }),
  };
}

async function findUserByEmail(email) {
  if (isDatabaseConnected()) {
    return User.findOne({ email }).lean();
  }

  return memory.users.find((item) => normalizeEmail(item.email) === email) || null;
}

export async function register(req, res) {
  const name = String(req.body.name || "").trim();
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");
  const phone = String(req.body.phone || "").trim();

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required." });
    return;
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    res.status(409).json({ message: "An account already exists with this email. Please login." });
    return;
  }

  const passwordFields = hashPassword(password);
  const payload = {
    name: name || email.split("@")[0],
    email,
    ...passwordFields,
    avatar: profileUser.avatar,
    membership: profileUser.membership,
    role: "user",
    isBlocked: false,
  };

  if (phone) {
    payload.phone = phone;
  }

  const user = isDatabaseConnected() ? await User.create(payload) : payload;
  if (!isDatabaseConnected()) {
    memory.users.push(user);
  }

  res.status(201).json(authResponse(user));
}

export async function login(req, res) {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required." });
    return;
  }

  const user = await findUserByEmail(email);
  if (!user || !verifyPassword(password, user)) {
    res.status(401).json({ message: "Invalid email or password." });
    return;
  }

  if (user.isBlocked) {
    res.status(403).json({ message: user.blockedReason || "This account is blocked." });
    return;
  }

  res.json(authResponse(user));
}

export function profile(req, res) {
  res.json(publicUser(req.user));
}

export function logout(_req, res) {
  res.json({ ok: true });
}

export async function adminLogin(req, res) {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");
  const user = await findUserByEmail(email);

  if (!user || user.role !== "admin" || !verifyPassword(password, user)) {
    res.status(401).json({ message: "Invalid admin credentials." });
    return;
  }

  if (user.isBlocked) {
    res.status(403).json({ message: "This admin account is blocked." });
    return;
  }

  res.json({ admin: publicUser(user), token: authResponse(user).token });
}
