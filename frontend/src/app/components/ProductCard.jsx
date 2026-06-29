import { Link } from "react-router";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { formatOriginalPrice, formatPrice, optimizeImage } from "../utils/format";
import { WISHLIST_EVENT, isWishlisted, toggleWishlist } from "../utils/wishlist";

function ProductCard({ product, compact = false, oneLineTitleOnMobile = false, mobileShopCard = false, inlineRating = false }) {
  const { addProduct, itemForProduct, setQuantity } = useCart();
  const defaultWeight = product.defaultWeight || product.weightOptions?.[0]?.label || "0.5 Kg";
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
      window.dispatchEvent(new Event("open-cart"));
    } catch (error) {
      toast.error(error.message || "Could not add item to cart");
    }
  };

  const handleWishlist = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const nextLiked = toggleWishlist(product.id);
    setLiked(nextLiked);
    toast.success(nextLiked ? "Added to wishlist" : "Removed from wishlist");
  };

  const currentHour = new Date().getHours();
  const canDeliverToday = product.sameDayDelivery && currentHour >= 6 && currentHour < 18;
  const earliestDelivery = canDeliverToday ? "Today" : "Tomorrow";

  return (
    <Link to={`/product/${product.id}`} className="group block h-full">
      <article className="bk-card flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10">
        <div className={`relative overflow-hidden bg-[#f1f1f1] ${compact ? "aspect-square md:aspect-[1.12/1]" : "aspect-square md:aspect-[1.05/1]"}`}>
          <img
            src={optimizeImage(product.image, 500)}
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
            className={`absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-white/95 shadow-sm transition md:right-3 md:top-3 md:h-9 md:w-9 ${
              liked ? "text-[#e63946]" : "text-[#1f2221] hover:text-[#e63946]"
            }`}
          >
            <Heart size={17} fill={liked ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="flex flex-1 flex-col p-2.5 md:p-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`${oneLineTitleOnMobile ? "line-clamp-1 md:line-clamp-2" : "line-clamp-2"} text-[13px] leading-5 text-[#1f2221] transition md:text-sm font-normal`}>
              {product.name}
            </h3>
          </div>

          <div className="mt-auto">
            <div className="mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {Number(product.discountPercent || 0) > 0 && (
                <span className="text-sm font-medium text-[#6f7573] line-through">{formatOriginalPrice(product.price, product.discountPercent)}</span>
              )}
              <span className="text-lg font-black text-[#1f2221]">{formatPrice(product.price)}</span>
              {Number(product.discountPercent || 0) > 0 && (
                <span className="rounded bg-[#d5ecd4] px-1.5 py-0.5 text-[11px] font-bold text-[#0f8b57]">{product.discountPercent}% OFF</span>
              )}
            </div>
            
            <div className="mt-0.5 text-[12px] font-normal text-[#437ff6]">
              Get By {earliestDelivery}
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
