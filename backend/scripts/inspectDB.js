import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

import { Category } from "../src/models/Category.js";
import { Subcategory } from "../src/models/Subcategory.js";
import { Product } from "../src/models/Product.js";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  console.log("=== ALL CATEGORIES ===");
  const cats = await Category.find({}).lean();
  cats.forEach(c => console.log(`  [${c.slug}] "${c.name}" (active: ${c.isActive})`));

  console.log("\n=== ALL SUBCATEGORIES ===");
  const subs = await Subcategory.find({}).lean();
  subs.forEach(s => console.log(`  [${s.slug}] "${s.name}" -> category: "${s.category}" (active: ${s.isActive})`));

  console.log("\n=== PRODUCTS WITH 'black' or 'Birthday' or 'Anniversary' ===");
  const prods = await Product.find({
    $or: [
      { category: /birthday/i },
      { category: /anniversary/i },
      { category: /black/i },
      { subcategory: /black/i },
      { id: /prod-bf/i },
    ]
  }).lean();
  prods.forEach(p => console.log(`  [${p.id}] "${p.name}" cat="${p.category}" categories=${JSON.stringify(p.categories)} subcat="${p.subcategory}" subcategories=${JSON.stringify(p.subcategories)}`));

  await mongoose.disconnect();
}
run();
