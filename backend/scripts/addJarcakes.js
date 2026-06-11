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

const jarcakes = [
  { file: path.resolve(__dirname, "jarcake_a.png"), name: "a" },
  { file: path.resolve(__dirname, "jarcake_b.png"), name: "b" },
  { file: path.resolve(__dirname, "jarcake_c.png"), name: "c" },
  { file: path.resolve(__dirname, "jarcake_d.png"), name: "d" },
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    for (const cake of jarcakes) {
      console.log(`Uploading ${cake.name} to Cloudinary...`);

      const uploadResult = await cloudinary.uploader.upload(cake.file, {
        folder: "chocoriches_jarcakes",
        public_id: `jarcake_${cake.name}`,
        overwrite: true,
      });

      const imageUrl = uploadResult.secure_url;
      console.log(`  Uploaded: ${imageUrl}`);

      const productId = `prod-jarcake-${cake.name}-${Date.now()}`;
      const product = new Product({
        id: productId,
        name: cake.name,
        price: 200,
        image: imageUrl,
        images: [{ url: imageUrl, alt: cake.name }],
        category: "Jar Cake",
        categories: ["Jar Cake"],
        description: `Delicious freshly baked ${cake.name} jar cake, eggless and made with premium ingredients.`,
        longDescription: `Indulge in our freshly baked ${cake.name} jar cake. Made with the finest ingredients, this eggless jar cake is perfect for any occasion. Weighing 300gm, it's the ideal treat for yourself or a loved one.`,
        weight: "300gm",
        defaultWeight: "300gm",
        weights: [{ label: "300gm", price: 200 }],
        ratings: 4.5,
        numOfReviews: 0,
        featured: false,
        isActive: true,
        isFeatured: false,
        isBestSeller: false,
        isTrending: false,
        customizable: false,
        sameDayDelivery: true,
        tags: ["jar cake", "eggless", "freshly baked"],
        sortOrder: 0,
        stock: 50,
      });

      await product.save();
      console.log(`  Saved product: ${productId} (${cake.name})`);
    }

    console.log("\nAll 4 jar cakes added successfully!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
