import crypto from "crypto";
import { config } from "../config/env.js";
import { isDatabaseConnected } from "../db.js";
import { User } from "../models/User.js";
import { clearSessionCookies, hashPassword, matchingTotpCounter, setSessionCookie, signToken, verifyPassword } from "../utils/auth.js";
import { publicUser } from "../utils/formatters.js";
import { memory, profileUser } from "../utils/memoryStore.js";
import { sendEmail } from "../utils/mailer.js";

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function validPassword(password) {
  return typeof password === "string" && password.length >= 8 && password.length <= 128;
}

function authResponse(user, res, role = user.role === "admin" ? "admin" : "user") {
  const safeUser = publicUser(user);
  const token = signToken({
    sub: safeUser.id,
    email: safeUser.email,
    role: safeUser.role,
    name: safeUser.name,
    tokenVersion: Number(user.tokenVersion || 0),
  }, role === "admin" ? 12 * 60 * 60 : undefined);
  setSessionCookie(res, token, role);
  return { user: safeUser };
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
  const phone = String(req.body.phone || "").replace(/\D/g, "");

  if (!validEmail(email)) {
    res.status(400).json({ message: "Please enter a valid email address." });
    return;
  }

  if (!validPassword(password)) {
    res.status(400).json({ message: "Password must be between 8 and 128 characters." });
    return;
  }
  if (phone && !/^\d{10}$/.test(phone)) {
    res.status(400).json({ message: "Please enter a valid 10-digit phone number." });
    return;
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    res.status(409).json({ message: "An account already exists with this email. Please login." });
    return;
  }

  const passwordFields = await hashPassword(password);
  const payload = {
    name: (name || email.split("@")[0]).slice(0, 100),
    email,
    ...passwordFields,
    avatar: profileUser.avatar,
    membership: profileUser.membership,
    role: "user",
    isBlocked: false,
    tokenVersion: 0,
    emailVerified: false,
    authProviders: ["local"],
  };

  if (phone) {
    payload.phone = phone;
  }

  const user = isDatabaseConnected() ? await User.create(payload) : payload;
  if (!isDatabaseConnected()) {
    memory.users.push(user);
  }

  res.status(201).json(authResponse(user, res));
}

export async function login(req, res) {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");

  if (!validEmail(email) || !password) {
    res.status(400).json({ message: "Email and password are required." });
    return;
  }

  const user = await findUserByEmail(email);
  if (!user || user.role === "admin" || !(await verifyPassword(password, user))) {
    res.status(401).json({ message: "Invalid email or password." });
    return;
  }

  if (user.isBlocked) {
    res.status(403).json({ message: user.blockedReason || "This account is blocked." });
    return;
  }

  if (Number(user.passwordIterations || 100_000) < 210_000) {
    const upgradedPassword = await hashPassword(password);
    if (isDatabaseConnected()) {
      await User.updateOne({ _id: user._id }, upgradedPassword);
      Object.assign(user, upgradedPassword);
    } else {
      Object.assign(user, upgradedPassword);
    }
  }

  res.json(authResponse(user, res));
}

export async function googleLogin(req, res) {
  const access_token = typeof req.body.access_token === "string" ? req.body.access_token.slice(0, 4096) : "";
  if (!access_token) {
    res.status(400).json({ message: "Google access token is required." });
    return;
  }

  try {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) {
      res.status(401).json({ message: "Invalid Google token." });
      return;
    }

    const data = await response.json();
    const email = normalizeEmail(data.email);
    
    if (!validEmail(email) || data.email_verified !== true) {
      res.status(401).json({ message: "Google did not provide a verified email address." });
      return;
    }

    let user = await findUserByEmail(email);
    
    if (!user) {
      const passwordFields = await hashPassword(crypto.randomBytes(16).toString("hex"));
      const payload = {
        name: data.name || email.split("@")[0],
        email,
        ...passwordFields,
        avatar: data.picture || profileUser.avatar,
        membership: profileUser.membership,
        role: "user",
        isBlocked: false,
        tokenVersion: 0,
        emailVerified: true,
        authProviders: ["google"],
      };

      user = isDatabaseConnected() ? await User.create(payload) : payload;
      if (!isDatabaseConnected()) {
        memory.users.push(user);
      }
    } else {
      if (user.role === "admin") {
        res.status(401).json({ message: "Please use the administrator login." });
        return;
      }
      if (user.isBlocked) {
        res.status(403).json({ message: user.blockedReason || "This account is blocked." });
        return;
      }

      const providers = [...new Set([...(user.authProviders || ["local"]), "google"])];
      const updates = {
        emailVerified: true,
        authProviders: providers,
        name: user.name || data.name || email.split("@")[0],
        avatar: user.avatar || data.picture || profileUser.avatar,
      };

      // A Google-verified owner claiming an unverified local registration must evict
      // the pre-registered password and every token issued to it.
      if (!user.emailVerified) {
        Object.assign(updates, await hashPassword(crypto.randomBytes(32).toString("hex")), {
          tokenVersion: Number(user.tokenVersion || 0) + 1,
        });
      }

      if (isDatabaseConnected()) {
        user = await User.findByIdAndUpdate(user._id, updates, { new: true }).lean();
      } else {
        const memoryUser = memory.users.find((item) => normalizeEmail(item.email) === email);
        Object.assign(memoryUser, updates);
        user = memoryUser;
      }
    }

    res.json(authResponse(user, res));
  } catch (error) {
    res.status(500).json({ message: "Internal server error during Google login." });
  }
}

export function profile(req, res) {
  res.json(publicUser(req.user));
}

export async function logout(req, res) {
  const user = req.user || req.admin;
  if (user) {
    if (isDatabaseConnected()) {
      await User.updateOne({ _id: user._id }, { $inc: { tokenVersion: 1 } });
    } else {
      const memoryUser = memory.users.find((item) => normalizeEmail(item.email) === normalizeEmail(user.email));
      if (memoryUser) memoryUser.tokenVersion = Number(memoryUser.tokenVersion || 0) + 1;
    }
  }
  clearSessionCookies(res);
  res.json({ ok: true });
}

export async function adminLogin(req, res) {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");
  const user = await findUserByEmail(email);

  if (!user || user.role !== "admin" || !(await verifyPassword(password, user))) {
    res.status(401).json({ message: "Invalid admin credentials." });
    return;
  }

  if (config.adminSeed.totpSecret) {
    const counter = matchingTotpCounter(req.body.otp, config.adminSeed.totpSecret);
    if (counter === null) {
      res.status(401).json({ message: "Invalid admin credentials." });
      return;
    }
    if (isDatabaseConnected()) {
      const claimed = await User.updateOne(
        { _id: user._id, $or: [{ lastAdminTotpCounter: { $lt: counter } }, { lastAdminTotpCounter: { $exists: false } }] },
        { $set: { lastAdminTotpCounter: counter } }
      );
      if (claimed.modifiedCount !== 1) {
        res.status(401).json({ message: "Invalid admin credentials." });
        return;
      }
    } else {
      const memoryAdmin = memory.users.find((item) => normalizeEmail(item.email) === email);
      if (!memoryAdmin || Number(memoryAdmin.lastAdminTotpCounter ?? -1) >= counter) {
        res.status(401).json({ message: "Invalid admin credentials." });
        return;
      }
      memoryAdmin.lastAdminTotpCounter = counter;
      user.lastAdminTotpCounter = counter;
    }
  }

  if (user.isBlocked) {
    res.status(403).json({ message: "This admin account is blocked." });
    return;
  }

  authResponse(user, res, "admin");
  res.json({ admin: publicUser(user) });
}

export async function addAddress(req, res) {
  const { label, name, phone, address, pincode, city, landmark } = req.body;
  if (!label || !name || !phone || !address || !pincode || !city) {
    res.status(400).json({ message: "Missing required address fields." });
    return;
  }

  const newAddress = {
    id: crypto.randomUUID(),
    label: String(label).trim().slice(0, 30),
    name: String(name).trim().slice(0, 100),
    phone: String(phone).replace(/\D/g, "").slice(0, 15),
    address: String(address).trim().slice(0, 500),
    pincode: String(pincode).replace(/\D/g, "").slice(0, 6),
    city: String(city).trim().slice(0, 100),
    landmark: String(landmark || "").trim().slice(0, 200),
  };
  if (!newAddress.label || !newAddress.name || !/^\d{10}$/.test(newAddress.phone) || !newAddress.address || !/^\d{6}$/.test(newAddress.pincode) || !newAddress.city) {
    res.status(400).json({ message: "Please enter a valid name, phone, address, city, and pincode." });
    return;
  }

  if (isDatabaseConnected()) {
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }
    if (user.addresses.length >= 10) {
      res.status(422).json({ message: "You can save up to 10 addresses." });
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
    if (memoryUser.addresses.length >= 10) {
      res.status(422).json({ message: "You can save up to 10 addresses." });
      return;
    }
    memoryUser.addresses.push(newAddress);
  }
  res.status(201).json(publicUser(memoryUser));
}

export async function deleteAddress(req, res) {
  const id = String(req.params.id || "").slice(0, 100);

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
  const normalizedName = name === undefined ? undefined : String(name).trim().slice(0, 100);
  const normalizedPhone = phone === undefined ? undefined : String(phone).replace(/\D/g, "").slice(0, 15);
  if (normalizedName !== undefined && !normalizedName) return res.status(400).json({ message: "Name cannot be empty." });
  if (normalizedPhone !== undefined && normalizedPhone && !/^\d{10}$/.test(normalizedPhone)) return res.status(400).json({ message: "Please enter a valid 10-digit phone number." });

  if (isDatabaseConnected()) {
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }
    if (normalizedName !== undefined) user.name = normalizedName;
    if (normalizedPhone !== undefined) user.phone = normalizedPhone;
    await user.save();
    res.json(publicUser(user));
    return;
  }

  const memoryUser = memory.users.find((u) => u.email === req.user.email);
  if (memoryUser) {
    if (normalizedName !== undefined) memoryUser.name = normalizedName;
    if (normalizedPhone !== undefined) memoryUser.phone = normalizedPhone;
  }
  res.json(publicUser(memoryUser));
}

export async function forgotPassword(req, res) {
  const email = normalizeEmail(req.body.email);
  if (!validEmail(email)) {
    res.status(200).json({ message: "If an account exists for this email, a reset link has been sent." });
    return;
  }

  const user = await findUserByEmail(email);
  if (!user) {
    res.status(200).json({ message: "If an account exists for this email, a reset link has been sent." });
    return;
  }

  const resetToken = crypto.randomBytes(20).toString("hex");
  const resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  const resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 mins

  if (isDatabaseConnected()) {
    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken,
      resetPasswordExpire,
    });
  } else {
    const memoryUser = memory.users.find((u) => u.email === user.email);
    if (memoryUser) {
      memoryUser.resetPasswordToken = resetPasswordToken;
      memoryUser.resetPasswordExpire = resetPasswordExpire;
    }
  }

  const clientUrl = config.clientUrl;
  const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;
  const message = `
    <h1>You have requested a password reset</h1>
    <p>Please go to this link to reset your password:</p>
    <a href="${resetUrl}" clicktracking="off">${resetUrl}</a>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      html: message,
    });
    res.status(200).json({ message: "If an account exists for this email, a reset link has been sent." });
  } catch (error) {
    console.error("Email could not be sent:", error);
    if (isDatabaseConnected()) {
      await User.findByIdAndUpdate(user._id, {
        resetPasswordToken: undefined,
        resetPasswordExpire: undefined,
      });
    } else {
      const memoryUser = memory.users.find((u) => u.email === user.email);
      if (memoryUser) {
        memoryUser.resetPasswordToken = undefined;
        memoryUser.resetPasswordExpire = undefined;
      }
    }
    res.status(200).json({ message: "If an account exists for this email, a reset link has been sent." });
  }
}

export async function resetPassword(req, res) {
  const token = String(req.body.token || "").slice(0, 128);
  const password = String(req.body.password || "");
  if (!token || !validPassword(password)) {
    res.status(400).json({ message: "A valid token and an 8 to 128 character password are required." });
    return;
  }
  const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");

  let user = null;
  if (isDatabaseConnected()) {
    user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
  } else {
    user = memory.users.find(
      (u) =>
        u.resetPasswordToken === resetPasswordToken &&
        u.resetPasswordExpire > Date.now()
    );
  }

  if (!user) {
    res.status(400).json({ message: "Invalid or expired token." });
    return;
  }

  const passwordFields = await hashPassword(password);
  
  if (isDatabaseConnected()) {
    await User.findByIdAndUpdate(user._id, {
      $set: {
        passwordHash: passwordFields.passwordHash,
        salt: passwordFields.salt,
        passwordIterations: passwordFields.passwordIterations,
        emailVerified: true,
      },
      $unset: { resetPasswordToken: 1, resetPasswordExpire: 1 },
      $inc: { tokenVersion: 1 },
    });
  } else {
    const memoryUser = memory.users.find((u) => u.email === user.email);
    if (memoryUser) {
      memoryUser.passwordHash = passwordFields.passwordHash;
      memoryUser.salt = passwordFields.salt;
      memoryUser.passwordIterations = passwordFields.passwordIterations;
      memoryUser.resetPasswordToken = undefined;
      memoryUser.resetPasswordExpire = undefined;
      memoryUser.emailVerified = true;
      memoryUser.tokenVersion = Number(memoryUser.tokenVersion || 0) + 1;
    }
  }

  clearSessionCookies(res);
  res.status(200).json({ message: "Password updated successfully." });
}
