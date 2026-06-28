import mongoose from "mongoose";
import { Category } from "./backend/src/models/Category.js";
import { Subcategory } from "./backend/src/models/Subcategory.js";
import dotenv from "dotenv";

dotenv.config({ path: "./backend/.env" });

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const cats = await Category.find({}).sort({ createdAt: 1 });
  for (let i = 0; i < cats.length; i++) {
    cats[i].sortOrder = i + 1;
    await cats[i].save();
  }
  
  const subcats = await Subcategory.find({}).sort({ createdAt: 1 });
  for (let i = 0; i < subcats.length; i++) {
    subcats[i].sortOrder = i + 1;
    await subcats[i].save();
  }
  
  console.log("Migrated", cats.length, "categories and", subcats.length, "subcategories.");
  process.exit(0);
}
migrate();
