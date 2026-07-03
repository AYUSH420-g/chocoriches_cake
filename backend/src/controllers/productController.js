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

const LIST_PRODUCT_FIELDS = [
  "id",
  "name",
  "price",
  "discountPrice",
  "discountPercent",
  "image",
  "images",
  "category",
  "categories",
  "subcategory",
  "subcategories",
  "description",
  "longDescription",
  "weights",
  "weight",
  "defaultWeight",
  "ratings",
  "numOfReviews",
  "featured",
  "isFeatured",
  "isBestSeller",
  "isTrending",
  "stock",
  "tags",
  "sortOrder",
  "sameDayDelivery",
  "createdAt",
].join(" ");
const PRODUCT_LIST_CACHE_TTL_MS = 60_000;
const PRODUCT_LIST_CACHE_MAX_ENTRIES = 250;
const productListCache = new Map();

function queryString(value, maxLength = 100) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function compareProducts(sort) {
  return (left, right) => {
    if (sort === "Price: Low to High") return productPrice(left) - productPrice(right) || productId(left).localeCompare(productId(right));
    if (sort === "Price: High to Low") return productPrice(right) - productPrice(left) || productId(left).localeCompare(productId(right));
    if (sort === "Name: A to Z") return String(left.name || "").localeCompare(String(right.name || "")) || productId(left).localeCompare(productId(right));
    if (sort === "Newest") return new Date(right.createdAt || 0) - new Date(left.createdAt || 0) || productId(right).localeCompare(productId(left));
    return Number(right.sortOrder || 0) - Number(left.sortOrder || 0) || new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
  };
}

function productListCacheKey({ category = "", subcategory = "", featured = "", sameDay = "", bestseller = "", maxPrice = "", sortBy = "", q = "", pageNum, limitNum }) {
  return JSON.stringify([category, subcategory, featured, sameDay, bestseller, maxPrice, sortBy, q, pageNum, limitNum]);
}

function getCachedProductList(key) {
  const cached = productListCache.get(key);
  if (!cached || cached.expiresAt <= Date.now()) {
    productListCache.delete(key);
    return null;
  }
  return cached.payload;
}

function setCachedProductList(key, payload) {
  if (!productListCache.has(key) && productListCache.size >= PRODUCT_LIST_CACHE_MAX_ENTRIES) {
    productListCache.delete(productListCache.keys().next().value);
  }
  productListCache.set(key, {
    expiresAt: Date.now() + PRODUCT_LIST_CACHE_TTL_MS,
    payload,
  });
}

async function databaseProductPage(query, sort, pageNum, limitNum, maxPrice = 0) {
  const matchingProducts = await Product.find(query)
    .limit(5000)
    .select(LIST_PRODUCT_FIELDS)
    .lean();
  const sortedProducts = matchingProducts
    .filter((product) => !maxPrice || productPrice(product) <= maxPrice)
    .sort(compareProducts(sort));
  const start = (pageNum - 1) * limitNum;
  const productsWithLookahead = sortedProducts.slice(start, start + limitNum + 1);
  const hasMore = productsWithLookahead.length > limitNum;
  const products = hasMore ? productsWithLookahead.slice(0, limitNum) : productsWithLookahead;

  return {
    products: products.map(listProduct),
    currentPage: pageNum,
    totalPages: hasMore ? pageNum + 1 : pageNum,
    hasMore,
  };
}

export function clearProductListCache() {
  productListCache.clear();
}

export async function warmProductListCache() {
  if (!isDatabaseConnected()) {
    return;
  }

  const baseQuery = { isActive: { $ne: false } };
  const pageNum = 1;
  const limitNum = 8;
  const [defaultPayload, newestPayload] = await Promise.all([
    databaseProductPage(baseQuery, "Recommended", pageNum, limitNum),
    databaseProductPage(baseQuery, "Newest", pageNum, limitNum),
  ]);

  setCachedProductList(productListCacheKey({ pageNum, limitNum }), defaultPayload);
  setCachedProductList(productListCacheKey({ pageNum, limitNum, sortBy: "Newest" }), newestPayload);
}

export async function findProductForCart(productIdValue) {
  const requestedId = typeof productIdValue === "string" ? productIdValue.trim().slice(0, 100) : "";

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
  const category = queryString(req.query.category);
  const subcategory = queryString(req.query.subcategory);
  const featured = queryString(req.query.featured, 10);
  const sameDay = queryString(req.query.sameDay, 10);
  const bestseller = queryString(req.query.bestseller, 10);
  const maxPrice = queryString(req.query.maxPrice, 20);
  const sort = queryString(req.query.sortBy, 40);
  const q = queryString(req.query.q, 100);
  const page = queryString(req.query.page, 10);
  const rawLimit = queryString(req.query.limit, 10);
  const query = {};

  if (category && category !== "All") {
    query.$or = [{ category }, { categories: category }];
  }
  if (subcategory) {
    if (category && category !== "All") {
      query.$and = [...(query.$and || []), {
        $or: [
          { subcategory: subcategory },
          { subcategories: subcategory },
          { subcategory: `${category}::${subcategory}` },
          { subcategories: `${category}::${subcategory}` }
        ]
      }];
    } else {
      const regex = new RegExp(`::${String(subcategory).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
      query.$and = [...(query.$and || []), {
        $or: [
          { subcategory: subcategory },
          { subcategories: subcategory },
          { subcategory: regex },
          { subcategories: regex }
        ]
      }];
    }
  }
  if (sameDay === "true") {
    query.sameDayDelivery = true;
  }
  if (bestseller === "true") {
    query.$and = [...(query.$and || []), { $or: [{ isBestSeller: true }, { featured: true }] }];
  }
  const numericMaxPrice = Number(maxPrice);
  const safeMaxPrice = Number.isFinite(numericMaxPrice) && numericMaxPrice > 0 ? numericMaxPrice : 0;

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

  // If page param is provided, return paginated response
  if (page) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(60, Math.max(1, parseInt(rawLimit, 10) || 12));

    if (isDatabaseConnected()) {
      const cacheKey = productListCacheKey({
        category,
        subcategory,
        featured,
        sameDay,
        bestseller,
        maxPrice,
        sortBy: sort,
        q,
        pageNum,
        limitNum,
      });
      const cached = getCachedProductList(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const payload = await databaseProductPage(query, sort, pageNum, limitNum, safeMaxPrice);
      setCachedProductList(cacheKey, payload);

      return res.json(payload);
    }

    // Memory store fallback with pagination
    let source = memory.products
      .filter((product) => !category || category === "All" || product.category === category || product.categories?.includes(category))
      .filter((product) => {
        if (!subcategory) return true;
        const matchOld = product.subcategory === subcategory || (product.subcategories && product.subcategories.includes(subcategory));
        if (category && category !== "All") {
          const matchNew = product.subcategory === `${category}::${subcategory}` || (product.subcategories && product.subcategories.includes(`${category}::${subcategory}`));
          return matchOld || matchNew;
        } else {
          const regex = new RegExp(`::${String(subcategory).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
          const matchNew = (product.subcategory && regex.test(product.subcategory)) || (product.subcategories && product.subcategories.some(s => regex.test(s)));
          return matchOld || matchNew;
        }
      })
      .filter((product) => product.isActive !== false)
      .filter((product) => featured !== "true" || product.featured || product.isFeatured)
      .filter((product) => sameDay !== "true" || product.sameDayDelivery)
      .filter((product) => bestseller !== "true" || product.isBestSeller || product.featured)
      .filter((product) => !safeMaxPrice || productPrice(product) <= safeMaxPrice)
      .filter((product) => {
        if (!q) return true;
        const searchText = `${product.name} ${product.description} ${product.category} ${(product.categories || []).join(" ")} ${product.subcategory || ""} ${(product.subcategories || []).join(" ")}`.toLowerCase();
        return searchText.includes(String(q).trim().toLowerCase());
      })
      .sort(compareProducts(sort));

    const start = (pageNum - 1) * limitNum;
    const pagedWithLookahead = source.slice(start, start + limitNum + 1);
    const hasMore = pagedWithLookahead.length > limitNum;
    const paged = hasMore ? pagedWithLookahead.slice(0, limitNum) : pagedWithLookahead;

    return res.json({
      products: paged.map(listProduct),
      currentPage: pageNum,
      totalPages: hasMore ? pageNum + 1 : pageNum,
      hasMore,
    });
  }

  // No page param → return flat array (backward compat for ProductDetail, Profile, etc.)
  const source = isDatabaseConnected()
    ? (await Product.find(query).limit(500).select(LIST_PRODUCT_FIELDS).lean())
      .filter((product) => !safeMaxPrice || productPrice(product) <= safeMaxPrice)
      .sort(compareProducts(sort))
    : memory.products.slice(0, 500)
      .filter((product) => !category || category === "All" || product.category === category || product.categories?.includes(category))
      .filter((product) => {
        if (!subcategory) return true;
        const matchOld = product.subcategory === subcategory || (product.subcategories && product.subcategories.includes(subcategory));
        if (category && category !== "All") {
          const matchNew = product.subcategory === `${category}::${subcategory}` || (product.subcategories && product.subcategories.includes(`${category}::${subcategory}`));
          return matchOld || matchNew;
        } else {
          const regex = new RegExp(`::${String(subcategory).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
          const matchNew = (product.subcategory && regex.test(product.subcategory)) || (product.subcategories && product.subcategories.some(s => regex.test(s)));
          return matchOld || matchNew;
        }
      })
        .filter((product) => product.isActive !== false)
        .filter((product) => featured !== "true" || product.featured || product.isFeatured)
        .filter((product) => sameDay !== "true" || product.sameDayDelivery)
        .filter((product) => bestseller !== "true" || product.isBestSeller || product.featured)
        .filter((product) => !safeMaxPrice || productPrice(product) <= safeMaxPrice)
        .filter((product) => {
          if (!q) {
            return true;
          }
          const searchText = `${product.name} ${product.description} ${product.category} ${(product.categories || []).join(" ")} ${product.subcategory || ""} ${(product.subcategories || []).join(" ")}`.toLowerCase();
          return searchText.includes(String(q).trim().toLowerCase());
        })
        .sort(compareProducts(sort));

  res.json(source.map(listProduct));
}

export async function productDetail(req, res) {
  const requestedId = String(req.params.id || "").slice(0, 100);
  const product = isDatabaseConnected()
    ? await Product.findOne(/^[0-9a-fA-F]{24}$/.test(requestedId)
      ? {
          isActive: { $ne: false },
          $or: [{ id: requestedId }, { _id: requestedId }],
        }
      : { id: requestedId, isActive: { $ne: false } }).lean()
    : memory.products.filter((item) => item.isActive !== false).find((item) => productId(item) === requestedId);

  if (!product) {
    res.status(404).json({ message: "Product not found." });
    return;
  }

  res.json(detailProduct(product));
}

export {
  adminProductView,
};
