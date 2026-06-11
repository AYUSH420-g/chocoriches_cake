import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { config } from "../src/config/env.js";
import { Product } from "../src/models/Product.js";

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

async function uploadToCloudinary(base64String, publicId) {
  try {
    const result = await cloudinary.uploader.upload(base64String, {
      folder: "chocoriches_migrated_db",
      public_id: publicId,
    });
    return result.secure_url;
  } catch (error) {
    console.error(`Failed to upload ${publicId}:`, error.message);
    return null;
  }
}

async function run() {
  try {
    const dotenv = await import("dotenv");
    dotenv.default.config();
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const products = await Product.find({});
    let updatedCount = 0;

    for (const product of products) {
      let changed = false;

      if (product.image && product.image.startsWith("data:image")) {
        console.log(`Uploading base64 image for product ${product.id}...`);
        const newUrl = await uploadToCloudinary(product.image, `db_prod_${product.id}_img`);
        if (newUrl) {
          product.image = newUrl;
          changed = true;
        }
      }

      if (product.detailImage && product.detailImage.startsWith("data:image")) {
        console.log(`Uploading base64 detail image for product ${product.id}...`);
        const newUrl = await uploadToCloudinary(product.detailImage, `db_prod_${product.id}_detail`);
        if (newUrl) {
          product.detailImage = newUrl;
          changed = true;
        }
      }

      if (changed) {
        await product.save();
        updatedCount++;
        console.log(`Saved product ${product.id} with new Cloudinary URL(s).`);
      }
    }

    console.log(`Migration complete. Updated ${updatedCount} products.`);
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    mongoose.disconnect();
  }
}

run();
