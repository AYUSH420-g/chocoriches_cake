import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config();

const productSchema = new mongoose.Schema({
  name: String,
  image: String,
  description: String
}, { strict: false });

const Product = mongoose.model("Product", productSchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://admin:admin123@cluster0.abc.mongodb.net/test?retryWrites=true&w=majority"); // I'll use the env var
  const products = await Product.find({});
  console.log(JSON.stringify(products, null, 2));
  process.exit(0);
}
run();
