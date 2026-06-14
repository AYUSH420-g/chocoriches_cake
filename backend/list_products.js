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
  await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://admin:admin123@cluster0.abc.mongodb.net/test?retryWrites=true&w=majority");
  const products = await Product.find({});
  const toFix = products.map(p => ({id: p._id, name: p.name, image: p.image}));
  console.log(JSON.stringify(toFix, null, 2));
  process.exit(0);
}
run();
