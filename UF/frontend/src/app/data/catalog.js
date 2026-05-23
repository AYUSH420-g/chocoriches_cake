const CATEGORIES = ["All", "Signature", "Wedding", "Seasonal", "Celebration", "Essentials"];
const PRODUCTS = [
  { id: "1", name: "Midnight Truffle", price: 85, image: "https://images.unsplash.com/photo-1626263468007-a9e0cf83f1ac?auto=format&fit=crop&q=80&w=600", category: "Signature", description: "Rich Belgian chocolate ganache with a hint of espresso." },
  { id: "2", name: "Golden Velvet Wedding", price: 350, image: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&q=80&w=600", category: "Wedding", description: "Three tiers of vanilla bean sponge with champagne cream." },
  { id: "3", name: "Ruby Rose Raspberry", price: 95, image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&q=80&w=600", category: "Seasonal", description: "Delicate raspberry mousse with white chocolate flakes." },
  { id: "4", name: "Caramel Sea Salt", price: 78, image: "https://images.unsplash.com/photo-1626263468007-a9e0cf83f1ac?auto=format&fit=crop&q=80&w=601", category: "Signature", description: "Smoked sea salt caramel layers with dark cocoa." },
  { id: "5", name: "Hazelnut Pralin\xE9", price: 92, image: "https://images.unsplash.com/photo-1626263468007-a9e0cf83f1ac?auto=format&fit=crop&q=80&w=602", category: "Signature", description: "Roasted Piedmont hazelnuts and crispy pralin\xE9 crunch." },
  { id: "6", name: "Classic Choco Silk", price: 65, image: "https://images.unsplash.com/photo-1626263468007-a9e0cf83f1ac?auto=format&fit=crop&q=80&w=603", category: "Essentials", description: "Our timeless smooth milk chocolate sponge." },
  { id: "7", name: "Petal Pink Celebration", price: 120, image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&q=80&w=601", category: "Celebration", description: "Floral infused sponge with edible gold leaf accents." },
  { id: "8", name: "Dark Forest Gateau", price: 88, image: "https://images.unsplash.com/photo-1626263468007-a9e0cf83f1ac?auto=format&fit=crop&q=80&w=604", category: "Signature", description: "Cherries soaked in kirsch with heavy chocolate cream." }
];
const FEATURED_CAKES = PRODUCTS.slice(0, 3);
const PRODUCT_DETAILS = {
  "1": { id: "1", name: "Midnight Truffle", price: 85, image: "https://images.unsplash.com/photo-1626263468007-a9e0cf83f1ac?auto=format&fit=crop&q=80&w=1000", category: "Signature", description: "Experience the ultimate chocolate indulgence. Our Midnight Truffle features layers of 70% dark Belgian chocolate sponge, silky smooth chocolate ganache, and a hidden heart of liquid sea-salt caramel. Each cake is finished with a dusting of premium cocoa powder and edible 24k gold flakes.", ingredients: "Organic Wheat Flour, 70% Dark Belgian Chocolate, Grass-fed Butter, Organic Cane Sugar, Free-range Eggs, Sea Salt, Madagascar Vanilla Bean.", allergens: "Contains: Wheat, Milk, Eggs. May contain traces of nuts." },
  "2": { id: "2", name: "Golden Velvet Wedding", price: 350, image: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&q=80&w=1000", category: "Wedding", description: "A masterpiece of wedding confectionery. Three tiers of light vanilla bean sponge layered with chilled champagne cream and fresh wild strawberries. Encased in a flawless white chocolate Swiss meringue buttercream and adorned with handcrafted sugar peonies.", ingredients: "Organic Flour, White Chocolate, Wild Strawberries, Champagne, Organic Sugar, Grass-fed Butter.", allergens: "Contains: Wheat, Milk, Eggs, Alcohol." },
  "3": { id: "3", name: "Ruby Rose Raspberry", price: 95, image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&q=80&w=1000", category: "Seasonal", description: "A delicate balance of tart and sweet. Featuring naturally pink Ruby chocolate combined with a vibrant raspberry reduction and a light rosewater-infused sponge. Perfect for romantic celebrations and spring gatherings.", ingredients: "Ruby Chocolate, Raspberries, Rosewater, Organic Flour, Cane Sugar, Eggs.", allergens: "Contains: Wheat, Milk, Eggs." }
};
const MOCK_CART = [
  { id: "1", name: "Midnight Truffle", price: 85, image: "https://images.unsplash.com/photo-1626263468007-a9e0cf83f1ac?auto=format&fit=crop&q=80&w=200", size: "6 Inch (Serves 8-10)", quantity: 1 },
  { id: "2", name: "Ruby Rose Raspberry", price: 95, image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&q=80&w=200", size: "8 Inch (Serves 15-20)", quantity: 1 }
];
const MOCK_PROFILE = {
  name: "Elena Vercelli",
  email: "elena@example.com",
  avatar: "https://images.unsplash.com/photo-1611451444023-7fe9d86fe1d0?auto=format&fit=crop&q=80&w=200",
  membership: "Connoisseur Member"
};
const MOCK_ORDERS = [
  { id: "CR-9021", date: "May 15, 2026", total: 110, status: "Delivered", items: ["Midnight Truffle"] },
  { id: "CR-8842", date: "April 22, 2026", total: 350, status: "Processing", items: ["Golden Velvet Wedding"] }
];
function getProductDetailFallback(id) {
  return PRODUCT_DETAILS[id || "1"] || PRODUCT_DETAILS["1"];
}
export {
  CATEGORIES,
  FEATURED_CAKES,
  MOCK_CART,
  MOCK_ORDERS,
  MOCK_PROFILE,
  PRODUCTS,
  PRODUCT_DETAILS,
  getProductDetailFallback
};
