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
    file: path.resolve(__dirname, "blackforest_6.png"),
    name: "Chocolate Chunk Black Forest Cake",
    publicId: "blackforest_choco_chunk",
    idSuffix: "choco-chunk",
  },
  {
    file: path.resolve(__dirname, "blackforest_7.jpg"),
    name: "Oreo Black Forest Cake",
    publicId: "blackforest_oreo",
    idSuffix: "oreo",
  },
  {
    file: path.resolve(__dirname, "blackforest_8.jpg"),
    name: "Black Forest Gems Cake",
    publicId: "blackforest_gems",
    idSuffix: "gems",
  },
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB\n");

    for (const cake of cakes) {
      // Upload to Cloudinary
      console.log(`Uploading ${cake.name} to Cloudinary...`);
      const uploadResult = await cloudinary.uploader.upload(cake.file, {
        folder: "chocoriches_blackforest",
        public_id: cake.publicId,
        overwrite: true,
      });
      const imageUrl = uploadResult.secure_url;
      console.log(`  Uploaded: ${imageUrl}`);

      const productId = `prod-blackforest-${cake.idSuffix}`;

      // Skip if already exists
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
    }

    console.log("\n🎉 All 3 cakes added under Birthday & Anniversary > Black Forest Cakes!");
    console.log("   Weight: 0.5kg | Price: ₹499");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
