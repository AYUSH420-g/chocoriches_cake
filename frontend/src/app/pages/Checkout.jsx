import { useState } from "react";
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

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function Checkout() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkoutData, setCheckoutData] = useState({});
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const storedUser = getStoredUser();

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
      navigate(`/track?orderId=${encodeURIComponent(order.orderId || order.id)}`);
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
        const selectedSlot = deliverySlots.find((slot) => slot.value === nextCheckoutData.slot) || deliverySlots[0];
        const today = todayIso();

        if (!selectedDate || selectedDate < today) {
          toast.error("Please select today or a future delivery date");
          return;
        }

        if (selectedSlot.type === "today" && selectedDate !== today) {
          toast.error("Today delivery slots can only be used for today's date");
          return;
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
                <p className="mt-1 text-sm leading-6 text-[#6f7573]">Complete your cake order in a clean, Bakingo-style checkout flow.</p>
              </div>

              <div className="p-5 md:p-7">
                {step === 1 && (
                  <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="grid gap-5">
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

                {step === 2 && (
                  <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    {deliverySlots.map((slot, index) => (
                      <label key={slot.value} className={`flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-4 ${index === 0 ? "border-[#e61951] bg-[#fff2e9]" : "border-[#ebebeb] bg-white hover:border-[#e61951]"}`}>
                        <span className="flex items-center gap-3">
                          <input type="radio" name="slot" value={slot.value} defaultChecked={(checkoutData.slot || deliverySlots[0].value) === slot.value} className="h-4 w-4 accent-[#e61951]" />
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
                    <Field label="Delivery Date" name="deliveryDate" type="date" min={todayIso()} defaultValue={checkoutData.deliveryDate || todayIso()} required />
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                    <div className="grid gap-3 md:grid-cols-3">
                      {[
                        [CreditCard, "Razorpay Card"],
                        [Wallet, "Razorpay UPI"],
                        [Truck, "Cash On Delivery"]
                      ].map(([Icon, label], index) => (
                        <button key={label} type="button" className={`flex h-14 items-center justify-center gap-2 rounded-lg border text-sm font-black ${index === 0 ? "border-[#e61951] bg-[#fff2e9] text-[#e61951]" : "border-[#ebebeb] bg-white text-[#1f2221]"}`}>
                          <Icon size={18} />
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="grid gap-5 rounded-lg bg-[#f7f7f7] p-5">
                      <Field label="Card Number" name="cardNumber" placeholder="0000 0000 0000 0000" required />
                      <div className="grid gap-5 md:grid-cols-2">
                        <Field label="Expiry" name="expiry" placeholder="MM / YY" required />
                        <Field label="CVV" name="cvv" placeholder="123" required />
                      </div>
                    </div>
                    <div className="rounded-lg bg-[#fff2e9] p-4 text-sm font-bold text-[#6f7573]">
                      Razorpay checkout is configured from environment variables
                      {razorpayKeyId() ? "." : ", but the frontend key is missing."}
                    </div>
                    <label className="flex items-center gap-2 text-sm font-bold text-[#6f7573]">
                      <input type="checkbox" className="h-4 w-4 accent-[#e61951]" />
                      Save payment method for faster cake orders
                    </label>
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
                  <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                  <div className="flex justify-between"><span>Delivery</span><span>{formatPrice(deliveryFee)}</span></div>
                  <div className="flex justify-between text-[#0f8b57]"><span>Discount</span><span>- {formatPrice(discount)}</span></div>
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
