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

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB\n");

    const categoryName = "Trending 🔥";
    const categorySlug = "trending";
    
    // 1. Create or ensure category exists
    let category = await Category.findOne({ slug: categorySlug });
    if (!category) {
      category = await Category.create({
        name: categoryName,
        slug: categorySlug,
        description: "Explore our most popular and trending treats.",
        isActive: true,
        sortOrder: 0,
      });
      console.log(`Created category: ${categoryName}`);
    } else {
      console.log(`Category already exists: ${categoryName}`);
    }

    // 2. Upload and add the trending product
    console.log("Uploading Trending Cake image...");
    const imagePath = path.resolve(__dirname, "trending_cake.jpg");
    const uploadResult = await cloudinary.uploader.upload(imagePath, {
      folder: "chocoriches_trending",
      public_id: "trending_choco_dream",
      overwrite: true,
    });
    const imageUrl = uploadResult.secure_url;
    console.log(`  Uploaded: ${imageUrl}`);

    const productId = `prod-trending-dream-cake`;

    let product = await Product.findOne({ id: productId });
    if (product) {
      console.log(`  Skipping (already exists): Dream Cake`);
    } else {
      product = new Product({
        id: productId,
        name: "Chocolate Dream Cake (In Tin)",
        price: 250,
        image: imageUrl,
        images: [{ url: imageUrl, alt: "Chocolate Dream Cake" }],
        category: categoryName,
        categories: [categoryName],
        description: "The viral chocolate dream cake layered with rich ganache, presented in a premium tin.",
        longDescription: "Indulge in our famous 5 in 1 Chocolate Dream Cake, layered to perfection with moist sponge, chocolate mousse, velvety ganache, crackling chocolate disc, and dusted with premium cocoa powder. Served in a beautiful reusable tin. Weighs 300 gm.",
        weight: "300 gm",
        defaultWeight: "300 gm",
        weights: [{ label: "300 gm", price: 250 }],
        ratings: 5.0,
        numOfReviews: 12,
        featured: true,
        isActive: true,
        isTrending: true,
        sameDayDelivery: true,
        tags: ["trending", "dream cake", "chocolate", "eggless"],
        sortOrder: 0,
        stock: 50,
      });

      await product.save();
      console.log(`  ✅ Saved Product: Chocolate Dream Cake (${productId})`);
    }

    console.log(`\n🎉 Added Trending category and product!`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
