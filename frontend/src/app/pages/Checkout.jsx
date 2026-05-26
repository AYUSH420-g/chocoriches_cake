import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { CheckCircle2, ChevronRight, CreditCard, MapPin, ShieldCheck, Truck, Wallet } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { checkPincode, createOrder, createRazorpayOrder } from "../api/client";
import { useCart } from "../context/CartContext";
import { formatPrice, priceToRupees } from "../utils/format";
import { openRazorpayCheckout, razorpayKeyId } from "../utils/razorpay";
import { getStoredUser } from "../utils/session";

const steps = ["Details", "Delivery", "Payment"];
const deliverySlots = [
  { value: "today-2-5", label: "Today, 2 PM - 5 PM", copy: "Fastest delivery slot", price: "Rs. 80", type: "today" },
  { value: "today-6-9", label: "Today, 6 PM - 9 PM", copy: "Evening celebration slot", price: "Rs. 80", type: "today" },
  { value: "scheduled-10-1", label: "Selected Date, 10 AM - 1 PM", copy: "Scheduled fresh delivery", price: "Free", type: "selected" },
];

function getLocalDateString(offsetDays = 0) {
  const d = new Date();
  if (offsetDays) {
    d.setDate(d.getDate() + offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayIso() {
  return getLocalDateString(0);
}

function tomorrowIso() {
  return getLocalDateString(1);
}

function Checkout() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkoutData, setCheckoutData] = useState({});
  const [placedOrder, setPlacedOrder] = useState(null);
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const storedUser = getStoredUser();

  const hasSameDayOnly = cart.every((item) => item.sameDayDelivery);
  const minDeliveryDate = hasSameDayOnly ? todayIso() : tomorrowIso();

  useEffect(() => {
    if (checkoutData.deliveryDate && checkoutData.deliveryDate < minDeliveryDate) {
      setCheckoutData((prev) => ({
        ...prev,
        deliveryDate: minDeliveryDate,
      }));
    }
  }, [minDeliveryDate, checkoutData.deliveryDate]);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = cart.length ? 10 : 0;
  const discount = cart.length ? 5 : 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);
  const amountInPaise = priceToRupees(total) * 100;

  const placeOrder = async (data, payment = {}) => {
    try {
      const order = await createOrder({
        total,
        customerEmail: data.email || "",
        deliveryPincode: data.pincode || "",
        deliveryDate: data.deliveryDate || new Date().toISOString().slice(0, 10),
        items: cart.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          size: item.size,
        })),
        payment,
      });
      await clearCart().catch(() => void 0);
      toast.success("Order placed successfully");
      setPlacedOrder(order);
    } catch (error) {
      setLoading(false);
      toast.error(error.message || "Order could not be placed for this pincode or date");
    }
  };

  const handleNext = async (event) => {
    event.preventDefault();
    const currentStepData = Object.fromEntries(new FormData(event.currentTarget).entries());
    const nextCheckoutData = { ...checkoutData, ...currentStepData };
    setCheckoutData(nextCheckoutData);

    if (!cart.length) {
      toast.error("Your cart is empty");
      navigate("/cart");
      return;
    }

    if (step < 3) {
      if (step === 1) {
        const pincodeResult = await checkPincode(nextCheckoutData.pincode).catch(() => null);
        if (!pincodeResult?.serviceable) {
          toast.error("Delivery is not available for this pincode");
          return;
        }
      }

      if (step === 2) {
        const selectedDate = String(nextCheckoutData.deliveryDate || "").slice(0, 10);
        const minDate = hasSameDayOnly ? todayIso() : tomorrowIso();
        const selectedSlot = deliverySlots.find((slot) => slot.value === nextCheckoutData.slot) || deliverySlots[0];
        const today = todayIso();

        if (!selectedDate || selectedDate < minDate) {
          toast.error(hasSameDayOnly ? "Please select today or a future delivery date" : "Please select tomorrow or a future delivery date");
          return;
        }

        if (selectedSlot.type === "today") {
          if (!hasSameDayOnly) {
            toast.error("Today delivery slots are not available for these products");
            return;
          }
          if (selectedDate !== today) {
            toast.error("Today delivery slots can only be used for today's date");
            return;
          }
        }
      }

      setLoading(true);
      setTimeout(() => {
        setStep(step + 1);
        setLoading(false);
        window.scrollTo(0, 0);
      }, 500);
      return;
    }

    setLoading(true);
    setTimeout(async () => {
      const razorpayOrder = await createRazorpayOrder({
        amount: amountInPaise,
        notes: {
          customerEmail: nextCheckoutData.email || "",
          source: "checkout",
        },
      }).catch(() => null);

      const opened = await openRazorpayCheckout({
        amount: amountInPaise,
        order: razorpayOrder,
        customer: {
          name: nextCheckoutData.name || "",
          email: nextCheckoutData.email || "",
          phone: nextCheckoutData.phone || "",
        },
        onSuccess: async (paymentResponse) => {
          await placeOrder(nextCheckoutData, paymentResponse);
        },
        onDismiss: () => {
          setLoading(false);
          toast.info("Payment was closed");
        },
      });

      if (!opened) {
        await placeOrder(nextCheckoutData, { mode: "offline-fallback" });
      }
    }, 500);
  };

  if (placedOrder) {
    return (
      <div className="bk-page grid min-h-screen place-items-center bg-[#f7f7f7] px-4 py-12">
        <div className="bk-card w-full max-w-md p-8 text-center shadow-xl bg-white border border-[#ebebeb] rounded-2xl">
          <div className="mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#0f8b57] text-white shadow-lg"
            >
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-10 w-10"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
              >
                <polyline points="20 6 9 17 4 12" />
              </motion.svg>
            </motion.div>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-black text-[#1f2221] tracking-tight"
          >
            Order Placed!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-3 text-sm text-[#6f7573] font-bold"
          >
            Thank you for your order! Your delicious cake celebration is officially scheduled.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 rounded-xl bg-[#f7f7f7] border border-[#ebebeb] p-4 text-left"
          >
            <div className="flex justify-between items-center text-xs text-[#6f7573] font-black uppercase">
              <span>Order ID</span>
              <span className="text-[#1f2221] font-bold lowercase">{placedOrder.orderId || placedOrder.id}</span>
            </div>
            <div className="mt-2 flex justify-between items-center text-xs text-[#6f7573] font-black uppercase">
              <span>Delivery Pincode</span>
              <span className="text-[#1f2221] font-bold">{checkoutData.pincode}</span>
            </div>
            <div className="mt-2 flex justify-between items-center text-xs text-[#6f7573] font-black uppercase">
              <span>Total Price</span>
              <span className="text-[#e61951] font-black">{formatPrice(placedOrder.total)}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-8 flex flex-col gap-3"
          >
            <Link
              to={`/track?orderId=${encodeURIComponent(placedOrder.orderId || placedOrder.id)}`}
              className="bk-btn h-12 w-full text-sm font-black flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] transition-transform"
            >
              <Truck size={17} />
              Track Order
            </Link>
            <Link
              to="/shop"
              className="bk-outline-btn h-12 w-full text-sm font-black flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform"
            >
              Continue Shopping
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="bk-page">
      <div className="bk-shell py-6">
        <div className="mb-5 text-center">
          <Link to="/" className="text-3xl font-black tracking-tight text-[#e61951]">ChocoRiches</Link>
          <div className="mt-5 flex items-center justify-center gap-2 text-xs font-black">
            {steps.map((label, index) => {
              const current = index + 1;
              return (
                <div key={label} className="flex items-center gap-2">
                  <span className={`grid h-8 w-8 place-items-center rounded-full ${step >= current ? "bg-[#e61951] text-white" : "bg-white text-[#6f7573]"}`}>
                    {step > current ? <CheckCircle2 size={16} /> : current}
                  </span>
                  <span className={step >= current ? "text-[#1f2221]" : "text-[#8e9492]"}>{label}</span>
                  {current < steps.length && <ChevronRight size={14} className="text-[#b6bab8]" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <section className="bk-card overflow-hidden">
            <form onSubmit={handleNext}>
              <div className="border-b border-[#ebebeb] bg-white p-5 md:p-7">
                <h1 className="text-2xl font-black text-[#1f2221]">{steps[step - 1]}</h1>
                {/* <p className="mt-1 text-sm leading-6 text-[#6f7573]">Complete your cake order in a clean, Bakingo-style checkout flow.</p> */}
              </div>

              <div className="p-5 md:p-7">
                {step === 1 && (
                  <motion.div key={checkoutData.addressId || "default"} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="grid gap-5">
                    {storedUser?.addresses?.length > 0 && (
                      <div className="mb-2">
                        <h3 className="mb-3 text-sm font-black text-[#1f2221]">Select Saved Address</h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {storedUser.addresses.map((addr) => (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => {
                                setCheckoutData({
                                  ...checkoutData,
                                  addressId: addr.id,
                                  name: addr.name,
                                  phone: addr.phone,
                                  address: addr.address,
                                  pincode: addr.pincode,
                                  city: addr.city,
                                  landmark: addr.landmark,
                                });
                              }}
                              className={`rounded-lg border p-3 text-left transition ${checkoutData.addressId === addr.id ? "border-[#e61951] bg-[#fff2e9]" : "border-[#ebebeb] bg-white hover:border-[#e61951]"}`}
                            >
                              <div className="mb-1 flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-wider text-[#6f7573]">{addr.label}</span>
                              </div>
                              <p className="truncate text-sm font-black text-[#1f2221]">{addr.name}</p>
                              <p className="truncate text-xs text-[#6f7573]">{addr.address}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="grid gap-5 md:grid-cols-2">
                      <Field label="Full Name" name="name" placeholder="Ayush Sharma" defaultValue={checkoutData.name || storedUser?.name || ""} required />
                      <Field label="Mobile Number" name="phone" placeholder="98765 43210" defaultValue={checkoutData.phone || storedUser?.phone || ""} required />
                    </div>
                    <Field label="Email Address" name="email" placeholder="ayush@example.com" type="email" defaultValue={checkoutData.email || storedUser?.email || ""} required />
                    <div className="grid gap-5 md:grid-cols-[1fr_150px]">
                      <Field label="Delivery Address" name="address" placeholder="House no, street, locality" defaultValue={checkoutData.address || ""} required />
                      <Field label="Pincode" name="pincode" placeholder="560001" defaultValue={checkoutData.pincode || ""} required />
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                      <Field label="City" name="city" placeholder="Bangalore" defaultValue={checkoutData.city || ""} required />
                      <Field label="Landmark" name="landmark" placeholder="Near metro station" defaultValue={checkoutData.landmark || ""} />
                    </div>
                  </motion.div>
                )}

                {step === 2 && (() => {
                  const filteredSlots = deliverySlots.filter((slot) => hasSameDayOnly || slot.type !== "today");
                  const defaultSlotVal = filteredSlots.find((slot) => slot.value === checkoutData.slot)?.value || filteredSlots[0]?.value;
                  return (
                    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                      {filteredSlots.map((slot, index) => (
                        <label key={slot.value} className={`flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-4 ${index === 0 ? "border-[#e61951] bg-[#fff2e9]" : "border-[#ebebeb] bg-white hover:border-[#e61951]"}`}>
                          <span className="flex items-center gap-3">
                            <input type="radio" name="slot" value={slot.value} defaultChecked={defaultSlotVal === slot.value} className="h-4 w-4 accent-[#e61951]" />
                            <span>
                              <span className="block text-sm font-black text-[#1f2221]">{slot.label}</span>
                              <span className="mt-1 block text-xs font-bold text-[#6f7573]">{slot.copy}</span>
                            </span>
                          </span>
                          <span className="shrink-0 text-sm font-black text-[#e61951]">{slot.price}</span>
                        </label>
                      ))}

                      <div className="rounded-lg bg-[#f7f7f7] p-4">
                        <label className="mb-2 block text-sm font-black text-[#1f2221]">Message on Cake</label>
                        <input className="bk-input h-12 px-4 text-sm" placeholder="Happy Birthday Ayush" />
                      </div>
                      <Field label="Delivery Date" name="deliveryDate" type="date" min={minDeliveryDate} defaultValue={checkoutData.deliveryDate || minDeliveryDate} required />
                    </motion.div>
                  );
                })()}

                {step === 3 && (
                  <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                    <div className="grid gap-3">
                      <button type="button" className="flex h-14 w-full items-center justify-center gap-2 rounded-lg border border-[#e61951] bg-[#fff2e9] text-sm font-black text-[#e61951]">
                        <Wallet size={18} />
                        Razorpay UPI
                      </button>
                    </div>
                    
                    <div className="rounded-lg bg-[#f7f7f7] p-6 text-center">
                      <ShieldCheck size={32} className="mx-auto mb-3 text-[#0f8b57]" />
                      <h3 className="mb-2 text-lg font-black text-[#1f2221]">Secure UPI Payment</h3>
                      <p className="text-sm leading-6 text-[#6f7573]">
                        Click <strong>Place Order</strong> below to open the secure Razorpay payment window. You can complete the payment using any UPI app (GPay, PhonePe, Paytm, etc).
                      </p>
                    </div>

                    <div className="rounded-lg bg-[#fff2e9] p-4 text-sm font-bold text-[#6f7573]">
                      Razorpay checkout is configured from environment variables
                      {razorpayKeyId() ? "." : ", but the frontend key is missing."}
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-[#ebebeb] bg-white p-5 md:flex-row md:items-center md:justify-between md:p-7">
                <button
                  type="button"
                  onClick={() => (step > 1 ? setStep(step - 1) : navigate("/cart"))}
                  className="h-11 rounded-lg px-4 text-sm font-black text-[#6f7573] hover:bg-[#f7f7f7] hover:text-[#1f2221]"
                >
                  {step === 1 ? "Return To Cart" : "Go Back"}
                </button>
                <button type="submit" disabled={loading} className="bk-btn h-12 px-7 text-sm disabled:opacity-60">
                  {loading ? "Processing..." : step === 3 ? "Place Order" : "Continue"}
                  {!loading && <ChevronRight size={17} />}
                </button>
              </div>
            </form>
          </section>

          <aside>
            <div className="bk-card sticky top-[138px] overflow-hidden">
              <div className="border-b border-[#ebebeb] p-5">
                <h2 className="text-xl font-black text-[#1f2221]">Order Summary</h2>
              </div>
              <div className="space-y-4 p-5">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img src={item.image} alt={item.name} className="h-16 w-16 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-black text-[#1f2221]">{item.name}</p>
                      <p className="mt-1 text-xs font-bold text-[#6f7573]">{item.size} x {item.quantity}</p>
                    </div>
                    <span className="text-sm font-black text-[#1f2221]">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="space-y-3 border-t border-[#ebebeb] pt-4 text-sm font-bold text-[#6f7573]">
                  <div className="flex justify-between"><span>Order Total</span><span>{formatPrice(subtotal)}</span></div>
                  <div className="flex justify-between"><span>Delivery Fee</span><span>{formatPrice(deliveryFee)}</span></div>
                  {/* <div className="flex justify-between text-[#0f8b57]"><span>Discount</span><span>- {formatPrice(discount)}</span></div> */}
                </div>
                <div className="flex justify-between border-t border-[#ebebeb] pt-4 text-lg font-black text-[#1f2221]">
                  <span>Total</span>
                  <span className="text-[#e61951]">{formatPrice(total)}</span>
                </div>
                <div className="grid gap-3 rounded-lg bg-[#fff2e9] p-4 text-xs font-bold text-[#6f7573]">
                  <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#e61951]" /> Secure checkout</span>
                  <span className="flex items-center gap-2"><MapPin size={16} className="text-[#e61951]" /> Delivery address verified</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, type = "text", placeholder, required = false, defaultValue = "", min }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-[#1f2221]">{label}</span>
      <input name={name} type={type} placeholder={placeholder} required={required} defaultValue={defaultValue} min={min} className="bk-input h-12 px-4 text-sm" />
    </label>
  );
}

export {
  Checkout as default
};
