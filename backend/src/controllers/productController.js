import { isDatabaseConnected } from "../db.js";
import { Product } from "../models/Product.js";
import {
  adminProductView,
  detailProduct,
  listProduct,
  productId,
  productImage,
  productPrice,
  productPriceForWeight,
} from "../utils/formatters.js";
import { memory } from "../utils/memoryStore.js";

export async function findProductForCart(productIdValue) {
  const requestedId = String(productIdValue || "");

  if (isDatabaseConnected()) {
    const byPublicId = await Product.findOne({ id: requestedId, isActive: { $ne: false } }).lean();
    if (byPublicId) {
      return byPublicId;
    }

    if (/^[0-9a-fA-F]{24}$/.test(requestedId)) {
      return Product.findOne({ _id: requestedId, isActive: { $ne: false } }).lean();
    }

    return null;
  }

  return memory.products.find((item) => productId(item) === requestedId) || memory.products[0];
}

export function productCartSnapshot(product, weightLabel = "") {
  return {
    name: product.name,
    price: productPriceForWeight(product, weightLabel),
    image: productImage(product).replace("w=600", "w=200"),
  };
}

export async function listProducts(req, res) {
  const { category, featured, q } = req.query;
  const query = {};

  if (category && category !== "All") {
    query.$or = [{ category }, { categories: category }];
  }

  query.isActive = { $ne: false };

  if (featured === "true") {
    const featuredQuery = { $or: [{ featured: true }, { isFeatured: true }] };
    query.$and = [...(query.$and || []), featuredQuery];
  }

  if (q) {
    const searchRegex = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$and = [
      ...(query.$and || []),
      { $or: [{ name: searchRegex }, { description: searchRegex }, { category: searchRegex }, { categories: searchRegex }, { subcategory: searchRegex }] },
    ];
  }

  const source = isDatabaseConnected()
    ? await Product.find(query).sort({ sortOrder: 1, createdAt: 1 }).lean()
    : memory.products
        .filter((product) => !category || category === "All" || product.category === category || product.categories?.includes(category))
        .filter((product) => product.isActive !== false)
        .filter((product) => featured !== "true" || product.featured || product.isFeatured)
        .filter((product) => {
          if (!q) {
            return true;
          }
          const searchText = `${product.name} ${product.description} ${product.category} ${(product.categories || []).join(" ")} ${product.subcategory || ""}`.toLowerCase();
          return searchText.includes(String(q).trim().toLowerCase());
        })
        .sort((left, right) => Number(left.sortOrder || 0) - Number(right.sortOrder || 0));

  res.json(source.map(listProduct));
}

export async function productDetail(req, res) {
  const source = isDatabaseConnected()
    ? await Product.find({ isActive: { $ne: false } }).sort({ sortOrder: 1 }).lean()
    : memory.products.filter((item) => item.isActive !== false);
  const requestedId = String(req.params.id || "");
  const product = source.find((item) => productId(item) === requestedId);

  if (!product) {
    res.status(404).json({ message: "Product not found." });
    return;
  }

  res.json(detailProduct(product));
}

export {
  adminProductView,
};
