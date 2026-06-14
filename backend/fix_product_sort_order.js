import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

import { Product } from "./src/models/Product.js";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Fetch all products ordered by createdAt descending (the old default sort)
  const products = await Product.find().sort({ createdAt: -1 });
  
  console.log(`Found ${products.length} products. Updating sort orders...`);

  // Assign sequential sort orders
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    product.sortOrder = i;
    await product.save();
  }

  console.log("Done updating sort orders.");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
