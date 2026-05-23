const PRICE_MULTIPLIER = 1;

function asNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function priceToRupees(price) {
  return Math.round(asNumber(price) * PRICE_MULTIPLIER);
}

function formatPrice(price) {
  return `Rs. ${priceToRupees(price).toLocaleString("en-IN")}`;
}

function formatOriginalPrice(price) {
  return `Rs. ${Math.round(priceToRupees(price) * 1.16).toLocaleString("en-IN")}`;
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

export {
  formatOriginalPrice,
  formatPrice,
  priceToRupees,
  ratingFor,
  reviewCountFor
};
