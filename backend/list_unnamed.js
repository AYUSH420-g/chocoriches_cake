import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config();

const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model("Product", productSchema);

async function run() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required.");
  await mongoose.connect(process.env.MONGODB_URI);
  const products = await Product.find({});
  const toFix = products.filter(p => {
    const name = p.get("name") || "";
    // If name is very short, or contains single letters, or "bento" with a letter
    return name.length < 5 || name.toLowerCase().includes("bento") || name.toLowerCase().includes("cupcake");
  }).map(p => ({
    id: p._id,
    name: p.get("name"),
    image: p.get("image")
  }));
  console.log(JSON.stringify(toFix, null, 2));
  process.exit(0);
}
run();
