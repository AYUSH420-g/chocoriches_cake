import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config();

const subcategorySchema = new mongoose.Schema({
  name: String,
  category: String,
  sortOrder: Number
}, { strict: false });

const Subcategory = mongoose.model("Subcategory", subcategorySchema);

async function run() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required.");
  await mongoose.connect(process.env.MONGODB_URI);
  
  const subs = await Subcategory.find({}).sort({ sortOrder: 1, name: 1 }).lean();
  console.log("Current subcategories and their sort order:");
  subs.forEach((s, i) => {
    console.log(`  ${i}: ${s.name} (category: ${s.category}, sortOrder: ${s.sortOrder ?? "NOT SET"})`);
  });

  for (let i = 0; i < subs.length; i++) {
    if (subs[i].sortOrder === undefined || subs[i].sortOrder === null || subs[i].sortOrder !== i) {
      await Subcategory.findByIdAndUpdate(subs[i]._id, { sortOrder: i });
      console.log(`  Updated ${subs[i].name} sortOrder to ${i}`);
    }
  }

  console.log("\nDone normalizing subcategory sort orders.");
  process.exit(0);
}
run();
