import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  CakeSlice,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  X,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { checkPincode, getBlockedDates, getProduct, getProductReviews } from "../api/client";
import { isUserLoggedIn } from "../utils/session";
import { useCart } from "../context/CartContext";
import { formatOriginalPrice, formatPrice } from "../utils/format";
import { WISHLIST_EVENT, isWishlisted, toggleWishlist } from "../utils/wishlist";
import FullScreenLoader from "../components/FullScreenLoader";

function normalizePincode(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 6);
}

function formatReviewDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
}

/* ── date helpers ── */
function localDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d;
}

function toIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shortDate(date) {
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ── Calendar Modal ── */
function CalendarModal({ minDate, blockedDates, selectedDate, onSelect, onClose }) {
  const [viewMonth, setViewMonth] = useState(minDate.getMonth());
  const [viewYear, setViewYear] = useState(minDate.getFullYear());

  const minIso = toIso(minDate);
  const blockedSet = new Set(blockedDates.map((d) => (typeof d === "string" ? d.slice(0, 10) : "")));

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const canGoPrev = viewYear > minDate.getFullYear() || (viewYear === minDate.getFullYear() && viewMonth > minDate.getMonth());

  const cells = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[360px] rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ebebeb] px-5 py-4">
          <h3 className="text-base font-black text-[#1f2221]">Select Delivery Date</h3>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#f7f7f7]">
            <X size={18} className="text-[#6f7573]" />
          </button>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-3">
          <button type="button" onClick={prevMonth} disabled={!canGoPrev} className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#f7f7f7] disabled:opacity-30">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-black text-[#1f2221]">{MONTHS[viewMonth]} {viewYear}</span>
          <button type="button" onClick={nextMonth} className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#f7f7f7]">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 px-4 pb-1">
          {DAYS.map((day) => (
            <span key={day} className="text-center text-[11px] font-bold text-[#9a9f9d]">{day}</span>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-1 px-4 pb-5">
          {cells.map((day, i) => {
            if (day === null) return <span key={`e-${i}`} />;
            const dateObj = new Date(viewYear, viewMonth, day);
            const iso = toIso(dateObj);
            const isPast = iso < minIso;
            const isBlocked = blockedSet.has(iso);
            const isDisabled = isPast || isBlocked;
            const isSelected = selectedDate === iso;

            return (
              <button
                key={iso}
                type="button"
                disabled={isDisabled}
                onClick={() => { onSelect(iso); onClose(); }}
                className={`mx-auto grid h-9 w-9 place-items-center rounded-full text-sm font-bold transition ${
                  isSelected
                    ? "bg-[#e61951] text-white shadow-md shadow-[#e61951]/30"
                    : isDisabled
                      ? "cursor-not-allowed text-[#d5d8d6] opacity-40"
                      : "text-[#1f2221] hover:bg-[#fff2e9] hover:text-[#e61951]"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Delivery Date Picker Row ── */
function DeliveryDatePicker({ isSameDay, selectedDate, onSelect, blockedDates }) {
  const [showCalendar, setShowCalendar] = useState(false);

  const today = localDate(0);
  const tomorrow = localDate(1);
  const todayIso = toIso(today);
  const tomorrowIso = toIso(tomorrow);
  const minDate = isSameDay ? today : tomorrow;

  const blockedMap = new Map();
  blockedDates.forEach((d) => {
    if (typeof d === "string") blockedMap.set(d.slice(0, 10), "Unavailable");
    else if (d && d.date) blockedMap.set(d.date.slice(0, 10), d.reason || "Unavailable");
  });

  const options = [];
  if (isSameDay) {
    options.push({ key: "today", label: "Today", sub: shortDate(today), value: todayIso, isDisabled: blockedMap.has(todayIso), reason: blockedMap.get(todayIso) });
  }
  options.push({ key: "tomorrow", label: "Tomorrow", sub: shortDate(tomorrow), value: tomorrowIso, isDisabled: blockedMap.has(tomorrowIso), reason: blockedMap.get(tomorrowIso) });
  options.push({ key: "later", label: "Later", sub: null, value: null, isDisabled: false });

  const isLaterSelected = selectedDate && selectedDate !== todayIso && selectedDate !== tomorrowIso;

  return (
    <>
      <div className="mt-4 md:mt-5">
        <h2 className="mb-2 text-sm font-normal text-[#1f2221] md:text-base">Select Delivery Date</h2>
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {options.map((opt) => {
            const isActive = opt.value ? selectedDate === opt.value : isLaterSelected;
            return (
              <button
                key={opt.key}
                type="button"
                disabled={opt.isDisabled}
                onClick={() => {
                  if (opt.value) {
                    onSelect(opt.value);
                  } else {
                    setShowCalendar(true);
                  }
                }}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-lg border px-2 py-2 transition ${
                  opt.isDisabled
                    ? "cursor-not-allowed border-[#ebebeb] bg-[#f7f7f7] opacity-40 grayscale"
                    : isActive
                      ? "border-[#e61951]/50 bg-[#ffeadc] font-semibold"
                      : "border-[#36363670] bg-transparent hover:border-[#e61951]"
                }`}
              >
                <span className="text-sm font-semibold text-[#1f2221]">{opt.label}</span>
                {opt.sub ? (
                  <span className="text-[11px] text-[#6f7573]">{opt.sub}</span>
                ) : isLaterSelected ? (
                  <span className="text-[11px] text-[#e61951] font-bold">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] text-[#6f7573]">
                    <Calendar size={10} /> Pick date
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {options.some(opt => opt.isDisabled && opt.value) && (
          <div className="mt-2 space-y-0.5 text-[11px] font-bold text-red-500">
            {options.filter(opt => opt.isDisabled && opt.value).map(opt => (
              <p key={opt.key}>* {opt.label} is blocked: {opt.reason}</p>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCalendar && (
          <CalendarModal
            minDate={minDate}
            blockedDates={blockedDates}
            selectedDate={selectedDate}
            onSelect={onSelect}
            onClose={() => setShowCalendar(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedWeight, setSelectedWeight] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [pincode, setPincode] = useState(() => sessionStorage.getItem("chocoriches_pincode") || "");
  const [pincodeStatus, setPincodeStatus] = useState({ checked: false, valid: false, message: "" });
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [deliveryDate, setDeliveryDate] = useState(toIso(localDate(1)));
  const [blockedDates, setBlockedDates] = useState([]);
  const [baseFlavour, setBaseFlavour] = useState("Chocolate base");
  const [creamFlavour, setCreamFlavour] = useState("Vanilla cream");
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const descRef = useRef(null);
  const { addProduct, itemForProduct, setQuantity: setCartQuantity } = useCart();

  // Description logic removed


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
          
          const currentHour = new Date().getHours();
          const canDeliverToday = item.sameDayDelivery && currentHour >= 6 && currentHour < 18;
          if (canDeliverToday) {
            setDeliveryDate(toIso(localDate(0)));
          } else {
            setDeliveryDate(toIso(localDate(1)));
          }

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
    getBlockedDates().then((dates) => {
      if (mounted) setBlockedDates(dates || []);
    }).catch(() => void 0);
    
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (product && isUserLoggedIn()) {
      const intentStr = sessionStorage.getItem("pending_cart_intent");
      if (intentStr) {
        try {
          const intent = JSON.parse(intentStr);
          if (intent.productId === product.id) {
            sessionStorage.removeItem("pending_cart_intent");
            
            const doAction = async () => {
              try {
                const existing = itemForProduct(product.id, intent.weightLabel, intent.baseFlavour, intent.creamFlavour);
                if (existing) {
                  await setCartQuantity(existing.id, intent.quantity);
                } else {
                  await addProduct(product, intent.quantity, intent.weightLabel, intent.baseFlavour, intent.creamFlavour);
                }
                toast.success(`${product.name} added to cart`);
                if (intent.isBuyNow) {
                  navigate("/cart");
                }
              } catch (error) {
                toast.error("Could not resume cart action");
              }
            };
            
            // Adding a small delay to ensure context is ready
            setTimeout(doAction, 100);
          }
        } catch (e) {}
      }
    }
  }, [product]);

  useEffect(() => {
    if (deliveryDate) {
      sessionStorage.setItem("chocoriches_delivery_date", deliveryDate);
    }
  }, [deliveryDate]);

  useEffect(() => {
    if (blockedDates.length > 0 && deliveryDate) {
      const blockedSet = new Set(blockedDates.map((d) => {
        if (typeof d === "string") return d.slice(0, 10);
        if (d && d.date) return d.date.slice(0, 10);
        return "";
      }));
      if (blockedSet.has(deliveryDate)) {
        let currentIso = deliveryDate;
        let daysOffset = product?.sameDayDelivery && new Date().getHours() >= 6 && new Date().getHours() < 18 ? 0 : 1;
        
        currentIso = toIso(localDate(daysOffset));
        while (blockedSet.has(currentIso) && daysOffset < 30) {
          daysOffset++;
          currentIso = toIso(localDate(daysOffset));
        }
        setDeliveryDate(currentIso);
      }
    }
  }, [blockedDates, deliveryDate, product]);

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

  const cartItem = product && selectedWeight ? itemForProduct(product.id, selectedWeight.label, baseFlavour, creamFlavour) : null;

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
    if (pincodeStatus.valid && pincodeStatus.checked) {
      sessionStorage.setItem("chocoriches_pincode", normalizePincode(pincode));
      return true;
    }

    const deliveryPincode = normalizePincode(pincode);

    if (deliveryPincode.length !== 6) {
      setPincodeStatus({ checked: true, valid: false, message: "Enter a valid 6-digit pincode" });
      if (showToast) toast.error("Please enter a valid 6-digit pincode");
      return false;
    }

    const result = await checkPincode(deliveryPincode).catch(() => null);
    if (result?.serviceable) {
      setPincodeStatus({ checked: true, valid: true, message: result.message || "Delivery is available for this pincode." });
      sessionStorage.setItem("chocoriches_pincode", deliveryPincode);
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

  const handleAddToCart = async (showLoader = true, isBuyNow = false) => {
    if (!isUserLoggedIn()) {
      toast.error("Please log in to add items to your cart");
      sessionStorage.setItem("post_login_redirect", window.location.pathname);
      sessionStorage.setItem("pending_cart_intent", JSON.stringify({
        productId: product.id,
        quantity: cartItem ? quantity : 1,
        weightLabel: selectedWeight.label,
        baseFlavour,
        creamFlavour,
        isBuyNow
      }));
      navigate("/auth");
      return false;
    }

    if (showLoader) setIsBuying(true);

    const isValid = await ensureValidDelivery();
    if (!isValid) {
      if (showLoader) setIsBuying(false);
      return false;
    }

    try {
      const nextQuantity = cartItem ? quantity : 1;
      if (cartItem) {
        await setCartQuantity(cartItem.id, nextQuantity);
      } else {
        await addProduct(product, nextQuantity, selectedWeight.label, baseFlavour, creamFlavour);
      }
      toast.success(`${product.name} added to cart`, {
        description: `${selectedWeight.label} | Qty ${nextQuantity}`
      });
      if (showLoader) setIsBuying(false);
      return true;
    } catch (error) {
      toast.error(error.message || "Could not add item to cart");
      if (showLoader) setIsBuying(false);
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
    const added = await handleAddToCart(false, true);
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
      <FullScreenLoader visible={isBuying} />
      <div className="bk-shell max-md:px-0 md:py-5">
        

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
              <div 
                className="absolute bottom-3 left-3 flex items-center overflow-hidden rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-300 ease-in-out md:bottom-4 md:left-4"
                style={{ maxWidth: isInfoExpanded ? '300px' : '36px', height: '36px' }}
              >
                <button
                  type="button"
                  onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#6f7573] transition-colors hover:text-[#1f2221]"
                  aria-label="Important information"
                >
                  <Info size={16} />
                </button>
                <span 
                  className={`whitespace-nowrap pr-4 text-[11px] font-bold text-[#1f2221] transition-opacity duration-300 ${isInfoExpanded ? "opacity-100" : "opacity-0"}`}
                >
                  Image and actual Product may differ
                </span>
              </div>
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
            {product.hasBaseAndCream === false && product.description && (
              <p className="mt-2 text-sm leading-6 text-[#6f7573] md:mt-3">{product.description}</p>
            )}

            <div className="flex flex-wrap items-end gap-3  py-2 md:mt-5 md:py-5">
              <span className="text-[22px] font-[600] text-[#1f2221] md:text-3xl">{formatPrice(effectivePrice)}</span>
              
              {Number(product.discountPercent || 0) > 0 && (
                <>
                  <span className="pb-1 text-sm font-bold text-[#9a9f9d] line-through">{formatOriginalPrice(effectivePrice, product.discountPercent)}</span>
                  <span className="mb-1 rounded bg-[#fff2e9] px-2 py-1 text-xs font-black text-[#e61951]">{product.discountPercent}% OFF</span>
                </>
              )}
            </div>

            {product.hasBaseAndCream !== false && (
              <div className="mb-4">
                <div className="mt-3 flex items-center justify-between">
                  <h2 className="text-sm font-normal text-[#1f2221] md:text-base">Select Base Flavour <span className="text-xs text-[#6f7573]">(this will not affect the outer look of cake)</span></h2>
                </div>
                <div className="mt-1">
                  <select
                    value={baseFlavour}
                    onChange={(e) => setBaseFlavour(e.target.value)}
                    className="w-full rounded-lg border border-[#36363670] bg-transparent p-3 text-sm text-[#1f2221] outline-none hover:border-[#e61951] focus:border-[#e61951]"
                  >
                    <option value="Chocolate base">Chocolate base</option>
                    <option value="Vanilla base">Vanilla base</option>
                  </select>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <h2 className="text-sm font-normal text-[#1f2221] md:text-base">Select Cream Flavour <span className="text-xs text-[#6f7573]">(this will not affect the outer look of cake)</span></h2>
                </div>
                <div className="mt-1">
                  <select
                    value={creamFlavour}
                    onChange={(e) => setCreamFlavour(e.target.value)}
                    className="w-full rounded-lg border border-[#36363670] bg-transparent p-3 text-sm text-[#1f2221] outline-none hover:border-[#e61951] focus:border-[#e61951]"
                  >
                    <option value="Vanilla cream">Vanilla cream</option>
                    <option value="Vanilla cream with chocolate chips">Vanilla cream with chocolate chips</option>
                    <option value="Chocolate cream">Chocolate cream</option>
                    <option value="Chocolate cream with chocolate chips">Chocolate cream with chocolate chips</option>
                    <option value="Strawberry cream">Strawberry cream</option>
                  </select>
                </div>

                <div className="mt-3 text-xs text-[#6f7573]">
                  <Link to="/contact" className="text-[#e61951] hover:underline font-semibold">Contact us</Link> for any other type of customization
                </div>
              </div>
            )}

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

            <DeliveryDatePicker
              isSameDay={product.sameDayDelivery && new Date().getHours() >= 6 && new Date().getHours() < 18}
              selectedDate={deliveryDate}
              onSelect={setDeliveryDate}
              blockedDates={blockedDates}
            />

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
                <button type="button" onClick={handleAddToCart} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2d2d2d] bg-white text-[#2d2d2d] font-semibold transition-all duration-200 hover:bg-[#2d2d2d] hover:text-white active:scale-[0.96] h-12 px-3 text-sm md:px-5">
                  <ShoppingCart size={18} />
                  Add To Cart
                </button>
              )}
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isBuying}
                className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[#2d2d2d] text-white font-semibold transition-all duration-200 hover:bg-[#3a3a3a] hover:shadow-[0_8px_18px_rgba(45,45,45,0.2)] active:scale-[0.96] px-3 text-sm md:px-5"
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
