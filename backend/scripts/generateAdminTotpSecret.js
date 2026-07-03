import crypto from "node:crypto";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32(buffer) {
  let bits = "";
  for (const byte of buffer) bits += byte.toString(2).padStart(8, "0");
  let output = "";
  for (let offset = 0; offset < bits.length; offset += 5) {
    output += alphabet[Number.parseInt(bits.slice(offset, offset + 5).padEnd(5, "0"), 2)];
  }
  return output;
}

const secret = base32(crypto.randomBytes(20));
const account = encodeURIComponent(process.env.ADMIN_EMAIL || "admin@chocoriches.com");
const issuer = encodeURIComponent("ChocoRiches Admin");

console.info(`ADMIN_TOTP_SECRET=${secret}`);
console.info(`Authenticator URI: otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&digits=6&period=30`);
console.info("Store the secret only in your protected server environment, then add it to your authenticator app.");
