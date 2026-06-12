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

    console.log("Uploading New Choco Drink image...");
    const imagePath = path.resolve(__dirname, "choco_drink_new.jpg");
    const uploadResult = await cloudinary.uploader.upload(imagePath, {
      folder: "chocoriches_trending",
      public_id: "trending_choco_drink_new",
      overwrite: true,
    });
    const imageUrl = uploadResult.secure_url;
    console.log(`  Uploaded: ${imageUrl}`);

    const productId = `prod-trending-choco-drink`;

    let product = await Product.findOne({ id: productId });
    if (product) {
      product.image = imageUrl;
      product.images = [{ url: imageUrl, alt: "ChocoRiches Chocolate Shake" }];
      await product.save();
      console.log(`  ✅ Updated Product Image: Choco Drink (${productId})`);
    } else {
      console.log(`  Product not found: Choco Drink`);
    }

    console.log(`\n🎉 Image successfully replaced!`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
