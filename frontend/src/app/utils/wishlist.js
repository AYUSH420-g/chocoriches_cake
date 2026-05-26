const WISHLIST_KEY = "chocoriches_wishlist";
const WISHLIST_EVENT = "chocoriches-wishlist-change";

function wishlistIds() {
  try {
    return JSON.parse(sessionStorage.getItem(WISHLIST_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveWishlist(ids) {
  sessionStorage.setItem(WISHLIST_KEY, JSON.stringify([...new Set(ids.map(String))]));
  window.dispatchEvent(new Event(WISHLIST_EVENT));
}

function isWishlisted(productId) {
  return wishlistIds().includes(String(productId));
}

function toggleWishlist(productId) {
  const id = String(productId);
  const currentIds = wishlistIds();
  const exists = currentIds.includes(id);
  saveWishlist(exists ? currentIds.filter((item) => item !== id) : [...currentIds, id]);
  return !exists;
}

export {
  WISHLIST_EVENT,
  isWishlisted,
  toggleWishlist,
  wishlistIds
};
