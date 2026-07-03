import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config();

const categorySchema = new mongoose.Schema({
  name: String,
  sortOrder: Number
}, { strict: false });

const Category = mongoose.model("Category", categorySchema);

async function run() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required.");
  await mongoose.connect(process.env.MONGODB_URI);
  
  const cats = await Category.find({}).sort({ sortOrder: 1, name: 1 }).lean();
  console.log("Current categories and their sort order:");
  cats.forEach((c, i) => {
    console.log(`  ${i}: ${c.name} (sortOrder: ${c.sortOrder ?? "NOT SET"})`);
  });

  // Assign sequential sortOrder to any that don't have one
  let needsUpdate = false;
  for (let i = 0; i < cats.length; i++) {
    if (cats[i].sortOrder === undefined || cats[i].sortOrder === null || cats[i].sortOrder !== i) {
      needsUpdate = true;
      await Category.findByIdAndUpdate(cats[i]._id, { sortOrder: i });
      console.log(`  Updated ${cats[i].name} sortOrder to ${i}`);
    }
  }

  if (!needsUpdate) {
    console.log("\nAll categories already have correct sortOrder values.");
  } else {
    console.log("\nDone normalizing sort orders.");
  }

  process.exit(0);
}
run();
