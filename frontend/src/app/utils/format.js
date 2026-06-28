const PRICE_MULTIPLIER = 1;

function asNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function priceToRupees(price) {
  return Math.round(asNumber(price) * PRICE_MULTIPLIER);
}

function formatPrice(price) {
  return `₹ ${priceToRupees(price).toLocaleString("en-IN")}`;
}

function formatOriginalPrice(price, discountPercent = 16) {
  const percent = Math.max(0, Math.min(95, Number(discountPercent || 0)));
  if (!percent) {
    return formatPrice(price);
  }
  const originalPrice = priceToRupees(price) / (1 - percent / 100);
  return `₹${Math.round(originalPrice).toLocaleString("en-IN")}`;
}

function ratingFor(id = "1") {
  const seed = Number.parseInt(String(id).replace(/\D/g, ""), 10) || 1;
  return seed % 5 === 0 ? "4.8" : "4.9";
}

function reviewCountFor(id = "1") {
  const seed = Number.parseInt(String(id).replace(/\D/g, ""), 10) || 1;
  const counts = ["8.5K", "1.5K", "2.3K", "2.7K", "1.7K", "573", "3.0K", "987"];
  return counts[(seed - 1) % counts.length];
}

export function optimizeImage(url, width = 500) {
  if (!url || typeof url !== "string") return url;
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    // Prevent double injection if already optimized
    if (url.includes("/upload/q_auto")) return url;
    return url.replace("/upload/", `/upload/q_auto,f_auto,w_${width}/`);
  }
  return url;
}

export {
  formatOriginalPrice,
  formatPrice,
  priceToRupees,
  ratingFor,
  reviewCountFor
};
