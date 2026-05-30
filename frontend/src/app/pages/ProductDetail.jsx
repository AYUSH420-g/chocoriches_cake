import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import {
  CakeSlice,
  CheckCircle2,
  ChevronRight,
  Clock,
  Heart,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck
} from "lucide-react";
import { toast } from "sonner";
import { checkPincode, getProduct, getProducts } from "../api/client";
import { isUserLoggedIn } from "../utils/session";
import { useCart } from "../context/CartContext";
import { formatOriginalPrice, formatPrice } from "../utils/format";
import { WISHLIST_EVENT, isWishlisted, toggleWishlist } from "../utils/wishlist";
import ProductCard from "../components/ProductCard";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedWeight, setSelectedWeight] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState({ checked: false, valid: false, message: "" });
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [reviews, setReviews] = useState([]);
  const { addProduct, itemForProduct, setQuantity: setCartQuantity } = useCart();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getProduct(id || "1")
      .then((item) => {
        if (mounted) {
          setProduct(item);
          const weights = item.weightOptions?.length ? item.weightOptions : [{ label: "Half Kg", price: item.price }];
          setSelectedWeight(weights.find((weight) => weight.label === item.defaultWeight) || weights[0]);

          getProducts({ category: item.category }).then((all) => {
            if (mounted) {
              setSimilarProducts(all.filter((p) => p.id !== item.id).slice(0, 5));
            }
          }).catch(() => void 0);

          import("../api/client").then(({ getProductReviews }) => {
            getProductReviews(item.id).then((revs) => {
              if (mounted) {
                setReviews(revs);
              }
            }).catch(() => void 0);
          });
        }
      })
      .catch(() => {
        if (mounted) {
          setProduct(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!product?.id) {
      setLiked(false);
      return undefined;
    }

    setLiked(isWishlisted(product.id));
    const syncWishlist = () => setLiked(isWishlisted(product.id));
    window.addEventListener(WISHLIST_EVENT, syncWishlist);
    return () => window.removeEventListener(WISHLIST_EVENT, syncWishlist);
  }, [product?.id]);

  const cartItem = product && selectedWeight ? itemForProduct(product.id, selectedWeight.label) : null;

  useEffect(() => {
    if (cartItem) {
      setQuantity(Number(cartItem.quantity || 1));
    } else {
      setQuantity(1);
    }
  }, [cartItem?.quantity]);

  const ensureValidDelivery = async (showToast = true) => {
    if (pincodeStatus.valid && pincodeStatus.checked) return true;

    if (!pincode.trim()) {
      setPincodeStatus({ checked: true, valid: false, message: "Enter a pincode first" });
      if (showToast) toast.error("Please enter a pincode to check delivery availability");
      return false;
    }

    const result = await checkPincode(pincode.trim()).catch(() => null);
    if (result?.serviceable) {
      setPincodeStatus({ checked: true, valid: true, message: result.message || "Delivery is available for this pincode." });
      return true;
    }
    
    setPincodeStatus({ checked: true, valid: false, message: result?.message || "Invalid pincode" });
    if (showToast) toast.error("Sorry, delivery is not available for this pincode.");
    return false;
  };

  const handleCheckDelivery = async () => {
    const isValid = await ensureValidDelivery(false);
    if (isValid) toast.success("Delivery slot available today");
  };

  const handleAddToCart = async () => {
    if (!isUserLoggedIn()) {
      toast.error("Please log in to add items to your cart");
      navigate("/auth");
      return false;
    }

    const isValid = await ensureValidDelivery();
    if (!isValid) return false;

    try {
      if (cartItem) {
        await setCartQuantity(cartItem.id, quantity);
      } else {
        await addProduct(product, quantity, selectedWeight.label);
      }
      toast.success(`${product.name} added to cart`, {
        description: `${selectedWeight.label} | Qty ${quantity}`
      });
      return true;
    } catch (error) {
      toast.error(error.message || "Could not add item to cart");
      return false;
    }
  };

  const handleWishlist = () => {
    const nextLiked = toggleWishlist(product.id);
    setLiked(nextLiked);
    toast.success(nextLiked ? "Added to wishlist" : "Removed from wishlist");
  };

  const handleBuyNow = async () => {
    setIsBuying(true);
    const added = await handleAddToCart();
    if (added) {
      navigate("/cart");
    }
    setIsBuying(false);
  };

  const handleQuantityChange = (nextQuantity) => {
    const safeQuantity = Math.max(1, nextQuantity);
    setQuantity(safeQuantity);
    if (cartItem) {
      setCartQuantity(cartItem.id, safeQuantity).catch(() => void 0);
    }
  };

  if (loading || !product || !selectedWeight) {
    return (
      <div className="bk-page">
        <div className="bk-shell grid min-h-[420px] place-items-center py-6 text-center">
          <div>
            <h1 className="text-2xl font-black text-[#1f2221]">{loading ? "Loading cake..." : "Cake not found"}</h1>
            {!loading && <Link to="/shop" className="bk-btn mt-5 h-11 px-5 text-sm">Back To Shop</Link>}
          </div>
        </div>
      </div>
    );
  }

  const weightOptions = product.weightOptions?.length ? product.weightOptions : [{ label: "Half Kg", price: product.price }];
  const effectivePrice = Number(selectedWeight.price || product.price || 0);

  return (
    <div className="bk-page">
      <div className="bk-shell py-5">
        <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs font-bold text-[#6f7573]">
          <Link to="/" className="hover:text-[#e61951]">Home</Link>
          <ChevronRight size={13} />
          <Link to="/shop" className="hover:text-[#e61951]">Cakes</Link>
          <ChevronRight size={13} />
          <span className="text-[#1f2221]">{product.name}</span>
        </nav>

        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            className="bk-card overflow-hidden p-3 self-start"
          >
            <div className="relative aspect-square overflow-hidden rounded-lg bg-[#f1f1f1]">
              <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
              <button
                type="button"
                title="Wishlist"
                aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
                aria-pressed={liked}
                onClick={handleWishlist}
                className={`absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm ${
                  liked ? "text-[#e61951]" : "text-[#1f2221] hover:text-[#e61951]"
                }`}
              >
                <Heart size={21} fill={liked ? "currentColor" : "none"} />
              </button>
              <span className="absolute bottom-4 left-4 bk-chip px-3 py-2 text-xs">
                <CakeSlice size={14} />
                Freshly Baked
              </span>
            </div>
            
            <div className="mt-3 grid grid-cols-2 gap-3">
              {[
                [ShieldCheck, "Secure Checkout"],
                [Clock, "Freshly Prepared"]
              ].map(([Icon, title]) => (
                <div key={title} className="rounded-lg bg-[#ffffff] p-3 text-center">
                  <Icon className="mx-auto text-[#e61951]" size={20} />
                  <p className="mt-2 text-[11px] font-black uppercase tracking-[0.05em] text-[#1f2221]">{title}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} className="bk-card p-5 md:p-7">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {product.numOfReviews > 0 && (
                <>
                  <span className="bk-rating">
                    {product.ratings ? product.ratings.toFixed(1) : 0}
                    <Star size={11} fill="currentColor" />
                  </span>
                  <span className="text-xs font-bold text-[#6f7573]">({product.numOfReviews} Reviews)</span>
                </>
              )}
              {product.isBestSeller && (
                <span className="rounded bg-[#fff2e9] px-2 py-1 text-[11px] font-black text-[#e61951]">Bestseller</span>
              )}
            </div>

            <h1 className="text-3xl font-black leading-tight tracking-tight text-[#1f2221] md:text-4xl">{product.name}</h1>
            <p className="mt-3 text-sm leading-6 text-[#6f7573]">{product.description}</p>

            <div className="mt-5 flex flex-wrap items-end gap-3 border-y border-[#ebebeb] py-5">
              <span className="text-3xl font-black text-[#1f2221]">{formatPrice(effectivePrice)}</span>
              {Number(product.discountPercent || 0) > 0 && (
                <>
                  <span className="pb-1 text-sm font-bold text-[#9a9f9d] line-through">{formatOriginalPrice(effectivePrice, product.discountPercent)}</span>
                  <span className="mb-1 rounded bg-[#fff2e9] px-2 py-1 text-xs font-black text-[#e61951]">{product.discountPercent}% OFF</span>
                </>
              )}
            </div>

            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-black text-[#1f2221]">Select Weight</h2>
                <span className="text-xs font-bold text-[#6f7573]">Freshly baked</span>
              </div>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                {weightOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setSelectedWeight(option)}
                    className={`rounded-lg border p-3 text-left transition ${
                      selectedWeight.label === option.label
                        ? "border-[#e61951] bg-[#fff2e9]"
                        : "border-[#ebebeb] bg-white hover:border-[#e61951]"
                    }`}
                  >
                    <span className="block text-sm font-black text-[#1f2221]">{option.label}</span>
                    <span className="mt-1 block text-xs font-bold text-[#6f7573]">Freshly baked</span>
                    <span className="mt-2 block text-sm font-black text-[#e61951]">{formatPrice(option.price)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
              <div>
                <label className="mb-2 block text-sm font-black text-[#1f2221]">Check Delivery</label>
                <div className="flex overflow-hidden rounded-lg border border-[#ebebeb] bg-white">
                  <span className="grid w-11 place-items-center text-[#e61951]">
                    <MapPin size={18} />
                  </span>
                  <input
                    value={pincode}
                    onChange={(event) => {
                      setPincode(event.target.value);
                      setPincodeStatus({ checked: false, valid: false, message: "" });
                    }}
                    inputMode="numeric"
                    placeholder="Enter pincode"
                    className="min-w-0 flex-1 py-3 pr-3 text-sm outline-none"
                  />
                  <button type="button" onClick={handleCheckDelivery} className="px-4 text-sm font-black text-[#e61951]">
                    Check
                  </button>
                </div>
                {pincodeStatus.checked && (
                  <p className={`mt-2 text-xs font-bold ${pincodeStatus.valid ? "text-[#0f8b57]" : "text-red-600"}`}>
                    {pincodeStatus.message || (pincodeStatus.valid ? "Pincode verified" : "Invalid pincode")}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-[#1f2221]">Qty</label>
                <div className="flex h-12 items-center rounded-lg border border-[#ebebeb] bg-white">
                  <button type="button" onClick={() => handleQuantityChange(quantity - 1)} className="grid h-12 w-11 place-items-center text-[#1f2221] hover:text-[#e61951]">
                    <Minus size={15} />
                  </button>
                  <span className="w-9 text-center text-sm font-black">{quantity}</span>
                  <button type="button" onClick={() => handleQuantityChange(quantity + 1)} className="grid h-12 w-11 place-items-center text-[#1f2221] hover:text-[#e61951]">
                    <Plus size={15} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <button type="button" onClick={handleAddToCart} className="bk-outline-btn h-12 px-5 text-sm">
                <ShoppingCart size={18} />
                Add To Cart
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isBuying}
                className="bk-btn h-12 px-5 text-sm flex items-center justify-center gap-2"
              >
                {isBuying ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  "Buy Now"
                )}
              </button>
              <button
                type="button"
                title="Wishlist"
                aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
                aria-pressed={liked}
                onClick={handleWishlist}
                className={`grid h-12 w-full place-items-center rounded-lg border border-[#ebebeb] hover:bg-[#fff2e9] sm:w-12 ${
                  liked ? "text-[#e61951]" : "text-[#1f2221] hover:text-[#e61951]"
                }`}
              >
                <Heart size={20} fill={liked ? "currentColor" : "none"} />
              </button>
            </div>


          </motion.div>
        </div>

        {reviews.length > 0 && (
          <section className="mt-10 bk-card p-5 md:p-7">
            <h2 className="mb-5 text-xl font-black text-[#1f2221]">Customer Reviews</h2>
            <div className="grid gap-5">
              {reviews.map((review) => (
                <div key={review.id || review._id} className="border-b border-[#ebebeb] pb-5 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black text-[#1f2221]">{review.userName}</span>
                    <span className="text-xs font-bold text-[#6f7573]">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-2 text-[#e61951]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={13} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-[#ebebeb]"} />
                    ))}
                  </div>
                  <p className="text-sm text-[#6f7573] leading-6">{review.comment}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {similarProducts.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-5 text-xl font-black text-[#1f2221]">Similar Products</h2>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {similarProducts.map((p) => (
                <div key={p.id}>
                  {/* Reuse ProductCard but compact if needed, we'll just import it */}
                  <ProductCard product={p} compact />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export {
  ProductDetail as default
};
