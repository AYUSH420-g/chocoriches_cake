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
import { Category } from "../src/models/Category.js";
import { Subcategory } from "../src/models/Subcategory.js";

const SUBCATEGORY_NAME = "Oreo Cakes";

const cakes = [
  {
    file: path.resolve(__dirname, "oreo_1.png"),
    name: "Classic Oreo Drip Cake",
    publicId: "oreo_classic_drip",
    idSuffix: "classic-drip",
  },
  {
    file: path.resolve(__dirname, "oreo_2.jpg"),
    name: "Oreo Chocolate Rosette Cake",
    publicId: "oreo_choco_rosette",
    idSuffix: "choco-rosette",
  },
  {
    file: path.resolve(__dirname, "oreo_3.jpg"),
    name: "Oreo Dark Chocolate Cake",
    publicId: "oreo_dark_choco",
    idSuffix: "dark-choco",
  },
  {
    file: path.resolve(__dirname, "oreo_4.png"),
    name: "Oreo Marble Drip Cake",
    publicId: "oreo_marble_drip",
    idSuffix: "marble-drip",
  },
  {
    file: path.resolve(__dirname, "oreo_5.jpg"),
    name: "KitKat Oreo Fusion Cake",
    publicId: "oreo_kitkat_fusion",
    idSuffix: "kitkat-fusion",
  },
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB\n");

    // Upload and add the 5 new Oreo Cakes
    console.log("Adding 5 new Oreo Cakes...");
    for (const cake of cakes) {
      console.log(`Uploading ${cake.name} to Cloudinary...`);
      const uploadResult = await cloudinary.uploader.upload(cake.file, {
        folder: "chocoriches_oreo",
        public_id: cake.publicId,
        overwrite: true,
      });
      const imageUrl = uploadResult.secure_url;
      console.log(`  Uploaded: ${imageUrl}`);

      const productId = `prod-oreo-${cake.idSuffix}`;

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
        category: "Birthday", // primary
        categories: ["Birthday", "Anniversary"],
        subcategory: SUBCATEGORY_NAME,
        subcategories: [SUBCATEGORY_NAME],
        description: `Delicious eggless ${cake.name}, freshly baked with real Oreos. Perfect for birthdays and anniversaries.`,
        longDescription: `Indulge in our freshly baked ${cake.name}. This eggless cake is crafted with a rich, moist sponge, layered with creamy frosting and packed with crushed Oreos. Weighing 0.5kg, it's the perfect treat for any celebration.`,
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
        tags: ["oreo", "eggless", "birthday", "anniversary", "chocolate"],
        sortOrder: 0,
        stock: 50,
      });

      await product.save();
      console.log(`  ✅ Saved: ${cake.name} (${productId})`);
    }

    console.log(`\n🎉 Added 5 new Oreo Cakes under Birthday & Anniversary > ${SUBCATEGORY_NAME}!`);
    console.log("   Weight: 0.5kg | Price: ₹499");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
