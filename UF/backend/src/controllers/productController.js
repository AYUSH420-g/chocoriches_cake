import { isDatabaseConnected } from "../db.js";
import { Product } from "../models/Product.js";
import {
  adminProductView,
  detailProduct,
  listProduct,
  productDetailSource,
  productId,
  productImage,
  productPrice,
} from "../utils/formatters.js";
import { memory } from "../utils/memoryStore.js";

export async function findProductForCart(productIdValue) {
  const requestedId = String(productIdValue || "");

  if (isDatabaseConnected()) {
    const byPublicId = await Product.findOne({ id: requestedId }).lean();
    if (byPublicId) {
      return byPublicId;
    }

    if (/^[0-9a-fA-F]{24}$/.test(requestedId)) {
      return Product.findById(requestedId).lean();
    }
  }

  return memory.products.find((item) => productId(item) === requestedId) || memory.products[0];
}

export function productCartSnapshot(product) {
  return {
    name: product.name,
    price: productPrice(product),
    image: productImage(product).replace("w=600", "w=200"),
  };
}

export async function listProducts(req, res) {
  const { category, featured } = req.query;
  const query = {};

  if (category && category !== "All") {
    query.category = category;
  }

  if (featured === "true") {
    query.$or = [{ featured: true }, { isFeatured: true }];
  }

  const source = isDatabaseConnected()
    ? await Product.find(query).sort({ sortOrder: 1, createdAt: 1 }).lean()
    : memory.products
        .filter((product) => !query.category || product.category === query.category)
        .filter((product) => featured !== "true" || product.featured || product.isFeatured)
        .sort((left, right) => Number(left.sortOrder || 0) - Number(right.sortOrder || 0));

  res.json(source.map(listProduct));
}

export async function productDetail(req, res) {
  const source = isDatabaseConnected()
    ? await Product.find({}).sort({ sortOrder: 1 }).lean()
    : memory.products;
  const product = productDetailSource(source, req.params.id);

  res.json(detailProduct(product));
}

export {
  adminProductView,
};
