import { Link } from "react-router";
import { Clock, Heart, Minus, Plus, ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { formatOriginalPrice, formatPrice, ratingFor, reviewCountFor } from "../utils/format";
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
          <span className="absolute bottom-3 left-3 bk-rating">
            {ratingFor(product.id)}
            <Star size={11} fill="currentColor" />
          </span>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="mb-2 flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 text-[15px] font-black leading-5 text-[#1f2221] transition group-hover:text-[#e61951]">
              {product.name}
            </h3>
          </div>

          <p className="mb-3 line-clamp-2 text-xs leading-5 text-[#6f7573]">{product.description}</p>

          <div className="mt-auto">
            <div className="mb-1 flex items-end gap-2">
              <span className="text-lg font-black text-[#1f2221]">{formatPrice(product.price)}</span>
              {Number(product.discountPercent || 0) > 0 && (
                <span className="pb-0.5 text-xs font-bold text-[#9a9f9d] line-through">{formatOriginalPrice(product.price, product.discountPercent)}</span>
              )}
            </div>
            <p className="mb-4 text-xs font-bold text-[#6f7573]">({reviewCountFor(product.id)} Reviews)</p>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-[#f7f7f7] px-3 py-2 text-[11px] font-black text-[#5f6663]">
                <Clock size={13} className="shrink-0 text-[#e61951]" />
                Today
              </span>
              {cartItem ? (
                <div className="flex h-10 shrink-0 items-center overflow-hidden rounded-lg border border-[#e61951] bg-white text-[#e61951]">
                  <button
                    type="button"
                    title="Decrease quantity"
                    aria-label={`Decrease ${product.name} quantity`}
                    onClick={(event) => handleQuantity(event, Math.max(1, Number(cartItem.quantity || 1) - 1))}
                    className="grid h-10 w-9 place-items-center hover:bg-[#fff2e9]"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="min-w-8 px-1 text-center text-sm font-black">{cartItem.quantity}</span>
                  <button
                    type="button"
                    title="Increase quantity"
                    aria-label={`Increase ${product.name} quantity`}
                    onClick={(event) => handleQuantity(event, Number(cartItem.quantity || 1) + 1)}
                    className="grid h-10 w-9 place-items-center hover:bg-[#fff2e9]"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAdd}
                  className="bk-btn h-10 shrink-0 px-3 text-xs"
                >
                  <ShoppingCart size={15} />
                  Add
                </button>
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
