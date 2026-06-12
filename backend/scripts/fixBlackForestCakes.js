import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

import { Product } from "../src/models/Product.js";
import { Category } from "../src/models/Category.js";
import { Subcategory } from "../src/models/Subcategory.js";

// Cloudinary URLs already uploaded
const cakes = [
  {
    name: "Black Forest Cherry Drip Cake",
    image: "https://res.cloudinary.com/dyk0mzxqu/image/upload/v1781282410/chocoriches_blackforest/blackforest_cherry_drip.png",
    idSuffix: "cherry-drip",
  },
  {
    name: "Black Forest Rosette Cake",
    image: "https://res.cloudinary.com/dyk0mzxqu/image/upload/v1781282411/chocoriches_blackforest/blackforest_rosette.png",
    idSuffix: "rosette",
  },
  {
    name: "Happy Birthday Black Forest Cake",
    image: "https://res.cloudinary.com/dyk0mzxqu/image/upload/v1781282412/chocoriches_blackforest/blackforest_happy_birthday.png",
    idSuffix: "happy-birthday",
  },
  {
    name: "Classic Black Forest Cake",
    image: "https://res.cloudinary.com/dyk0mzxqu/image/upload/v1781282416/chocoriches_blackforest/blackforest_classic.png",
    idSuffix: "classic",
  },
  {
    name: "Black Forest Naked Layer Cake",
    image: "https://res.cloudinary.com/dyk0mzxqu/image/upload/v1781282418/chocoriches_blackforest/blackforest_naked_layer.jpg",
    idSuffix: "naked-layer",
  },
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB\n");

    // ── Step 1: Delete the wrong "Birthday & Anniversary" category, subcategory, and products ──
    console.log("--- CLEANUP: Removing wrongly created data ---");

    const deletedProds = await Product.deleteMany({ id: /^prod-bf-/ });
    console.log(`  Deleted ${deletedProds.deletedCount} wrong products`);

    const deletedCat = await Category.deleteOne({ slug: "birthday-anniversary" });
    console.log(`  Deleted wrong category "Birthday & Anniversary": ${deletedCat.deletedCount}`);

    const deletedSub = await Subcategory.deleteOne({ slug: "black-forest", category: "Birthday & Anniversary" });
    console.log(`  Deleted wrong subcategory "Black Forest" under "Birthday & Anniversary": ${deletedSub.deletedCount}`);

    // ── Step 2: Add each cake under BOTH Birthday and Anniversary categories ──
    console.log("\n--- ADDING CAKES ---");

    for (const cake of cakes) {
      const productId = `prod-blackforest-${cake.idSuffix}`;

      // Check if product already exists (in case of re-run)
      const existing = await Product.findOne({ id: productId });
      if (existing) {
        console.log(`  Skipping (already exists): ${cake.name}`);
        continue;
      }

      const product = new Product({
        id: productId,
        name: cake.name,
        price: 499,
        image: cake.image,
        images: [{ url: cake.image, alt: cake.name }],
        category: "Birthday",
        categories: ["Birthday", "Anniversary"],
        subcategory: "Black Forest Cakes",
        subcategories: ["Black Forest Cakes"],
        description: `Delicious eggless ${cake.name}, freshly baked with premium ingredients. Perfect for birthdays and anniversaries.`,
        longDescription: `Indulge in our freshly baked ${cake.name}. This eggless Black Forest cake features layers of rich chocolate sponge, fresh whipped cream, and cherry filling, topped with chocolate shavings and cherries. Weighing 0.5kg, it's the perfect treat for any celebration.`,
        weight: "0.5kg",
        defaultWeight: "0.5kg",
        weights: [{ label: "0.5kg", price: 499 }],
        ratings: 4.5,
        numOfReviews: 0,
        featured: false,
        isActive: true,
        isFeatured: false,
        isBestSeller: false,
        isTrending: false,
        customizable: false,
        sameDayDelivery: true,
        tags: ["black forest", "eggless", "birthday", "anniversary", "cherry", "chocolate"],
        sortOrder: 0,
        stock: 50,
      });

      await product.save();
      console.log(`  ✅ Saved: ${cake.name} (${productId})`);
      console.log(`     categories: [Birthday, Anniversary]`);
      console.log(`     subcategory: Black Forest Cakes`);
    }

    console.log("\n🎉 Done! All 5 Black Forest cakes added under Birthday & Anniversary categories.");
    console.log("   Subcategory: Black Forest Cakes");
    console.log("   Weight: 0.5kg | Price: ₹499");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
