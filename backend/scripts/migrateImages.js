import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";
import { config } from "../src/config/env.js";
import { products, profileUser } from "../src/data/seedData.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

async function uploadToCloudinary(filePathOrUrl, publicId) {
  try {
    const result = await cloudinary.uploader.upload(filePathOrUrl, {
      folder: "chocoriches_migrated",
      public_id: publicId,
    });
    return result.secure_url;
  } catch (error) {
    console.error(`Failed to upload ${filePathOrUrl}:`, error);
    return null;
  }
}

async function run() {
  let urlMap = {};
  const mapPath = path.join(__dirname, "mapping.json");
  if (fs.existsSync(mapPath)) {
    urlMap = JSON.parse(fs.readFileSync(mapPath, "utf-8"));
  }
  
  console.log("Migrating product images...");
  for (const product of products) {
    if (product.image && !urlMap[product.image]) {
      console.log(`Uploading ${product.image}...`);
      const newUrl = await uploadToCloudinary(product.image, `product_${product.id}_img`);
      if (newUrl) urlMap[product.image] = newUrl;
    }
    if (product.detailImage && !urlMap[product.detailImage]) {
      console.log(`Uploading ${product.detailImage}...`);
      const newUrl = await uploadToCloudinary(product.detailImage, `product_${product.id}_detail`);
      if (newUrl) urlMap[product.detailImage] = newUrl;
    }
  }

  if (profileUser.avatar && !urlMap[profileUser.avatar]) {
    console.log(`Uploading profile avatar...`);
    const newUrl = await uploadToCloudinary(profileUser.avatar, `profile_avatar`);
    if (newUrl) urlMap[profileUser.avatar] = newUrl;
  }

  const frontendPublicDir = path.resolve(__dirname, "../../frontend/public");
  const localImages = ["auth-banner.png", "hero-banner.png", "hreo-banner-2.png", "hero-banner-3.png"];
  
  console.log("Migrating local frontend assets...");
  for (const file of localImages) {
    const filePath = path.join(frontendPublicDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`Uploading ${file}...`);
      const newUrl = await uploadToCloudinary(filePath, path.parse(file).name);
      if (newUrl) urlMap[`/${file}`] = newUrl;
    } else {
      console.log(`Skipping ${file}, does not exist.`);
    }
  }

  console.log("\nMigration complete! Here is the URL mapping:");
  console.log(JSON.stringify(urlMap, null, 2));

  fs.writeFileSync(path.join(__dirname, "mapping.json"), JSON.stringify(urlMap, null, 2));
}

run();
