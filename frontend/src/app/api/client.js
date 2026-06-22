import { getCartSessionId, getUserToken } from "../utils/session";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";
const API_BASE_URLS = apiBaseUrls(API_BASE_URL);
const productDetailRequests = new Map();
let publicSettingsRequest = null;
let categoriesRequest = null;
let subcategoriesRequest = null;

function apiBaseUrls(baseUrl) {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  if (!/^http:\/\/localhost:3001\/api\/v1$/i.test(normalizedBase)) {
    return [normalizedBase];
  }

  return [
    normalizedBase,
    "http://localhost:3002/api/v1",
    "http://localhost:3003/api/v1",
  ];
}

function apiUrl(path, base = API_BASE_URLS[0]) {
  const endpoint = path.startsWith("/") ? path : `/${path}`;
  return `${base}${endpoint}`;
}

let activeBaseUrl = null;
let resolveBaseUrlPromise = null;

function getBaseUrl() {
  if (activeBaseUrl) return Promise.resolve(activeBaseUrl);
  if (API_BASE_URLS.length === 1) {
    activeBaseUrl = API_BASE_URLS[0];
    return Promise.resolve(activeBaseUrl);
  }

  if (!resolveBaseUrlPromise) {
    resolveBaseUrlPromise = (async () => {
      const checks = API_BASE_URLS.map(async (url) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 300);
        try {
          const res = await fetch(`${url}/health`, { signal: controller.signal });
          clearTimeout(id);
          if (res.ok) return url;
          throw new Error("Not ok");
        } catch (err) {
          clearTimeout(id);
          throw err;
        }
      });

      try {
        activeBaseUrl = await Promise.any(checks);
      } catch (err) {
        activeBaseUrl = API_BASE_URLS[0];
      }
      return activeBaseUrl;
    })();
  }
  return resolveBaseUrlPromise;
}

// Eagerly resolve the working API base URL at module load time
// so that login, buy-now, and other first-click actions don't wait.
getBaseUrl();

async function request(path, options = {}) {
  const headers = {
    "X-Cart-Session": getCartSessionId(),
    ...options.headers
  };

  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const token = getUserToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const baseUrl = await getBaseUrl();

  try {
    const response = await fetch(apiUrl(path, baseUrl), {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const error = new Error(errorBody?.message || `API request failed: ${response.status}`);
      error.fromApi = Boolean(errorBody);
      throw error;
    }

    if (response.status === 204) {
      return void 0;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(`API response from ${baseUrl} was not JSON`);
    }

    return response.json();
  } catch (error) {
    if (!error.fromApi) {
      activeBaseUrl = null;
      resolveBaseUrlPromise = null;
    }
    throw error;
  }
}

function adminToken() {
  return localStorage.getItem("chocoriches_admin_token") || "";
}

function adminRequest(path, options = {}) {
  return request(`/admin${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${adminToken()}`,
      ...options.headers,
    },
  });
}

function getProducts(filters = {}) {
  const searchParams = new URLSearchParams();
  if (filters.category && filters.category !== "All") {
    searchParams.set("category", filters.category);
  }
  if (filters.featured) {
    searchParams.set("featured", "true");
  }
  if (filters.q) {
    searchParams.set("q", filters.q);
  }
  const query = searchParams.toString();
  return request(`/products${query ? `?${query}` : ""}`);
}
function getProductsPaginated(filters = {}, page = 1, limit = 12) {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(page));
  searchParams.set("limit", String(limit));
  
  if (filters.category && filters.category !== "All") searchParams.set("category", filters.category);
  if (filters.subcategory) searchParams.set("subcategory", filters.subcategory);
  if (filters.q) searchParams.set("q", filters.q);
  if (filters.maxPrice) searchParams.set("maxPrice", String(filters.maxPrice));
  if (filters.sortBy) searchParams.set("sortBy", filters.sortBy);
  
  return request(`/products?${searchParams.toString()}`);
}
function getProduct(id) {
  const productId = String(id || "");
  if (!productDetailRequests.has(productId)) {
    productDetailRequests.set(
      productId,
      request(`/products/${encodeURIComponent(productId)}`).catch((error) => {
        productDetailRequests.delete(productId);
        throw error;
      })
    );
  }
  return productDetailRequests.get(productId);
}
function getCart() {
  return request("/cart");
}
function addCartItem(payload) {
  return request("/cart/items", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
function updateCartItem(id, payload) {
  return request(`/cart/items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(typeof payload === "object" ? payload : { quantity: payload })
  });
}
function removeCartItem(id) {
  return request(`/cart/items/${id}`, {
    method: "DELETE"
  });
}
function clearCart() {
  return request("/cart", {
    method: "DELETE"
  });
}
function login(payload) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
function register(payload) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
function googleLogin(payload) {
  return request("/auth/google", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
function forgotPassword(payload) {
  return request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
function resetPassword(payload) {
  return request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
function getProfile() {
  return request("/profile");
}
function updateProfile(payload) {
  return request("/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}
function addAddress(payload) {
  return request("/auth/addresses", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
function deleteAddress(id) {
  return request(`/auth/addresses/${id}`, {
    method: "DELETE"
  });
}
function getOrders() {
  return request("/orders/my");
}
function trackOrder(orderId, email = "") {
  const searchParams = new URLSearchParams();
  if (email) {
    searchParams.set("email", email);
  }
  const query = searchParams.toString();
  return request(`/orders/track/${encodeURIComponent(orderId)}${query ? `?${query}` : ""}`);
}
function getRazorpayConfig() {
  return request("/payments/razorpay/config");
}
function getPublicSettings() {
  if (!publicSettingsRequest) {
    publicSettingsRequest = request("/settings");
  }
  return publicSettingsRequest;
}
function getCategories() {
  if (!categoriesRequest) {
    categoriesRequest = request("/categories").catch((err) => {
      categoriesRequest = null;
      throw err;
    });
  }
  return categoriesRequest;
}
function getSubcategories() {
  if (!subcategoriesRequest) {
    subcategoriesRequest = request("/subcategories").catch((err) => {
      subcategoriesRequest = null;
      throw err;
    });
  }
  return subcategoriesRequest;
}
function checkPincode(pincode) {
  return request(`/pincodes/check/${pincode}`);
}
function getBlockedDates() {
  return request("/blocked-dates");
}
function createRazorpayOrder(payload) {
  return request("/payments/razorpay/orders", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
function verifyRazorpayPayment(payload) {
  return request("/payments/razorpay/verify", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
function createOrder(payload = {}) {
  return request("/orders", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
function submitInquiry(payload) {
  return request("/inquiries", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
function addReview(payload) {
  return request("/reviews", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
function getProductReviews(productId) {
  return request(`/reviews/product/${productId}`);
}
function getUserReviews() {
  return request("/reviews/me");
}
function adminLogin(payload) {
  return request("/admin/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
function getAdminSummary() {
  return adminRequest("/summary");
}
function getAdminUsers() {
  return adminRequest("/users");
}
function blockAdminUser(id, payload) {
  return adminRequest(`/users/${id}/block`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}
function getAdminProducts() {
  return adminRequest("/products");
}
function getAdminProductsPaginated(page = 1, limit = 8, category = "") {
  let url = `/products?page=${page}&limit=${limit}`;
  if (category && category !== "All Categories") url += `&category=${encodeURIComponent(category)}`;
  return adminRequest(url);
}
function createAdminProduct(payload) {
  return adminRequest("/products", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
function updateAdminProduct(id, payload) {
  return adminRequest(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}
function deleteAdminProduct(id) {
  return adminRequest(`/products/${id}`, {
    method: "DELETE"
  });
}
function getAdminCategories() {
  return adminRequest("/categories");
}
function createAdminCategory(payload) {
  return adminRequest("/categories", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
function updateAdminCategory(id, payload) {
  return adminRequest(`/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}
function deleteAdminCategory(id) {
  return adminRequest(`/categories/${id}`, {
    method: "DELETE"
  });
}
function getAdminSubcategories() {
  return adminRequest("/subcategories");
}
function createAdminSubcategory(payload) {
  return adminRequest("/subcategories", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
function updateAdminSubcategory(id, payload) {
  return adminRequest(`/subcategories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}
function deleteAdminSubcategory(id) {
  return adminRequest(`/subcategories/${id}`, {
    method: "DELETE"
  });
}

function getAdminPincodes() {
  return adminRequest("/pincodes");
}
function createAdminPincode(payload) {
  return adminRequest("/pincodes", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
function updateAdminPincode(id, payload) {
  return adminRequest(`/pincodes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}
function deleteAdminPincode(id) {
  return adminRequest(`/pincodes/${id}`, {
    method: "DELETE"
  });
}
function getAdminBlockedDates() {
  return adminRequest("/blocked-dates");
}
function createAdminBlockedDate(payload) {
  return adminRequest("/blocked-dates", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
function updateAdminBlockedDate(id, payload) {
  return adminRequest(`/blocked-dates/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}
function deleteAdminBlockedDate(id) {
  return adminRequest(`/blocked-dates/${id}`, {
    method: "DELETE"
  });
}
function getAdminOrders() {
  return adminRequest("/orders");
}
function updateAdminOrder(id, payload) {
  return adminRequest(`/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}
function getAdminInquiries() {
  return adminRequest("/inquiries");
}
function getAdminSettings() {
  return adminRequest("/settings");
}
function updateAdminSettings(payload) {
  return adminRequest("/settings", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}
function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  return adminRequest("/upload", {
    method: "POST",
    body: formData,
  });
}
export {
  addCartItem,
  adminLogin,
  blockAdminUser,
  checkPincode,
  clearCart,
  createAdminBlockedDate,
  createAdminCategory,
  createAdminPincode,
  createAdminProduct,
  createOrder,
  createRazorpayOrder,
  deleteAdminBlockedDate,
  deleteAdminCategory,
  deleteAdminPincode,
  deleteAdminProduct,
  getAdminBlockedDates,
  getAdminCategories,
  getAdminInquiries,
  getAdminOrders,
  getAdminPincodes,
  getAdminProducts,
  getAdminProductsPaginated,
  getAdminSettings,
  getAdminSummary,
  getAdminUsers,
  getBlockedDates,
  getCart,
  getCategories,
  getOrders,
  getProduct,
  getProducts,
  getProfile,
  getPublicSettings,
  getRazorpayConfig,
  trackOrder,
  login,
  googleLogin,
  register,
  removeCartItem,
  submitInquiry,
  updateAdminBlockedDate,
  updateAdminCategory,
  updateAdminOrder,
  updateAdminPincode,
  updateAdminProduct,
  updateAdminSettings,
  updateCartItem,
  getAdminSubcategories,
  createAdminSubcategory,
  updateAdminSubcategory,
  deleteAdminSubcategory,
  getSubcategories,
  addAddress,
  deleteAddress,
  updateProfile,
  addReview,
  getProductReviews,
  getUserReviews,
  forgotPassword,
  resetPassword,
  getProductsPaginated,
  verifyRazorpayPayment,
  uploadImage
};
