import { detailedProductIds, products as seedProducts } from "../data/seedData.js";
import { memory, profileUser } from "./memoryStore.js";

export function slugify(value = "") {
  return (
    String(value)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `category-${Date.now()}`
  );
}

export function todayIso() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function objectIdFilter(id) {
  return /^[0-9a-fA-F]{24}$/.test(String(id || "")) ? { _id: id } : { id };
}

export function publicUser(user = profileUser) {
  return {
    id: String(user._id || user.id || user.email || ""),
    name: user.name || profileUser.name,
    email: user.email || profileUser.email,
    phone: user.phone || "",
    avatar: user.avatar || profileUser.avatar,
    membership: user.membership || profileUser.membership,
    role: user.role || "user",
    isBlocked: Boolean(user.isBlocked),
    emailVerified: Boolean(user.emailVerified),
    blockedReason: user.blockedReason || "",
    stampCount: Number(user.stampCount || 0),
    addresses: Array.isArray(user.addresses) ? user.addresses : [],
    createdAt: user.createdAt,
  };
}

export function adminViewUser(user = profileUser) {
  return {
    ...publicUser(user),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function productId(product) {
  return String(product.id || product._id || product.name || "1");
}

export function productImage(product) {
  return (
    product.image ||
    product.images?.[0]?.url ||
    product.images?.[0] ||
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800"
  );
}

export function productWeightOptions(product = {}) {
  const rawWeights = Array.isArray(product.weights) ? product.weights : [];
  const weights = rawWeights
    .map((weight) => ({
      label: String(weight.label || weight.name || "").trim(),
      price: Number(weight.price || 0),
    }))
    .filter((weight) => weight.label && weight.price > 0);

  if (weights.length) {
    return weights;
  }

  return [
    {
      label: product.weight || product.defaultWeight || "Half Kg",
      price: Number(product.discountPrice || product.price || 0),
    },
  ].filter((weight) => weight.price > 0);
}

export function productDefaultWeight(product = {}) {
  const weights = productWeightOptions(product);
  const defaultWeight = String(product.defaultWeight || product.weight || "").trim();
  return weights.some((weight) => weight.label === defaultWeight)
    ? defaultWeight
    : weights[0]?.label || "Half Kg";
}

export function productPriceForWeight(product = {}, weightLabel = "") {
  const weights = productWeightOptions(product);
  const requestedWeight = String(weightLabel || productDefaultWeight(product)).trim().toLowerCase();
  const matchedWeight = weights.find((weight) => weight.label.toLowerCase() === requestedWeight);
  return Number((matchedWeight || weights[0])?.price || product.discountPrice || product.price || 0);
}

export function productPrice(product) {
  return productPriceForWeight(product, productDefaultWeight(product));
}

export function productCategories(product = {}) {
  const categories = Array.isArray(product.categories) ? product.categories : [];
  const normalized = categories.map((category) => String(category || "").trim()).filter(Boolean);
  const primary = String(product.category || "").trim();
  return [...new Set([primary, ...normalized].filter(Boolean))];
}

export function listProduct(product) {
  const weightOptions = productWeightOptions(product);
  const defaultWeight = productDefaultWeight(product);
  const categories = productCategories(product);
  return {
    id: productId(product),
    name: product.name,
    price: productPrice(product),
    discountPercent: Number(product.discountPercent || 0),
    image: productImage(product),
    ratings: Number(product.ratings || 0),
    numOfReviews: Number(product.numOfReviews || 0),
    category: categories[0] || "Cakes",
    categories: categories.length ? categories : ["Cakes"],
    subcategory: product.subcategory || (product.subcategories && product.subcategories[0]) || "",
    subcategories: Array.isArray(product.subcategories) ? product.subcategories : (product.subcategory ? [product.subcategory] : []),
    description: product.description || product.longDescription || "Fresh cake baked for your celebration.",
    featured: Boolean(product.featured || product.isFeatured),
    isActive: product.isActive !== false,
    isBestSeller: Boolean(product.isBestSeller),
    isTrending: Boolean(product.isTrending),
    stock: Number(product.stock ?? 1),
    defaultWeight,
    weightOptions,
    tags: product.tags || [],
    sortOrder: Number(product.sortOrder || 0),
    sameDayDelivery: Boolean(product.sameDayDelivery),
    hasBaseAndCream: product.hasBaseAndCream !== false,
    createdAt: product.createdAt,
  };
}

export function detailProduct(product = seedProducts[0]) {
  const weightOptions = productWeightOptions(product);
  const defaultWeight = productDefaultWeight(product);
  const categories = productCategories(product);
  return {
    id: productId(product),
    name: product.name,
    price: productPrice(product),
    discountPercent: Number(product.discountPercent || 0),
    image: product.detailImage || productImage(product),
    category: categories[0] || "Cakes",
    categories: categories.length ? categories : ["Cakes"],
    subcategory: product.subcategory || (product.subcategories && product.subcategories[0]) || "",
    subcategories: Array.isArray(product.subcategories) ? product.subcategories : (product.subcategory ? [product.subcategory] : []),
    description: product.longDescription || product.description || "Fresh cake baked for your celebration.",
    ingredients: product.ingredients || product.flavors?.join(", ") || seedProducts[0].ingredients,
    allergens: product.allergens || seedProducts[0].allergens,
    ratings: product.ratings,
    numOfReviews: product.numOfReviews,
    stock: product.stock,
    defaultWeight,
    weightOptions,
    isActive: product.isActive !== false,
    sameDayDelivery: Boolean(product.sameDayDelivery),
    hasBaseAndCream: product.hasBaseAndCream !== false,
  };
}

export function adminProductView(product) {
  return {
    ...detailProduct(product),
    id: productId(product),
    originalPrice: Number(product.price || productPrice(product)),
    discountPrice: Number(product.discountPrice || 0),
    discountPercent: Number(product.discountPercent || 0),
    images: product.images?.length ? product.images : [{ url: productImage(product), alt: product.name }],
    flavors: product.flavors || [],
    weight: productDefaultWeight(product),
    defaultWeight: productDefaultWeight(product),
    weights: productWeightOptions(product),
    weightOptions: productWeightOptions(product),
    subcategory: product.subcategory || (product.subcategories && product.subcategories[0]) || "",
    subcategories: Array.isArray(product.subcategories) ? product.subcategories : (product.subcategory ? [product.subcategory] : []),
    categories: productCategories(product),
    isActive: product.isActive !== false,
    featured: Boolean(product.featured || product.isFeatured),
    isFeatured: Boolean(product.featured || product.isFeatured),
    isBestSeller: Boolean(product.isBestSeller),
    isTrending: Boolean(product.isTrending),
    customizable: Boolean(product.customizable),
    hasBaseAndCream: product.hasBaseAndCream !== false,
    tags: product.tags || [],
    sortOrder: Number(product.sortOrder || 0),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export function productDetailSource(allProducts, id) {
  const requestedId = String(id || "1");
  const matchedProduct = allProducts.find((product) => productId(product) === requestedId);
  if (matchedProduct) {
    return matchedProduct;
  }

  if (!detailedProductIds.has(id)) {
    return allProducts.find((product) => product.id === "1") || allProducts[0];
  }

  return allProducts.find((product) => product.id === id) || allProducts[0];
}

export function settingView(setting = memory.setting) {
  return {
    maintenanceMode: Boolean(setting?.maintenanceMode),
    maintenanceMessage: setting?.maintenanceMessage || memory.setting.maintenanceMessage,
    dailyCakeLimit: Number(setting?.dailyCakeLimit || 0),
  };
}

export function pincodeView(pincode) {
  return {
    id: String(pincode._id || pincode.pincode),
    pincode: pincode.pincode,
    isActive: Boolean(pincode.isActive),
  };
}

export function categoryView(category) {
  return {
    id: String(category._id || category.slug || category.name),
    name: category.name,
    slug: category.slug || slugify(category.name),
    description: category.description || "",
    image: category.image || "",
    isActive: category.isActive !== false,
    sortOrder: Number(category.sortOrder || 0),
  };
}

export function subcategoryView(subcategory) {
  return {
    id: String(subcategory._id || subcategory.slug || subcategory.name),
    name: subcategory.name,
    slug: subcategory.slug || `${slugify(subcategory.category)}-${slugify(subcategory.name)}`,
    category: subcategory.category,
    isActive: subcategory.isActive !== false,
    sortOrder: Number(subcategory.sortOrder || 0),
  };
}

export function blockedDateView(blockedDate) {
  return {
    id: String(blockedDate._id || blockedDate.date),
    date: blockedDate.date,
    reason: blockedDate.reason || "",
    isActive: blockedDate.isActive !== false,
  };
}

export function publicOrderView(order = {}) {
  const orderId = String(order.id || order.orderId || order._id || "");
  return {
    id: orderId,
    orderId,
    date: order.date || "",
    total: Number(order.total || 0),
    status: order.status || "Processing",
    items: Array.isArray(order.items) ? order.items : [],
    itemCount: Number(order.itemCount || (Array.isArray(order.items) ? order.items.length : 0)),
    customerName: order.customerName || "",
    customerEmail: order.customerEmail || "",
    customerPhone: order.customerPhone || "",
    deliveryAddress: order.deliveryAddress || "",
    deliveryPincode: order.deliveryPincode || "",
    deliveryDate: order.deliveryDate || "",
    deliveryTimeSlot: order.deliveryTimeSlot || "",
    deliveryOption: order.deliveryOption || "pickup",
    isStampRewardOrder: Boolean(order.isStampRewardOrder),
    cancelReason: order.cancelReason || "",
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export function adminOrderView(order = {}) {
  const publicId = String(order.id || order.orderId || order._id || "");
  return {
    ...publicOrderView(order),
    id: String(order._id || publicId),
    orderId: publicId,
    payment: order.payment || {},
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}
