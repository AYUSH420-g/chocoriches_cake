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
import { checkPincode, getProduct } from "../api/client";
import { useCart } from "../context/CartContext";
import { formatOriginalPrice, formatPrice, ratingFor, reviewCountFor } from "../utils/format";
import { WISHLIST_EVENT, isWishlisted, toggleWishlist } from "../utils/wishlist";

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
  const [liked, setLiked] = useState(false);
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

  const handleAddToCart = async () => {
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

  const handleCheckDelivery = async () => {
    if (!pincode.trim()) {
      setPincodeStatus({ checked: true, valid: false, message: "Enter a pincode first" });
      return;
    }

    const result = await checkPincode(pincode.trim()).catch(() => null);
    if (result?.serviceable) {
      setPincodeStatus({ checked: true, valid: true, message: result.message || "Delivery is available for this pincode." });
      toast.success("Delivery slot available today");
      return;
    }
    setPincodeStatus({ checked: true, valid: false, message: result?.message || "Invalid pincode" });
  };

  const handleBuyNow = async () => {
    if (!pincodeStatus.valid) {
      setPincodeStatus({ checked: true, valid: false, message: "Enter a valid serviceable pincode first" });
      return;
    }

    const added = await handleAddToCart();
    if (added) {
      navigate("/cart");
    }
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

        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            className="bk-card overflow-hidden p-3"
          >
            <div className="relative aspect-square overflow-hidden rounded-lg bg-[#f1f1f1]">
              <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
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
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} className="bk-card p-5 md:p-7">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="bk-rating">
                {ratingFor(product.id)}
                <Star size={11} fill="currentColor" />
              </span>
              <span className="text-xs font-bold text-[#6f7573]">({reviewCountFor(product.id)} Reviews)</span>
              <span className="rounded bg-[#fff2e9] px-2 py-1 text-[11px] font-black text-[#e61951]">Bestseller</span>
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
              <div className="grid gap-3 sm:grid-cols-3">
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
                disabled={!pincodeStatus.valid}
                className="bk-btn h-12 px-5 text-sm disabled:pointer-events-none disabled:opacity-45"
              >
                Buy Now
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

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                [Truck, "Same Day Delivery"],
                [ShieldCheck, "Secure Checkout"],
                [Clock, "Freshly Prepared"]
              ].map(([Icon, title]) => (
                <div key={title} className="rounded-lg bg-[#f7f7f7] p-3 text-center">
                  <Icon className="mx-auto text-[#e61951]" size={20} />
                  <p className="mt-2 text-[11px] font-black uppercase tracking-[0.05em] text-[#1f2221]">{title}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <section className="mt-6 bk-card overflow-hidden">
          <div className="flex overflow-x-auto border-b border-[#ebebeb] bg-white">
            {["description", "delivery"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`min-w-40 px-5 py-4 text-sm font-black capitalize transition ${
                  activeTab === tab ? "border-b-2 border-[#e61951] text-[#e61951]" : "text-[#5f6663] hover:text-[#e61951]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="p-5 md:p-7">
            {activeTab === "description" && (
              <p className="max-w-4xl text-sm leading-7 text-[#5f6663]">
                {product.name} is prepared fresh with soft sponge layers, balanced filling, and careful packing for doorstep delivery. It is designed for birthdays, anniversaries, office celebrations, and surprise gifts.
              </p>
            )}
            {activeTab === "delivery" && (
              <div className="grid gap-4 md:grid-cols-3">
                {["Choose your city and pincode", "Pick same-day or scheduled slot", "Cake arrives fresh and secure"].map((step) => (
                  <div key={step} className="flex items-center gap-3 rounded-lg bg-[#f7f7f7] p-4">
                    <CheckCircle2 size={19} className="shrink-0 text-[#0f8b57]" />
                    <p className="text-sm font-bold text-[#5f6663]">{step}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export {
  ProductDetail as default
};
