import { getCartSessionId, getUserToken } from "../utils/session";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";
const API_BASE_URLS = apiBaseUrls(API_BASE_URL);

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

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    "X-Cart-Session": getCartSessionId(),
    ...options.headers
  };

  const token = getUserToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  let lastError;

  for (const baseUrl of API_BASE_URLS) {
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
      if (error.fromApi) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError || new Error("API request failed");
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
function getProduct(id) {
  return request(`/products/${id}`);
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
function updateCartItem(id, quantity) {
  return request(`/cart/items/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity })
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
  return request("/settings");
}
function getCategories() {
  return request("/categories");
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
function getSubcategories() {
  return request("/subcategories");
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
  getUserReviews
};
