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

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB\n");

    const categoryName = "Trending 🔥";

    console.log("Uploading Choco Drink image...");
    const imagePath = path.resolve(__dirname, "choco_drink.jpg");
    const uploadResult = await cloudinary.uploader.upload(imagePath, {
      folder: "chocoriches_trending",
      public_id: "trending_choco_drink",
      overwrite: true,
    });
    const imageUrl = uploadResult.secure_url;
    console.log(`  Uploaded: ${imageUrl}`);

    const productId = `prod-trending-choco-drink`;

    let product = await Product.findOne({ id: productId });
    if (product) {
      console.log(`  Skipping (already exists): Choco Drink`);
    } else {
      product = new Product({
        id: productId,
        name: "ChocoRiches Chocolate Shake",
        price: 149,
        image: imageUrl,
        images: [{ url: imageUrl, alt: "ChocoRiches Chocolate Shake" }],
        category: categoryName,
        categories: [categoryName],
        description: "Our signature thick and creamy chocolate shake, packed in a premium glass bottle.",
        longDescription: "Enjoy the ultimate chocolate experience with our ChocoRiches Chocolate Shake. Made with real cocoa and fresh ingredients, perfectly blended for a rich and thick consistency.",
        weight: "200 ml",
        defaultWeight: "200 ml",
        weights: [{ label: "200 ml", price: 149 }],
        ratings: 4.8,
        numOfReviews: 24,
        featured: true,
        isActive: true,
        isTrending: true,
        sameDayDelivery: true,
        tags: ["trending", "drink", "shake", "chocolate"],
        sortOrder: 1,
        stock: 50,
      });

      await product.save();
      console.log(`  ✅ Saved Product: Choco Drink (${productId})`);
    }

    console.log(`\n🎉 Added Drink to Trending category!`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
