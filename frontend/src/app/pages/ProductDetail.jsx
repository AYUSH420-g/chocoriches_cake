import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
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
import { checkPincode, getProduct, getProductReviews } from "../api/client";
import { isUserLoggedIn } from "../utils/session";
import { useCart } from "../context/CartContext";
import { formatOriginalPrice, formatPrice } from "../utils/format";
import { WISHLIST_EVENT, isWishlisted, toggleWishlist } from "../utils/wishlist";

function normalizePincode(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 6);
}

function formatReviewDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
}

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedWeight, setSelectedWeight] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState({ checked: false, valid: false, message: "" });
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const { addProduct, itemForProduct, setQuantity: setCartQuantity } = useCart();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setReviews([]);
    setActiveReviewIndex(0);
    getProduct(id || "1")
      .then((item) => {
        if (mounted) {
          setProduct(item);
          const weights = item.weightOptions?.length ? item.weightOptions : [{ label: "0.5 Kg", price: item.price }];
          setSelectedWeight(weights.find((weight) => weight.label === item.defaultWeight) || weights[0]);

          getProductReviews(item.id).then((revs) => {
            if (mounted) {
              setReviews(revs);
            }
          }).catch(() => void 0);
        }
      })
      .catch(() => {
        if (mounted) {
          setProduct(null);
          setReviews([]);
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

  useEffect(() => {
    setActiveReviewIndex(0);
    if (reviews.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveReviewIndex((current) => (current + 1) % reviews.length);
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, [reviews.length]);

  const ensureValidDelivery = async (showToast = true) => {
    if (pincodeStatus.valid && pincodeStatus.checked) return true;

    const deliveryPincode = normalizePincode(pincode);

    if (deliveryPincode.length !== 6) {
      setPincodeStatus({ checked: true, valid: false, message: "Enter a valid 6-digit pincode" });
      if (showToast) toast.error("Please enter a valid 6-digit pincode");
      return false;
    }

    const result = await checkPincode(deliveryPincode).catch(() => null);
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
      const nextQuantity = cartItem ? quantity : 1;
      if (cartItem) {
        await setCartQuantity(cartItem.id, nextQuantity);
      } else {
        await addProduct(product, nextQuantity, selectedWeight.label);
      }
      toast.success(`${product.name} added to cart`, {
        description: `${selectedWeight.label} | Qty ${nextQuantity}`
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

  const weightOptions = product.weightOptions?.length ? product.weightOptions : [{ label: "0.5 Kg", price: product.price }];
  const effectivePrice = Number(selectedWeight.price || product.price || 0);
  const activeReview = reviews.length ? reviews[activeReviewIndex % reviews.length] : null;
  const activeReviewDate = activeReview ? formatReviewDate(activeReview.createdAt) : "";

  return (
    <div className="bk-page min-h-[420px]">
      <div className="bk-shell pt-4 max-md:px-0 md:py-5">
        <nav className="mb-3 flex flex-wrap items-center gap-1.5 px-4 text-xs font-bold text-[#6f7573] md:mb-5 md:gap-2 md:px-0">
          <Link to="/" className="hover:text-[#e61951]">Home</Link>
          <ChevronRight size={13} />
          <Link to="/shop" className="hover:text-[#e61951]">Cakes</Link>
          <ChevronRight size={13} />
          <span className="text-[#1f2221]">{product.name}</span>
        </nav>

        <div className="grid  md:gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            className="bk-card self-start overflow-hidden p-3 max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:p-0 max-md:shadow-none"
          >
            <div className="relative aspect-square overflow-hidden bg-[#f1f1f1] md:rounded-lg">
              <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
              <button
                type="button"
                title="Wishlist"
                aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
                aria-pressed={liked}
                onClick={handleWishlist}
                className={`absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm md:right-4 md:top-4 md:h-11 md:w-11 ${
                  liked ? "text-[#e61951]" : "text-[#1f2221] hover:text-[#e61951]"
                }`}
              >
                <Heart size={21} fill={liked ? "currentColor" : "none"} />
              </button>
              <span className="bk-chip absolute bottom-3 left-3 px-3 py-2 text-xs md:bottom-4 md:left-4">
                <CakeSlice size={14} />
                Freshly Baked
              </span>
            </div>
            
            {/* <div className="mt-0 flex gap-0 border-y border-[#ebebeb] bg-white md:mt-3 md:gap-3 md:border-0 md:bg-transparent justify-around">
              {[
                [ShieldCheck, "Secure Checkout"],
                [Clock, "Freshly Prepared"]
              ].map(([Icon, title]) => (
                <div key={title} className="flex  bg-[#ffffff] p-3 text-center md:rounded-lg">
                  <Icon className="my-auto text-[#e61951]" size={16} />
                  <p className="ml-2 text-[10px] font-black uppercase tracking-[0.04em] text-[#1f2221] md:text-[11px] md:tracking-[0.05em]">{title}</p>
                </div>
              ))}
            </div> */}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} className="bk-card p-4 max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:shadow-none md:p-7">
            
            <h1 className="text-base font-semibold leading-tight tracking-tight text-[#1f2221] md:text-4xl">{product.name}</h1>
            {/* <p className="mt-2 text-sm leading-6 text-[#6f7573] md:mt-3">{product.description}</p> */}

            <div className="flex flex-wrap items-end gap-3  py-2 md:mt-5 md:py-5">
              <span className="text-[22px] font-[600] text-[#1f2221] md:text-3xl">{formatPrice(effectivePrice)}</span>
              
              {Number(product.discountPercent || 0) > 0 && (
                <>
                  <span className="pb-1 text-sm font-bold text-[#9a9f9d] line-through">{formatOriginalPrice(effectivePrice, product.discountPercent)}</span>
                  <span className="mb-1 rounded bg-[#fff2e9] px-2 py-1 text-xs font-black text-[#e61951]">{product.discountPercent}% OFF</span>
                </>
              )}
            </div>
              <div className=" flex flex-wrap items-center gap-2">
              {product.numOfReviews > 0 && (
                <>
                  <span className="bk-rating-product">
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

            <div className="md:mt-5">
              <div className="mt-3 flex items-center justify-between">
                <h2 className="text-sm font-normal text-[#1f2221] md:text-base">Select Weight</h2>
                {/* <span className="text-xs font-bold text-[#6f7573]">Freshly baked</span> */}
              </div>
              <div className="mt-1 grid grid-cols-5 gap-2.5 sm:grid-cols-3 md:gap-3">
                {weightOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setSelectedWeight(option)}
                    className={`rounded-sm border p-1 text-left transition ${
                      selectedWeight.label === option.label
                        ? "border-[#e61951]/50 font-semibold bg-[#ffeadc]"
                        : "border-[#36363670] font-normal bg-transparent hover:border-[#e61951]"
                    }`}
                  >
                    <span className="block text-[14px]  text-[#1f2221] text-center items-center">{option.label=='Half Kg'?'0.5 Kg':option.label}</span>
                    {/* <span className="mt-1 block text-xs font-bold text-[#6f7573]">Freshly baked</span> */}
                    {/* <span className="mt-1 block text-sm font-black text-[#e61951]">{formatPrice(option.price)}</span> */}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 md:mt-5">
              <label className="mb-2 block text-sm font-normal text-[#1f2221]">Delivery Location</label>
              <div className="flex overflow-hidden rounded-lg border border-[#36363670] bg-transparent">
                <span className="grid w-11 place-items-center text-[#e61951]">
                  <MapPin size={18} />
                </span>
                <input
                  value={pincode}
                  onChange={(event) => {
                    setPincode(normalizePincode(event.target.value));
                    setPincodeStatus({ checked: false, valid: false, message: "" });
                  }}
                  inputMode="numeric"
                  maxLength={6}
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

            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-[#ebebeb] bg-white p-3 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-40 max-md:pb-[calc(12px+env(safe-area-inset-bottom))] max-md:shadow-[0_-6px_20px_rgba(0,0,0,0.1)] sm:grid-cols-[1fr_1fr_auto] md:mt-6 md:border-0 md:bg-transparent md:p-0 md:shadow-none">
              {cartItem ? (
                <div className="flex h-12 items-center justify-between rounded-lg border border-[#e61951] bg-white text-[#1f2221]">
  <span className="pl-3 text-xs font-black uppercase tracking-[0.08em] text-[#6f7573]">
    Qty
  </span>

  <div className="flex h-full flex-1 items-center justify-center">
    <button
      type="button"
      onClick={() => handleQuantityChange(quantity - 1)}
      className="grid h-12 w-10 place-items-center text-[#1f2221] hover:text-[#e61951]"
    >
      <Minus size={15} />
    </button>

    <span className="w-8 text-center text-sm font-black">
      {quantity}
    </span>

    <button
      type="button"
      onClick={() => handleQuantityChange(quantity + 1)}
      className="grid h-12 w-10 place-items-center text-[#1f2221] hover:text-[#e61951]"
    >
      <Plus size={15} />
    </button>
  </div>
</div>
              ) : (
                <button type="button" onClick={handleAddToCart} className="bk-outline-btn h-12 px-3 text-sm md:px-5">
                  <ShoppingCart size={18} />
                  Add To Cart
                </button>
              )}
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isBuying}
                className="bk-btn flex h-12 items-center justify-center gap-2 px-3 text-sm md:px-5"
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
                className={`hidden h-12 w-full place-items-center rounded-lg border border-[#ebebeb] hover:bg-[#fff2e9] sm:grid sm:w-12 ${
                  liked ? "text-[#e61951]" : "text-[#1f2221] hover:text-[#e61951]"
                }`}
              >
                <Heart size={20} fill={liked ? "currentColor" : "none"} />
              </button>
            </div>


          </motion.div>
          {/* <div className="mt-0 flex gap-0  bg-white md:mt-3 md:gap-3 md:border-0 md:bg-transparent justify-around">
              {[
                [ShieldCheck, "Secure Checkout"],
                [Clock, "Freshly Prepared"]
              ].map(([Icon, title]) => (
                <div key={title} className="flex  bg-[#ffffff] p-3 text-center md:rounded-lg">
                  <Icon className="my-auto text-[#e61951]" size={16} />
                  <p className="ml-2 text-[10px] font-black uppercase tracking-[0.04em] text-[#1f2221] md:text-[11px] md:tracking-[0.05em]">{title}</p>
                </div>
              ))}
            </div> */}
        </div>

        {activeReview && (
          <section className="mt-8 px-4 md:px-0">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-black lowercase tracking-[0.08em] text-[#e61951]">reviews</p>
                <h2 className="text-xl font-black text-[#1f2221] md:text-2xl">Customer Reviews</h2>
              </div>
              <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-[#6f7573] shadow-sm">
                {reviews.length} review{reviews.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="relative overflow-hidden">
              <AnimatePresence initial={false} mode="wait">
                <motion.article
                  key={activeReview.id || activeReview._id || activeReviewIndex}
                  initial={{ opacity: 0, x: 48 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -48 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="rounded-lg border border-[#ebebeb] bg-white p-5 shadow-sm md:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#fff2e9] text-sm font-black text-[#e61951]">
                        {(activeReview.userName || "C").slice(0, 1).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-black text-[#1f2221]">{activeReview.userName || "Customer"}</h3>
                        {activeReviewDate && <p className="text-xs font-bold text-[#8a908e]">{activeReviewDate}</p>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 text-[#e61951]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={15} fill={i < Number(activeReview.rating || 0) ? "currentColor" : "none"} className={i < Number(activeReview.rating || 0) ? "" : "text-[#ebebeb]"} />
                      ))}
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#5f6663] md:text-base md:leading-7">{activeReview.comment}</p>
                </motion.article>
              </AnimatePresence>
            </div>
            {reviews.length > 1 && (
              <div className="mt-4 flex justify-center gap-1.5">
                {reviews.map((review, index) => (
                  <button
                    key={review.id || review._id || index}
                    type="button"
                    aria-label={`Show review ${index + 1}`}
                    onClick={() => setActiveReviewIndex(index)}
                    className={`h-1.5 rounded-full transition-all ${index === activeReviewIndex ? "w-6 bg-[#e61951]" : "w-1.5 bg-[#d8dcda]"}`}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export {
  ProductDetail as default
};
