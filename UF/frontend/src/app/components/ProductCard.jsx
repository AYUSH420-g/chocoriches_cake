import { Link } from "react-router";
import { Clock, Heart, ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";
import { addCartItem } from "../api/client";
import { formatOriginalPrice, formatPrice, ratingFor, reviewCountFor } from "../utils/format";

function ProductCard({ product, compact = false }) {
  const handleAdd = (event) => {
    event.preventDefault();
    event.stopPropagation();
    addCartItem({ productId: product.id, size: "Half kg", quantity: 1 }).catch(() => void 0);
    toast.success(`${product.name} added to cart`);
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
            aria-label={`Add ${product.name} to wishlist`}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              toast.success("Added to wishlist");
            }}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-[#1f2221] shadow-sm transition hover:text-[#e61951]"
          >
            <Heart size={18} />
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
            <span className="shrink-0 rounded bg-[#fff2e9] px-2 py-1 text-[10px] font-black text-[#e61951]">Eggless</span>
          </div>

          <p className="mb-3 line-clamp-2 text-xs leading-5 text-[#6f7573]">{product.description}</p>

          <div className="mt-auto">
            <div className="mb-1 flex items-end gap-2">
              <span className="text-lg font-black text-[#1f2221]">{formatPrice(product.price)}</span>
              <span className="pb-0.5 text-xs font-bold text-[#9a9f9d] line-through">{formatOriginalPrice(product.price)}</span>
            </div>
            <p className="mb-4 text-xs font-bold text-[#6f7573]">({reviewCountFor(product.id)} Reviews)</p>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-[#f7f7f7] px-3 py-2 text-[11px] font-black text-[#5f6663]">
                <Clock size={13} className="shrink-0 text-[#e61951]" />
                Today
              </span>
              <button
                type="button"
                onClick={handleAdd}
                className="bk-btn h-10 shrink-0 px-3 text-xs"
              >
                <ShoppingCart size={15} />
                Add
              </button>
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
