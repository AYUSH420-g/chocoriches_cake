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
  return new Date().toISOString().slice(0, 10);
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
    blockedReason: user.blockedReason || "",
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

export function productPrice(product) {
  return Number(product.discountPrice || product.price || 0);
}

export function listProduct(product) {
  return {
    id: productId(product),
    name: product.name,
    price: productPrice(product),
    image: productImage(product),
    category: product.category || "Cakes",
    description: product.description || product.longDescription || "Fresh cake baked for your celebration.",
    featured: Boolean(product.featured || product.isFeatured),
  };
}

export function detailProduct(product = seedProducts[0]) {
  return {
    id: productId(product),
    name: product.name,
    price: productPrice(product),
    image: product.detailImage || productImage(product),
    category: product.category || "Cakes",
    description: product.longDescription || product.description || "Fresh cake baked for your celebration.",
    ingredients: product.ingredients || product.flavors?.join(", ") || seedProducts[0].ingredients,
    allergens: product.allergens || seedProducts[0].allergens,
    ratings: product.ratings,
    numOfReviews: product.numOfReviews,
    stock: product.stock,
  };
}

export function adminProductView(product) {
  return {
    ...detailProduct(product),
    id: productId(product),
    originalPrice: Number(product.price || productPrice(product)),
    discountPrice: Number(product.discountPrice || 0),
    images: product.images?.length ? product.images : [{ url: productImage(product), alt: product.name }],
    flavors: product.flavors || [],
    weight: product.weight || "",
    featured: Boolean(product.featured || product.isFeatured),
    isFeatured: Boolean(product.featured || product.isFeatured),
    isBestSeller: Boolean(product.isBestSeller),
    isTrending: Boolean(product.isTrending),
    customizable: Boolean(product.customizable),
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
  };
}

export function pincodeView(pincode) {
  return {
    id: String(pincode._id || pincode.pincode),
    pincode: pincode.pincode,
    city: pincode.city,
    state: pincode.state || "",
    deliveryFee: Number(pincode.deliveryFee || 0),
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
    customerEmail: order.customerEmail || "",
    deliveryPincode: order.deliveryPincode || "",
    deliveryDate: order.deliveryDate || "",
    payment: order.payment || {},
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
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}
