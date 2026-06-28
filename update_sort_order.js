import mongoose from "mongoose";
import { Product } from "./backend/src/models/Product.js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config({ path: "./backend/.env" });

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  const products = await Product.find({ sortOrder: { $in: [0, null] } });
  for (const p of products) {
    p.sortOrder = p.createdAt.getTime();
    await p.save();
  }
  console.log("Migrated", products.length, "products.");
  process.exit(0);
}
migrate();
