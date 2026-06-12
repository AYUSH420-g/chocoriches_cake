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
    file: path.resolve(__dirname, "choco_1.png"),
    name: "Chocolate Rosette Drip Cake",
    publicId: "choco_rosette_drip",
    idSuffix: "rosette-drip",
  },
  {
    file: path.resolve(__dirname, "choco_2.png"),
    name: "Chocolate Sprinkle Drip Cake",
    publicId: "choco_sprinkle_drip",
    idSuffix: "sprinkle-drip",
  },
  {
    file: path.resolve(__dirname, "choco_3.png"),
    name: "Two Tier Rose Chocolate Cake",
    publicId: "choco_two_tier_rose",
    idSuffix: "two-tier-rose",
  },
  {
    file: path.resolve(__dirname, "choco_4.png"),
    name: "Oreo Chocolate Dream Cake",
    publicId: "choco_oreo_dream",
    idSuffix: "oreo-dream",
  },
  {
    file: path.resolve(__dirname, "choco_5.png"),
    name: "Chocolate Heart Ganache Cake",
    publicId: "choco_heart_ganache",
    idSuffix: "heart-ganache",
  },
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB\n");

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
        category: "Birthday",
        categories: ["Birthday", "Anniversary"],
        subcategory: "Chocolate Cakes",
        subcategories: ["Chocolate Cakes"],
        description: `Delicious eggless ${cake.name}, freshly baked with premium chocolate and finest ingredients. Perfect for birthdays and anniversaries.`,
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
        tags: ["chocolate", "eggless", "birthday", "anniversary", "ganache"],
        sortOrder: 0,
        stock: 50,
      });

      await product.save();
      console.log(`  ✅ Saved: ${cake.name} (${productId})`);
    }

    console.log("\n🎉 All 5 Chocolate Cakes added under Birthday & Anniversary > Chocolate Cakes!");
    console.log("   Weight: 0.5kg | Price: ₹499");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
