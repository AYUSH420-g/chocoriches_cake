import crypto from "node:crypto";
import { config } from "../config/env.js";

const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const ADMIN_SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;
const PASSWORD_ITERATIONS = 210_000;
const USER_COOKIE = "chocoriches_user_session";
const ADMIN_COOKIE = "chocoriches_admin_session";

export async function hashPassword(password, salt = crypto.randomBytes(16).toString("hex"), passwordIterations = PASSWORD_ITERATIONS) {
  const derivedKey = await new Promise((resolve, reject) => {
    crypto.pbkdf2(String(password), salt, passwordIterations, 64, "sha512", (error, key) => (
      error ? reject(error) : resolve(key)
    ));
  });
  const passwordHash = derivedKey.toString("hex");
  return { salt, passwordHash, passwordIterations };
}

export async function verifyPassword(password, user) {
  if (!user?.passwordHash || !user?.salt || !password) {
    return false;
  }

  const { passwordHash } = await hashPassword(password, user.salt, Number(user.passwordIterations || 100_000));
  const expected = Buffer.from(user.passwordHash);
  const actual = Buffer.from(passwordHash);

  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

export function signToken(payload, maxAgeSeconds = SESSION_MAX_AGE_SECONDS) {
  const tokenPayload = {
    ...payload,
    exp: Date.now() + maxAgeSeconds * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(tokenPayload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", config.jwtSecret)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

function safeEqual(left = "", right = "") {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
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

    if (!safeEqual(signature, expectedSignature)) {
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

function requestCookies(req) {
  return String(req.headers.cookie || "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((cookies, item) => {
      const separator = item.indexOf("=");
      if (separator <= 0) return cookies;
      const key = item.slice(0, separator);
      const value = item.slice(separator + 1);
      try {
        cookies[key] = decodeURIComponent(value);
      } catch {
        cookies[key] = value;
      }
      return cookies;
    }, {});
}

export function sessionToken(req, role = "user") {
  const cookies = requestCookies(req);
  return cookies[role === "admin" ? ADMIN_COOKIE : USER_COOKIE] || "";
}

function cookieValue(name, value, maxAge) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/api",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${maxAge}`,
  ];
  if (config.isProduction) parts.push("Secure");
  return parts.join("; ");
}

export function setSessionCookie(res, token, role = "user") {
  const name = role === "admin" ? ADMIN_COOKIE : USER_COOKIE;
  const maxAge = role === "admin" ? ADMIN_SESSION_MAX_AGE_SECONDS : SESSION_MAX_AGE_SECONDS;
  res.append("Set-Cookie", cookieValue(name, token, maxAge));
}

export function clearSessionCookies(res) {
  res.append("Set-Cookie", cookieValue(USER_COOKIE, "", 0));
  res.append("Set-Cookie", cookieValue(ADMIN_COOKIE, "", 0));
}

function decodeBase32(value) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const character of String(value || "").replace(/=+$/, "")) {
    const index = alphabet.indexOf(character);
    if (index < 0) return Buffer.alloc(0);
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let offset = 0; offset + 8 <= bits.length; offset += 8) {
    bytes.push(Number.parseInt(bits.slice(offset, offset + 8), 2));
  }
  return Buffer.from(bytes);
}

function totpAt(secret, counter) {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac("sha1", secret).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const number = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(number).padStart(6, "0");
}

export function matchingTotpCounter(code, base32Secret, now = Date.now()) {
  const normalizedCode = String(code || "").replace(/\D/g, "").slice(0, 6);
  const secret = decodeBase32(base32Secret);
  if (!/^\d{6}$/.test(normalizedCode) || secret.length < 20) return null;
  const counter = Math.floor(now / 30_000);
  for (const drift of [0, -1, 1]) {
    const candidate = counter + drift;
    if (safeEqual(normalizedCode, totpAt(secret, candidate))) return candidate;
  }
  return null;
}

export function verifyTotpCode(code, base32Secret, now = Date.now()) {
  return matchingTotpCounter(code, base32Secret, now) !== null;
}
