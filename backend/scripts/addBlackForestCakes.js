import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Import models
import { Product } from "../src/models/Product.js";
import { Category } from "../src/models/Category.js";
import { Subcategory } from "../src/models/Subcategory.js";

const CATEGORY_NAME = "Birthday & Anniversary";
const CATEGORY_SLUG = "birthday-anniversary";
const SUBCATEGORY_NAME = "Black Forest";
const SUBCATEGORY_SLUG = "black-forest";

const blackForestCakes = [
  {
    file: path.resolve(__dirname, "blackforest_1.png"),
    name: "Black Forest Cherry Drip Cake",
    publicId: "blackforest_cherry_drip",
  },
  {
    file: path.resolve(__dirname, "blackforest_2.png"),
    name: "Black Forest Rosette Cake",
    publicId: "blackforest_rosette",
  },
  {
    file: path.resolve(__dirname, "blackforest_3.png"),
    name: "Happy Birthday Black Forest Cake",
    publicId: "blackforest_happy_birthday",
  },
  {
    file: path.resolve(__dirname, "blackforest_4.png"),
    name: "Classic Black Forest Cake",
    publicId: "blackforest_classic",
  },
  {
    file: path.resolve(__dirname, "blackforest_5.jpg"),
    name: "Black Forest Naked Layer Cake",
    publicId: "blackforest_naked_layer",
  },
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // ── Ensure category exists ──
    let category = await Category.findOne({ slug: CATEGORY_SLUG });
    if (!category) {
      category = await Category.create({
        name: CATEGORY_NAME,
        slug: CATEGORY_SLUG,
        description: "Cakes perfect for birthday and anniversary celebrations",
        isActive: true,
        sortOrder: 0,
      });
      console.log(`Created category: ${CATEGORY_NAME}`);
    } else {
      console.log(`Category already exists: ${CATEGORY_NAME}`);
    }

    // ── Ensure subcategory exists ──
    let subcategory = await Subcategory.findOne({ slug: SUBCATEGORY_SLUG });
    if (!subcategory) {
      subcategory = await Subcategory.create({
        name: SUBCATEGORY_NAME,
        slug: SUBCATEGORY_SLUG,
        category: CATEGORY_NAME,
        isActive: true,
        sortOrder: 0,
      });
      console.log(`Created subcategory: ${SUBCATEGORY_NAME}`);
    } else {
      console.log(`Subcategory already exists: ${SUBCATEGORY_NAME}`);
    }

    // ── Upload images & create products ──
    for (const cake of blackForestCakes) {
      console.log(`\nUploading ${cake.name} to Cloudinary...`);

      const uploadResult = await cloudinary.uploader.upload(cake.file, {
        folder: "chocoriches_blackforest",
        public_id: cake.publicId,
        overwrite: true,
      });

      const imageUrl = uploadResult.secure_url;
      console.log(`  Uploaded: ${imageUrl}`);

      const productId = `prod-bf-${cake.publicId}-${Date.now()}`;
      const product = new Product({
        id: productId,
        name: cake.name,
        price: 499,
        image: imageUrl,
        images: [{ url: imageUrl, alt: cake.name }],
        category: CATEGORY_NAME,
        categories: [CATEGORY_NAME],
        subcategory: SUBCATEGORY_NAME,
        subcategories: [SUBCATEGORY_NAME],
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
      console.log(`  Saved product: ${productId} (${cake.name})`);
    }

    console.log("\n✅ All 5 Black Forest cakes added successfully!");
    console.log(`   Category: ${CATEGORY_NAME}`);
    console.log(`   Subcategory: ${SUBCATEGORY_NAME}`);
    console.log(`   Weight: 0.5kg | Price: ₹499`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
