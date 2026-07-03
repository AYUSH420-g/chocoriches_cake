import crypto from "node:crypto";
import { MemoryStore } from "express-rate-limit";
import { config } from "../config/env.js";
import { isDatabaseConnected } from "../db.js";
import { RateLimitEntry } from "../models/RateLimitEntry.js";

function storageKey(prefix, key) {
  return `${prefix}:${crypto.createHash("sha256").update(String(key)).digest("hex")}`;
}

export class SharedRateLimitStore {
  constructor(prefix) {
    this.prefix = `${prefix}:`;
    this.localKeys = false;
    this.memory = new MemoryStore();
    this.windowMs = 15 * 60 * 1000;
  }

  init(options) {
    this.windowMs = options.windowMs;
    this.memory.init(options);
  }

  useMemory() {
    if (isDatabaseConnected()) return false;
    if (config.isProduction) throw new Error("Shared rate-limit storage is unavailable.");
    return true;
  }

  async increment(key) {
    if (this.useMemory()) return this.memory.increment(key);

    const now = new Date();
    const nextExpiry = new Date(now.getTime() + this.windowMs);
    const activeWindow = { $gt: [{ $ifNull: ["$expiresAt", new Date(0)] }, now] };
    const keyHash = storageKey(this.prefix, key);
    const update = () => RateLimitEntry.findOneAndUpdate(
      { key: keyHash },
      [{
        $set: {
          key: keyHash,
          count: { $cond: [activeWindow, { $add: [{ $ifNull: ["$count", 0] }, 1] }, 1] },
          expiresAt: { $cond: [activeWindow, "$expiresAt", nextExpiry] },
        },
      }],
      { upsert: true, new: true, setDefaultsOnInsert: false }
    ).lean();
    let entry;
    try {
      entry = await update();
    } catch (error) {
      if (error?.code !== 11000) throw error;
      entry = await update();
    }

    return { totalHits: Number(entry.count), resetTime: new Date(entry.expiresAt) };
  }

  async get(key) {
    if (this.useMemory()) return this.memory.get(key);
    const entry = await RateLimitEntry.findOne({ key: storageKey(this.prefix, key) }).lean();
    if (!entry || new Date(entry.expiresAt).getTime() <= Date.now()) return undefined;
    return { totalHits: Number(entry.count), resetTime: new Date(entry.expiresAt) };
  }

  async decrement(key) {
    if (this.useMemory()) return this.memory.decrement(key);
    await RateLimitEntry.updateOne(
      { key: storageKey(this.prefix, key) },
      [{ $set: { count: { $max: [0, { $subtract: [{ $ifNull: ["$count", 0] }, 1] }] } } }]
    );
  }

  async resetKey(key) {
    if (this.useMemory()) return this.memory.resetKey(key);
    await RateLimitEntry.deleteOne({ key: storageKey(this.prefix, key) });
  }
}
