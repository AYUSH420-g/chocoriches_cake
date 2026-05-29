import { Link } from "react-router";
import { Clock, Heart, Minus, Plus, ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { formatOriginalPrice, formatPrice } from "../utils/format";
import { WISHLIST_EVENT, isWishlisted, toggleWishlist } from "../utils/wishlist";

function ProductCard({ product, compact = false }) {
  const { addProduct, itemForProduct, setQuantity } = useCart();
  const defaultWeight = product.defaultWeight || product.weightOptions?.[0]?.label || "Half Kg";
  const cartItem = itemForProduct(product.id, defaultWeight);
  const [liked, setLiked] = useState(() => isWishlisted(product.id));

  useEffect(() => {
    setLiked(isWishlisted(product.id));

    const syncWishlist = () => setLiked(isWishlisted(product.id));
    window.addEventListener(WISHLIST_EVENT, syncWishlist);
    return () => window.removeEventListener(WISHLIST_EVENT, syncWishlist);
  }, [product.id]);

  const handleAdd = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await addProduct(product, 1, defaultWeight);
      toast.success(`${product.name} added to cart`);
    } catch (error) {
      toast.error(error.message || "Could not add item to cart");
    }
  };

  const handleQuantity = async (event, quantity) => {
    event.preventDefault();
    event.stopPropagation();
    if (!cartItem) {
      return;
    }
    await setQuantity(cartItem.id, quantity).catch((error) => {
      toast.error(error.message || "Could not update quantity");
    });
  };

  const handleWishlist = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const nextLiked = toggleWishlist(product.id);
    setLiked(nextLiked);
    toast.success(nextLiked ? "Added to wishlist" : "Removed from wishlist");
  };

  return (
    <Link to={`/product/${product.id}`} className="group block h-full">
      <article className="bk-card flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10">
        <div className={`relative overflow-hidden bg-[#f1f1f1] ${compact ? "aspect-[1.12/1]" : "aspect-[1.05/1]"}`}>
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
          <button
            type="button"
            title="Wishlist"
            aria-label={liked ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            aria-pressed={liked}
            onClick={handleWishlist}
            className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow-sm transition ${
              liked ? "text-[#e61951]" : "text-[#1f2221] hover:text-[#e61951]"
            }`}
          >
            <Heart size={18} fill={liked ? "currentColor" : "none"} />
          </button>
          {product.numOfReviews > 0 && (
            <span className="absolute bottom-3 left-3 bk-rating">
              {product.ratings ? product.ratings.toFixed(1) : 0}
              <Star size={11} fill="currentColor" />
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-3">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-sm font-black leading-5 text-[#1f2221] transition">
              {product.name}
            </h3>
          </div>

          <div className="mt-auto">
            <div className="mb-1.5 flex items-end gap-2">
              <span className="text-base font-black text-[#1f2221]">{formatPrice(product.price)}</span>
              {Number(product.discountPercent || 0) > 0 && (
                <span className="pb-0.5 text-xs font-bold text-[#9a9f9d] line-through">{formatOriginalPrice(product.price, product.discountPercent)}</span>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
              {product.numOfReviews > 0 && (
                <p className="text-[11px] font-bold text-[#6f7573]">({product.numOfReviews} Reviews)</p>
              )}
              {product.sameDayDelivery && (
                <p className="text-[11px] font-bold text-[#6f7573]">
                  Delivery: <span className="text-[#0f8b57]">Today</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

export {
  ProductCard as default
};
