import crypto from "crypto";
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

export async function addAddress(req, res) {
  const { label, name, phone, address, pincode, city, landmark } = req.body;
  if (!label || !name || !phone || !address || !pincode || !city) {
    res.status(400).json({ message: "Missing required address fields." });
    return;
  }

  const newAddress = {
    id: crypto.randomUUID(),
    label,
    name,
    phone,
    address,
    pincode,
    city,
    landmark: landmark || "",
  };

  if (isDatabaseConnected()) {
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }
    user.addresses.push(newAddress);
    await user.save();
    res.status(201).json(publicUser(user));
    return;
  }

  const memoryUser = memory.users.find((u) => u.email === req.user.email);
  if (memoryUser) {
    memoryUser.addresses = memoryUser.addresses || [];
    memoryUser.addresses.push(newAddress);
  }
  res.status(201).json(publicUser(memoryUser));
}

export async function deleteAddress(req, res) {
  const { id } = req.params;

  if (isDatabaseConnected()) {
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }
    user.addresses = user.addresses.filter((addr) => String(addr.id) !== id && String(addr._id) !== id);
    await user.save();
    res.json(publicUser(user));
    return;
  }

  const memoryUser = memory.users.find((u) => u.email === req.user.email);
  if (memoryUser && memoryUser.addresses) {
    memoryUser.addresses = memoryUser.addresses.filter((addr) => String(addr.id) !== id);
  }
  res.json(publicUser(memoryUser));
}

export async function updateProfile(req, res) {
  const { name, phone } = req.body;

  if (isDatabaseConnected()) {
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }
    if (name !== undefined) user.name = String(name).trim();
    if (phone !== undefined) user.phone = String(phone).trim();
    await user.save();
    res.json(publicUser(user));
    return;
  }

  const memoryUser = memory.users.find((u) => u.email === req.user.email);
  if (memoryUser) {
    if (name !== undefined) memoryUser.name = String(name).trim();
    if (phone !== undefined) memoryUser.phone = String(phone).trim();
  }
  res.json(publicUser(memoryUser));
}

