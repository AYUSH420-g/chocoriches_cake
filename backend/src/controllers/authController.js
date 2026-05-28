import crypto from "crypto";
import { isDatabaseConnected } from "../db.js";
import { User } from "../models/User.js";
import { hashPassword, signToken, verifyPassword } from "../utils/auth.js";
import { publicUser } from "../utils/formatters.js";
import { memory, profileUser } from "../utils/memoryStore.js";
import { sendEmail } from "../utils/mailer.js";

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

export async function googleLogin(req, res) {
  const { access_token } = req.body;
  if (!access_token) {
    res.status(400).json({ message: "Google access token is required." });
    return;
  }

  try {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    
    if (!response.ok) {
      res.status(401).json({ message: "Invalid Google token." });
      return;
    }

    const data = await response.json();
    const email = normalizeEmail(data.email);
    
    if (!email) {
      res.status(400).json({ message: "Email not provided by Google." });
      return;
    }

    let user = await findUserByEmail(email);
    
    if (!user) {
      const passwordFields = hashPassword(crypto.randomBytes(16).toString("hex"));
      const payload = {
        name: data.name || email.split("@")[0],
        email,
        ...passwordFields,
        avatar: data.picture || profileUser.avatar,
        membership: profileUser.membership,
        role: "user",
        isBlocked: false,
      };

      user = isDatabaseConnected() ? await User.create(payload) : payload;
      if (!isDatabaseConnected()) {
        memory.users.push(user);
      }
    } else if (user.isBlocked) {
      res.status(403).json({ message: user.blockedReason || "This account is blocked." });
      return;
    }

    res.json(authResponse(user));
  } catch (error) {
    res.status(500).json({ message: "Internal server error during Google login." });
  }
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

export async function forgotPassword(req, res) {
  const email = normalizeEmail(req.body.email);
  if (!email) {
    res.status(400).json({ message: "Email is required." });
    return;
  }

  const user = await findUserByEmail(email);
  if (!user) {
    res.status(404).json({ message: "No user found with this email." });
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

  const clientUrl = req.headers.origin || process.env.CLIENT_URL || "http://localhost:5173";
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
    res.status(200).json({ message: "Email sent." });
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
    res.status(500).json({ message: "Email could not be sent. Reason: " + (error.message || "Unknown error") });
  }
}

export async function resetPassword(req, res) {
  const resetPasswordToken = crypto.createHash("sha256").update(req.body.token).digest("hex");

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

  const passwordFields = hashPassword(req.body.password);
  
  if (isDatabaseConnected()) {
    await User.findByIdAndUpdate(user._id, {
      passwordHash: passwordFields.passwordHash,
      salt: passwordFields.salt,
      resetPasswordToken: undefined,
      resetPasswordExpire: undefined,
    });
  } else {
    const memoryUser = memory.users.find((u) => u.email === user.email);
    if (memoryUser) {
      memoryUser.passwordHash = passwordFields.passwordHash;
      memoryUser.salt = passwordFields.salt;
      memoryUser.resetPasswordToken = undefined;
      memoryUser.resetPasswordExpire = undefined;
    }
  }

  res.status(200).json({ message: "Password updated successfully." });
}
