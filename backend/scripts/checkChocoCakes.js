import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

import { Product } from "../src/models/Product.js";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  console.log("=== Chocolate Cakes matching Anniversary ===");
  const annivCakes = await Product.find({
    $or: [{ category: "Anniversary" }, { categories: "Anniversary" }],
    $and: [{ $or: [{ subcategory: "Chocolate Cakes" }, { subcategories: "Chocolate Cakes" }] }]
  }).lean();
  annivCakes.forEach(c => console.log(`[${c.id}] ${c.name} - category: ${c.category}, categories: ${c.categories}`));

  console.log("\n=== Chocolate Cakes matching Birthday ===");
  const bdayCakes = await Product.find({
    $or: [{ category: "Birthday" }, { categories: "Birthday" }],
    $and: [{ $or: [{ subcategory: "Chocolate Cakes" }, { subcategories: "Chocolate Cakes" }] }]
  }).lean();
  bdayCakes.forEach(c => console.log(`[${c.id}] ${c.name} - category: ${c.category}, categories: ${c.categories}`));

  await mongoose.disconnect();
}
run();
