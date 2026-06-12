import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

import { Product } from "../src/models/Product.js";

const cakes = [
  {
    file: path.resolve(__dirname, "choco_6.png"),
    name: "Classic Three Layer Chocolate Cake",
    publicId: "choco_three_layer",
    idSuffix: "three-layer",
  },
  {
    file: path.resolve(__dirname, "choco_7.png"),
    name: "Classic Chocolate Rosette Cake",
    publicId: "choco_classic_rosette",
    idSuffix: "classic-rosette",
  },
  {
    file: path.resolve(__dirname, "choco_8.jpg"),
    name: "Oreo Swirl Chocolate Cake",
    publicId: "choco_oreo_swirl",
    idSuffix: "oreo-swirl",
  },
  {
    file: path.resolve(__dirname, "choco_9.png"),
    name: "KitKat Delight Chocolate Cake",
    publicId: "choco_kitkat_delight",
    idSuffix: "kitkat-delight",
  },
  {
    file: path.resolve(__dirname, "choco_10.jpg"),
    name: "Dark Chocolate Flakes Cake",
    publicId: "choco_dark_flakes",
    idSuffix: "dark-flakes",
  },
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB\n");

    // 1. Fix existing Chocolate Cakes to ensure they appear in both Birthday and Anniversary
    console.log("Fixing existing Chocolate Cakes to ensure they appear in both categories...");
    const existingChocoCakes = await Product.find({
      $or: [{ subcategory: "Chocolate Cakes" }, { subcategories: "Chocolate Cakes" }]
    });

    let updatedCount = 0;
    for (const cake of existingChocoCakes) {
      let changed = false;
      if (!cake.categories.includes("Birthday")) {
        cake.categories.push("Birthday");
        changed = true;
      }
      if (!cake.categories.includes("Anniversary")) {
        cake.categories.push("Anniversary");
        changed = true;
      }
      if (changed) {
        await cake.save();
        updatedCount++;
        console.log(`  Fixed categories for existing cake: ${cake.name}`);
      }
    }
    console.log(`Updated ${updatedCount} existing cakes.\n`);

    // 2. Upload and add the 5 new Chocolate Cakes
    console.log("Adding 5 new Chocolate Cakes...");
    for (const cake of cakes) {
      console.log(`Uploading ${cake.name} to Cloudinary...`);
      const uploadResult = await cloudinary.uploader.upload(cake.file, {
        folder: "chocoriches_chocolate",
        public_id: cake.publicId,
        overwrite: true,
      });
      const imageUrl = uploadResult.secure_url;
      console.log(`  Uploaded: ${imageUrl}`);

      const productId = `prod-choco-${cake.idSuffix}`;

      const existing = await Product.findOne({ id: productId });
      if (existing) {
        console.log(`  Skipping (already exists): ${cake.name}`);
        continue;
      }

      const product = new Product({
        id: productId,
        name: cake.name,
        price: 499,
        image: imageUrl,
        images: [{ url: imageUrl, alt: cake.name }],
        category: "Birthday", // the primary category can be Birthday, the array handles multiple categories
        categories: ["Birthday", "Anniversary"],
        subcategory: "Chocolate Cakes",
        subcategories: ["Chocolate Cakes"],
        description: `Delicious eggless ${cake.name}, freshly baked with premium chocolate. Perfect for birthdays and anniversaries.`,
        longDescription: `Indulge in our freshly baked ${cake.name}. This eggless chocolate cake is crafted with the richest cocoa, layered with velvety ganache and topped beautifully. Weighing 0.5kg, it's the perfect treat for any celebration.`,
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
        tags: ["chocolate", "eggless", "birthday", "anniversary"],
        sortOrder: 0,
        stock: 50,
      });

      await product.save();
      console.log(`  ✅ Saved: ${cake.name} (${productId})`);
    }

    console.log("\n🎉 Fixed existing cakes and added 5 new Chocolate Cakes under Birthday & Anniversary > Chocolate Cakes!");
    console.log("   Weight: 0.5kg | Price: ₹499");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
