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
    sameDayDelivery: Boolean(product.sameDayDelivery),
  };
}

export async function listProducts(req, res) {
  const { category, subcategory, featured, sameDay, bestseller, maxPrice, sortBy, q, page, limit: rawLimit } = req.query;
  const query = {};

  if (category && category !== "All") {
    query.$or = [{ category }, { categories: category }];
  }
  if (subcategory) {
    query.$and = [...(query.$and || []), { $or: [{ subcategory }, { subcategories: subcategory }] }];
  }
  if (sameDay === "true") {
    query.sameDayDelivery = true;
  }
  if (bestseller === "true") {
    query.$or = [...(query.$or || []), { isBestSeller: true }, { featured: true }];
  }
  if (maxPrice) {
    query.price = { $lte: Number(maxPrice) };
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
      { $or: [{ name: searchRegex }, { description: searchRegex }, { category: searchRegex }, { categories: searchRegex }, { subcategory: searchRegex }, { subcategories: searchRegex }] },
    ];
  }

  let sortCriteria = { sortOrder: 1, createdAt: 1 };
  if (sortBy === "Price: Low to High") sortCriteria = { price: 1 };
  else if (sortBy === "Price: High to Low") sortCriteria = { price: -1 };
  else if (sortBy === "Name: A to Z") sortCriteria = { name: 1 };
  else if (sortBy === "Newest") sortCriteria = { createdAt: -1 };

  // If page param is provided, return paginated response
  if (page) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(60, Math.max(1, parseInt(rawLimit, 10) || 12));

    if (isDatabaseConnected()) {
      const total = await Product.countDocuments(query);
      const totalPages = Math.ceil(total / limitNum);
      const products = await Product.find(query)
        .sort(sortCriteria)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean();

      return res.json({
        products: products.map(listProduct),
        currentPage: pageNum,
        totalPages,
        hasMore: pageNum < totalPages,
      });
    }

    // Memory store fallback with pagination
    let source = memory.products
      .filter((product) => !category || category === "All" || product.category === category || product.categories?.includes(category))
      .filter((product) => !subcategory || product.subcategory === subcategory || (product.subcategories && product.subcategories.includes(subcategory)))
      .filter((product) => product.isActive !== false)
      .filter((product) => featured !== "true" || product.featured || product.isFeatured)
      .filter((product) => sameDay !== "true" || product.sameDayDelivery)
      .filter((product) => bestseller !== "true" || product.isBestSeller || product.featured)
      .filter((product) => !maxPrice || Number(product.price) <= Number(maxPrice))
      .filter((product) => {
        if (!q) return true;
        const searchText = `${product.name} ${product.description} ${product.category} ${(product.categories || []).join(" ")} ${product.subcategory || ""} ${(product.subcategories || []).join(" ")}`.toLowerCase();
        return searchText.includes(String(q).trim().toLowerCase());
      })
      .sort((left, right) => {
        if (sortBy === "Price: Low to High") return Number(left.price) - Number(right.price);
        if (sortBy === "Price: High to Low") return Number(right.price) - Number(left.price);
        if (sortBy === "Name: A to Z") return String(left.name || "").localeCompare(String(right.name || ""));
        if (sortBy === "Newest") return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
        return Number(left.sortOrder || 0) - Number(right.sortOrder || 0);
      });

    const total = source.length;
    const totalPages = Math.ceil(total / limitNum);
    const paged = source.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    return res.json({
      products: paged.map(listProduct),
      currentPage: pageNum,
      totalPages,
      hasMore: pageNum < totalPages,
    });
  }

  // No page param → return flat array (backward compat for ProductDetail, Profile, etc.)
  const source = isDatabaseConnected()
    ? await Product.find(query).sort(sortCriteria).lean()
    : memory.products
        .filter((product) => !category || category === "All" || product.category === category || product.categories?.includes(category))
        .filter((product) => !subcategory || product.subcategory === subcategory || (product.subcategories && product.subcategories.includes(subcategory)))
        .filter((product) => product.isActive !== false)
        .filter((product) => featured !== "true" || product.featured || product.isFeatured)
        .filter((product) => sameDay !== "true" || product.sameDayDelivery)
        .filter((product) => bestseller !== "true" || product.isBestSeller || product.featured)
        .filter((product) => !maxPrice || Number(product.price) <= Number(maxPrice))
        .filter((product) => {
          if (!q) {
            return true;
          }
          const searchText = `${product.name} ${product.description} ${product.category} ${(product.categories || []).join(" ")} ${product.subcategory || ""} ${(product.subcategories || []).join(" ")}`.toLowerCase();
          return searchText.includes(String(q).trim().toLowerCase());
        })
        .sort((left, right) => {
          if (sortBy === "Price: Low to High") return Number(left.price) - Number(right.price);
          if (sortBy === "Price: High to Low") return Number(right.price) - Number(left.price);
          if (sortBy === "Name: A to Z") return String(left.name || "").localeCompare(String(right.name || ""));
          if (sortBy === "Newest") return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
          return Number(left.sortOrder || 0) - Number(right.sortOrder || 0);
        });

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
