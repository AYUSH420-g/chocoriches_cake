import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { ArrowRight, BadgePercent, Calendar, ChevronLeft, ChevronRight, Minus, Plus, ShieldCheck, ShoppingCart, Trash2, Truck, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getBlockedDates, getPublicSettings } from "../api/client";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/format";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import DeliveryTimeSlotSelector from "../components/DeliveryTimeSlotSelector";

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
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CartCalendarModal({ minDate, blockedDates, selectedDate, onSelect, onClose }) {
  const [viewMonth, setViewMonth] = useState(minDate.getMonth());
  const [viewYear, setViewYear] = useState(minDate.getFullYear());

  const minIso = toIso(minDate);
  const blockedSet = new Set(blockedDates.map((d) => (typeof d === "string" ? d.slice(0, 10) : d?.date?.slice(0, 10) || "")));

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
        <div className="flex items-center justify-between border-b border-[#ebebeb] px-5 py-4">
          <h3 className="text-base font-black text-[#1f2221]">Select Delivery Date</h3>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#f7f7f7]">
            <X size={18} className="text-[#6f7573]" />
          </button>
        </div>
        <div className="flex items-center justify-between px-5 py-3">
          <button type="button" onClick={prevMonth} disabled={!canGoPrev} className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#f7f7f7] disabled:opacity-30">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-black text-[#1f2221]">{MONTHS[viewMonth]} {viewYear}</span>
          <button type="button" onClick={nextMonth} className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#f7f7f7]">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="grid grid-cols-7 px-4 pb-1">
          {WEEK_DAYS.map((day) => (
            <span key={day} className="text-center text-[11px] font-bold text-[#9a9f9d]">{day}</span>
          ))}
        </div>
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

function RewardDeliveryDatePicker({ selectedDate, onSelect, blockedDates }) {
  const [showCalendar, setShowCalendar] = useState(false);
  const today = localDate(0);
  const tomorrow = localDate(1);
  const todayIso = toIso(today);
  const tomorrowIso = toIso(tomorrow);

  const blockedMap = new Map();
  blockedDates.forEach((d) => {
    if (typeof d === "string") blockedMap.set(d.slice(0, 10), "Unavailable");
    else if (d && d.date) blockedMap.set(d.date.slice(0, 10), d.reason || "Unavailable");
  });

  const options = [
    { key: "today", label: "Today", sub: shortDate(today), value: todayIso, isDisabled: blockedMap.has(todayIso), reason: blockedMap.get(todayIso) },
    { key: "tomorrow", label: "Tomorrow", sub: shortDate(tomorrow), value: tomorrowIso, isDisabled: blockedMap.has(tomorrowIso), reason: blockedMap.get(tomorrowIso) },
    { key: "later", label: "Later", sub: null, value: null, isDisabled: false },
  ];

  const isLaterSelected = selectedDate && selectedDate !== todayIso && selectedDate !== tomorrowIso;

  return (
    <>
      <div className="mt-3">
        <h2 className="mb-2 text-xs font-black text-[#1f2221] flex items-center gap-1.5">
          <Calendar size={13} className="text-[#6f7573]" />
          Select Delivery Date
        </h2>
        <div className="grid grid-cols-3 gap-2">
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
                <span className="text-xs font-semibold text-[#1f2221]">{opt.label}</span>
                {opt.sub ? (
                  <span className="text-[10px] text-[#6f7573]">{opt.sub}</span>
                ) : isLaterSelected ? (
                  <span className="text-[10px] text-[#e61951] font-bold">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-[#6f7573]">
                    <Calendar size={9} /> Pick date
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
          <CartCalendarModal
            minDate={today}
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

function Cart() {
  const { cart, removeItem, setQuantity, setMessageOnCake } = useCart();
  const [siteSettings, setSiteSettings] = useState(null);
  const [itemToRemove, setItemToRemove] = useState(null);
  const [blockedDates, setBlockedDates] = useState([]);
  const [deliveryDate, setDeliveryDate] = useState(
    () => sessionStorage.getItem("chocoriches_delivery_date") || ""
  );
  const navigate = useNavigate();

  const hasRewardInCart = cart.some((item) => item.isStampReward);

  const handleProceed = (e) => {
    e.preventDefault();
    if (!sessionStorage.getItem("chocoriches_delivery_date")) {
      toast.error("Please select a delivery date first.");
      return;
    }
    if (!sessionStorage.getItem("chocoriches_time_slot")) {
      toast.error("Please select a delivery time slot.");
      return;
    }
    navigate("/checkout");
  };

  const handleDeliveryDateSelect = (date) => {
    setDeliveryDate(date);
    sessionStorage.setItem("chocoriches_delivery_date", date);
  };

  useEffect(() => {
    getPublicSettings().then(setSiteSettings).catch(() => void 0);
    getBlockedDates().then((dates) => setBlockedDates(dates || [])).catch(() => void 0);
  }, []);

  const subtotal = cart.reduce((acc, item) => acc + (item.isStampReward ? 1 : item.price * item.quantity), 0);
  const deliveryFee = 0; // Calculated at checkout
  const discount = 0;
  const total = Math.max(0, subtotal + deliveryFee);

  const handleQuantityChange = (id, quantity) => {
    const nextQuantity = Math.max(1, quantity);
    setQuantity(id, nextQuantity).catch(() => void 0);
  };

  const handleRemove = (id) => {
    setItemToRemove(id);
  };

  const confirmRemove = () => {
    if (itemToRemove) {
      removeItem(itemToRemove).catch(() => void 0);
      setItemToRemove(null);
    }
  };

  return (
    <div className={`bk-page-cart ${cart.length ? "max-md:pb-0" : ""}`}>
      <div className="bk-shell py-3 md:py-6 bg-[#ffffff]">
        <div className="mb-2 flex flex-col gap-3 md:mb-5 md:flex-row md:items-end md:justify-between">
          <div>
            
            <p className="mt-[2px] text-[12px] leading-6 text-[#6f7573] md:mt-2">
              Review your cakes and delivery slot before checkout.
            </p>
          </div>
          {/* {cart.length > 0 ?<></> :<Link to="/shop" className="bk-outline-btn h-12 w-[226px] self-center px-5 text-sm md:h-11 md:w-auto md:self-auto">Continue Shopping</Link>} */}
        </div>

        <div className="grid gap-2 md:gap-5 lg:grid-cols-[1fr_380px]">
          <section className="space-y-2">
            {cart.length > 0 ? (
              cart.map((item, index) => (
                <motion.article
                  key={item.id}
                  layout
                  className="bk-card grid grid-cols-[92px_1fr] items-start gap-3 p-3 sm:grid-cols-[132px_1fr_auto] sm:items-center sm:gap-4 sm:p-4 border-[#f3f3f3]"
                >
                  <div className="aspect-square overflow-hidden rounded-lg bg-[#f1f1f1]">
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-[500] leading-5 text-[#1f2221] sm:text-lg">
                      {item.name}
                    </h2>
                    {item.isStampReward && (
                      <span className="mt-1 inline-block rounded-full bg-[#eefbf3] px-2 py-0.5 text-[10px] font-black text-[#0f8b57]">
                        🎁 Loyalty Reward
                      </span>
                    )}
                    <div className="col-span-2 flex items-center pt-1 justify-between  text-left sm:col-auto sm:block sm:border-0 sm:pt-0 sm:text-right">
                      {item.isStampReward ? (
                        <p className="text-[14px] font-[500] text-[#0f8b57] sm:text-xl">₹1</p>
                      ) : (
                        <p className="text-[14px] font-[500] text-[#1f2221] sm:text-xl">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      )}
                      {/* <p className="mt-1 text-xs font-bold text-[#6f7573]">{formatPrice(item.price)} each</p> */}
                    </div>
                    <div className="mb-2 pt-1 flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[#1f2221]">
                          {item.size=='Half Kg'?'0.5 Kg':item.size}
                        </span>
                      </div>
                      {(item.baseFlavour || item.creamFlavour) && (
                        <div className="text-[11px] font-medium text-[#6f7573]">
                          {item.baseFlavour && <span>{item.baseFlavour}</span>}
                          {item.baseFlavour && item.creamFlavour && <span> • </span>}
                          {item.creamFlavour && <span>{item.creamFlavour}</span>}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4 sm:gap-3">
                      {item.isStampReward ? (
                        <div className="flex h-8 items-center rounded-lg border border-[#ebebeb] bg-[#f7f7f7] px-3">
                          <span className="text-[10px] font-black text-[#6f7573]">Qty: 1</span>
                        </div>
                      ) : (
                        <div className="flex h-8 items-center rounded-lg border border-[#ebebeb] bg-white">
                          <button
                            type="button"
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity - 1)
                            }
                            className="grid h-8 w-6 place-items-center hover:text-[#e61951]"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="w-6 text-center text-[10px] font-black">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={item.quantity >= 9}
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity + 1)
                            }
                            className="grid h-8 w-6 place-items-center hover:text-[#e61951] disabled:opacity-50 disabled:hover:text-inherit"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[12px] font-black text-[#e61951] hover:bg-[#fff2e9] sm:px-3"
                      >
                        <Trash2 size={12} />
                        Remove
                      </button>
                    </div>
                    <div className="mt-2 w-full max-w-[200px]">
                      <input
                        type="text"
                        placeholder="Message on cake (Optional)"
                        value={item.messageOnCake || ""}
                        onChange={(e) => setMessageOnCake(item.id, e.target.value)}
                        maxLength={30}
                        className="bk-input h-9 w-full px-3 text-[12px] placeholder:text-[#8e9492] placeholder:font-medium rounded-lg border border-[#ebebeb] bg-[#fdfdfd] focus:border-[#e61951] focus:ring-1 focus:ring-[#e61951] transition-all"
                      />
                    </div>
                  </div>
                  {index === cart.length - 1 && (
                    <div className="col-span-2 sm:col-span-3 mt-1 w-full">
                      {hasRewardInCart && (
                        <RewardDeliveryDatePicker
                          selectedDate={deliveryDate}
                          onSelect={handleDeliveryDateSelect}
                          blockedDates={blockedDates}
                        />
                      )}
                      <DeliveryTimeSlotSelector />
                    </div>
                  )}
                  {/* <div className="col-span-2 flex items-center justify-between border-t border-[#ebebeb] pt-3 text-left sm:col-auto sm:block sm:border-0 sm:pt-0 sm:text-right">
                    <p className="text-lg font-black text-[#1f2221] sm:text-xl">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div> */}
                </motion.article>
              ))
            ) : (
              <div className="bk-card px-5 py-10 text-center md:py-20">
                <ShoppingCart className="mx-auto text-[#e61951]" size={44} />
                <h2 className="mt-5 text-xl font-black text-[#1f2221] md:text-2xl">
                  Your cart is empty
                </h2>
                <p className="mt-2 text-sm text-[#6f7573]">
                  Add a cake and your delivery summary will appear here.
                </p>
                <Link
                  to="/shop"
                  className="bk-btn mt-5 h-12 w-[226px] px-6 text-sm md:mt-6 md:h-11 md:w-auto"
                >
                  Shop Cakes
                </Link>
              </div>
            )}
          </section>

          <aside>
            <div className="bk-card overflow-hidden lg:sticky lg:top-[138px] border-[#f3f3f3]">
              <div className="border-b border-[#ebebeb] bg-white py-3 px-4 md:p-5">
                <h2 className="text-lg font-semibold text-[#1f2221] md:text-xl">
                  Order Summary
                </h2>
                {/* <p className="mt-1 text-sm text-[#6f7573]">
                  {cart.length} item{cart.length === 1 ? "" : "s"}
                </p> */}
              </div>

              <div className="space-y-2 p-5 md:p-5">
                <div className="flex justify-between text-sm font-bold text-[#5f6663]">
                  <span>Order Total</span>
                  <span className="font-normal text-[#1f2221]">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#5f6663]">
                  <span>Delivery Fee</span>
                  <span className="font-normal text-[#1f2221]">
                    Calculated at checkout
                  </span>
                </div>

                <div className="border-t border-[#ebebeb] pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[18px] font-black text-[#1f2221]">
                      Total
                    </span>
                    <span className="text-[18px] font-black text-[#1f2221]">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleProceed}
                  className={`h-12 w-full flex justify-center items-center gap-2 text-sm rounded-lg bg-[#3e3e3e] text-white font-semibold transition-all duration-200 hover:bg-[#3a3a3a] hover:shadow-[0_8px_18px_rgba(45,45,45,0.2)] active:scale-[0.96] ${
                    cart.length
                      ? "max-md:fixed max-md:inset-x-4 max-md:bottom-[calc(12px+env(safe-area-inset-bottom))] max-md:z-40 max-md:w-[calc(100%-2rem)] max-md:shadow-[0_-6px_20px_rgba(0,0,0,0.12)]"
                      : "pointer-events-none opacity-50"
                  }`}
                >
                  Proceed To Checkout
                  <ArrowRight size={17} />
                </button>

                <div className="flex justify-between gap-3 border-t border-[#ebebeb] pt-4">
                  <div className="flex items-center gap-3 text-xs font-bold text-[#6f7573]">
                    <Truck size={17} className="text-[#e61951]" />
                    Safe delivery
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-[#6f7573]">
                    <ShieldCheck size={17} className="text-[#e61951]" />
                    Secure checkout
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
      

      <AlertDialog open={!!itemToRemove} onOpenChange={(open) => !open && setItemToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this cake from your cart?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row justify-end space-x-0 gap-2 mt-2">
            <AlertDialogCancel className="flex-1 sm:flex-initial mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove} className="flex-1 sm:flex-initial mt-0 bg-[#e61951] text-white hover:bg-[#d61448]">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export {
  Cart as default
};
