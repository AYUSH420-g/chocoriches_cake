import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config();

const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model("Product", productSchema);

async function run() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required.");
  await mongoose.connect(process.env.MONGODB_URI);
  const products = await Product.find({ name: /shake/i }, { id: 1, name: 1, price: 1, image: 1 });
  console.log("Shakes:", products);
  process.exit(0);
}
run();
