import crypto from "node:crypto";
import { config } from "../config/env.js";

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const passwordHash = crypto.pbkdf2Sync(String(password), salt, 100000, 64, "sha512").toString("hex");
  return { salt, passwordHash };
}

export function verifyPassword(password, user) {
  if (!user?.passwordHash || !user?.salt || !password) {
    return false;
  }

  const { passwordHash } = hashPassword(password, user.salt);
  const expected = Buffer.from(user.passwordHash);
  const actual = Buffer.from(passwordHash);

  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

export function signToken(payload) {
  const tokenPayload = {
    ...payload,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(tokenPayload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", config.jwtSecret)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export function verifySignedToken(token = "") {
  try {
    const [encodedPayload, signature] = String(token).split(".");
    if (!encodedPayload || !signature) {
      return null;
    }

    const expectedSignature = crypto
      .createHmac("sha256", config.jwtSecret)
      .update(encodedPayload)
      .digest("base64url");

    if (signature !== expectedSignature) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (!payload.exp || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function bearerToken(req) {
  return req.headers.authorization?.replace(/^Bearer\s+/i, "") || "";
}
