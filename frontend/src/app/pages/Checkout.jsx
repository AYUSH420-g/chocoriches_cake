import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { CheckCircle2, ChevronRight, MapPin, ShieldCheck, Truck, Wallet, Home, Briefcase } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { checkPincode, createOrder, createRazorpayOrder, verifyRazorpayPayment, getPublicSettings } from "../api/client";
import { useCart } from "../context/CartContext";
import { formatPrice, priceToRupees } from "../utils/format";
import { openRazorpayCheckout, razorpayKeyId } from "../utils/razorpay";
import { getStoredUser } from "../utils/session";
import FullScreenLoader from "../components/FullScreenLoader";

const steps = ["Details", "Review"];
const valueOfSteps = ["Delivery Address", "Order Summary"];

function normalizePincode(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 6);
}

function Checkout() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkoutData, setCheckoutData] = useState({});
  const [placedOrder, setPlacedOrder] = useState(null);
  const [siteSettings, setSiteSettings] = useState(null);
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const storedUser = getStoredUser();

  useEffect(() => {
    getPublicSettings().then(setSiteSettings).catch(() => void 0);
  }, []);



  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = cart.length ? (siteSettings?.deliveryFee ?? 0) : 0;
  const discount = 0;
  const total = Math.max(0, subtotal + deliveryFee);
  const amountInPaise = priceToRupees(total) * 100;

  const placeOrder = async (data, payment = {}) => {
    try {
      const order = await createOrder({
        total,
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: [data.houseNo, data.street || data.address, data.city, data.landmark].filter(Boolean).join(", "),
        customerEmail: data.email || "",
        deliveryPincode: data.pincode || "",
        deliveryDate: data.deliveryDate || sessionStorage.getItem("chocoriches_delivery_date") || new Date().toISOString().slice(0, 10),
        items: cart.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          size: item.size,
          messageOnCake: item.messageOnCake,
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
    if (nextCheckoutData.pincode) {
      nextCheckoutData.pincode = normalizePincode(nextCheckoutData.pincode);
    }
    setCheckoutData(nextCheckoutData);

    if (!cart.length) {
      toast.error("Your cart is empty");
      navigate("/cart");
      return;
    }

    if (step < 2) {
      if (step === 1) {
        if (normalizePincode(nextCheckoutData.pincode).length !== 6) {
          toast.error("Please enter a valid 6-digit pincode");
          return;
        }
        const pincodeResult = await checkPincode(nextCheckoutData.pincode).catch(() => null);
        if (!pincodeResult?.serviceable) {
          toast.error("Delivery is not available for this pincode");
          return;
        }
      }

      setLoading(true);
      setStep(step + 1);
      setLoading(false);
      window.scrollTo(0, 0);
      return;
    }

    setLoading(true);
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
        try {
          await verifyRazorpayPayment({
            razorpay_order_id: paymentResponse.razorpay_order_id,
            razorpay_payment_id: paymentResponse.razorpay_payment_id,
            razorpay_signature: paymentResponse.razorpay_signature,
          });
          await placeOrder(nextCheckoutData, paymentResponse);
        } catch (err) {
          setLoading(false);
          toast.error(err.message || "Payment verification failed. Please contact support.");
        }
      },
      onDismiss: () => {
        setLoading(false);
        toast.info("Payment was closed");
      },
    });

    if (!opened) {
      await placeOrder(nextCheckoutData, { mode: "offline-fallback" });
    }
  };

  if (placedOrder) {
    return (
    <div className="bk-page grid min-h-screen place-items-center bg-[#f7f7f7] px-4 py-8 md:py-12">
        <div className="bk-card w-full max-w-md rounded-lg border border-[#ebebeb] bg-white p-6 text-center shadow-xl md:rounded-2xl md:p-8">
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
            className="text-2xl font-black tracking-tight text-[#1f2221] md:text-3xl"
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
              <span className="text-[#1f2221] font-black">{formatPrice(placedOrder.total)}</span>
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
    <div className="bk-page bg-[#f8f8f8] min-h-screen">
      <FullScreenLoader visible={loading} />
      <div className="bk-shell pb-4 pt-2 md:py-5 bg-[#ffffff]">
        <div className="mb-4 text-center md:mb-5">
         <h1 className="text-xl font-bold">
            Add delivery address
          </h1>
          <div className="mt-4 flex items-center justify-center gap-1.5 overflow-x-auto text-xs font-black md:mt-5 md:gap-2">
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

        <div className="mx-auto max-w-2xl">
          <section className="overflow-hidden rounded-3xl bg-white shadow-sm border border-gray-200">
            <form onSubmit={handleNext}>
              <div className="sticky top-0 z-10 border-b bg-white px-5 py-4">
                <h1 className="text-[22px] font-bold text-semibold">{valueOfSteps[step - 1]}</h1>
              </div>

              <div className="p-4 md:p-7 border-[#f3f3f3]">

                {step === 1 && (
                  <motion.div key={checkoutData.addressId || "default"} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="grid gap-2 md:gap-5">
                    {storedUser?.addresses?.length > 0 && (
                      <div className="mb-4">
                        <h4 className="mb-3 text-sm font-black text-[#1f2221]">Select Saved Address</h4>
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
                                  houseNo: "",
                                  street: addr.address,
                                  pincode: addr.pincode,
                                  city: addr.city,
                                  landmark: addr.landmark,
                                  addressLabel: addr.label || "Home",
                                });
                              }}
                              className={`relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all ${
                                  checkoutData.addressId === addr.id
                                    ? "border-[#e61951] bg-[#fff2e9] shadow-sm"
                                    : "border-[#ebebeb] bg-white hover:border-[#e61951]"
                                }`}
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                                  checkoutData.addressId === addr.id ? "bg-[#e61951] text-white" : "bg-[#f1f1f1] text-[#6f7573]"
                                }`}>
                                  {addr.label === "Home" ? <Home size={12}/> : addr.label === "Office" ? <Briefcase size={12}/> : <MapPin size={12}/>}
                                  {addr.label}
                                </span>
                                {checkoutData.addressId === addr.id && <CheckCircle2 size={18} className="text-[#e61951]" />}
                              </div>
                              <p className="truncate text-sm font-black text-[#1f2221]">{addr.name}</p>
                              <p className="truncate mt-1 text-xs text-[#6f7573]">{addr.address}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <h4 className="mb-3 text-sm font-black text-[#1f2221]">Contact Details</h4>
                      <div className="grid grid-cols-2 gap-4 md:gap-5">
                        <Field label="Full Name" name="name" placeholder="Ayush Sharma" defaultValue={checkoutData.name || storedUser?.name || ""} required />
                        <Field label="Mobile Number" name="phone" placeholder="98765 43210" defaultValue={checkoutData.phone || storedUser?.phone || ""} required />
                      </div>
                      <div className="mt-4">
                        <Field label="Email Address" name="email" placeholder="ayush@example.com" type="email" defaultValue={checkoutData.email || storedUser?.email || ""} required />
                      </div>
                    </div>

                    <div className="mt-2 border-t border-gray-100 pt-6">
                      <h4 className="mb-3 text-sm font-black text-[#1f2221]">Address Details</h4>
                      <div className="grid grid-cols-2 gap-4 md:gap-5">
                        <Field label="House / Flat No." name="houseNo" placeholder="Flat 402" defaultValue={checkoutData.houseNo || ""} required />
                        <Field label="Street / Locality" name="street" placeholder="Main Road, Koramangala" defaultValue={checkoutData.street || checkoutData.address || ""} required />
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4 md:gap-5">
                        <Field label="City" name="city" placeholder="Bangalore" defaultValue={checkoutData.city || ""} required />
                        <Field label="Pincode" name="pincode" placeholder="560001" defaultValue={checkoutData.pincode || ""} required onChange={async (e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                          if (val.length === 6) {
                            const result = await checkPincode(val).catch(() => null);
                            if (result?.pincode?.city && e.target.form?.city) {
                              e.target.form.city.value = result.pincode.city;
                            }
                          }
                        }} />
                      </div>
                      <div className="mt-4">
                        <Field label="Landmark" name="landmark" placeholder="Near metro station" defaultValue={checkoutData.landmark || ""} required />
                      </div>
                    </div>

                    <div className="mt-2 border-t border-gray-100 pt-3">
                      <h4 className="mb-3 text-sm font-black text-[#1f2221]">Save Address As</h4>
                      <div className="flex gap-3">
                        <label className="flex-1 cursor-pointer">
                          <input type="radio" name="addressLabel" value="Home" defaultChecked={checkoutData.addressLabel !== "Office" && checkoutData.addressLabel !== "Other"} className="peer sr-only" />
                          <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white p-3 text-[#6f7573] transition-all peer-checked:border-[#e61951] peer-checked:bg-[#fff2e9] peer-checked:text-[#e61951]">
                            <Home size={20} />
                            <span className="text-xs font-bold">Home</span>
                          </div>
                        </label>
                        <label className="flex-1 cursor-pointer">
                          <input type="radio" name="addressLabel" value="Office" defaultChecked={checkoutData.addressLabel === "Office"} className="peer sr-only" />
                          <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white p-3 text-[#6f7573] transition-all peer-checked:border-[#e61951] peer-checked:bg-[#fff2e9] peer-checked:text-[#e61951]">
                            <Briefcase size={20} />
                            <span className="text-xs font-bold">Office</span>
                          </div>
                        </label>
                        <label className="flex-1 cursor-pointer">
                          <input type="radio" name="addressLabel" value="Other" defaultChecked={checkoutData.addressLabel === "Other"} className="peer sr-only" />
                          <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white p-3 text-[#6f7573] transition-all peer-checked:border-[#e61951] peer-checked:bg-[#fff2e9] peer-checked:text-[#e61951]">
                            <MapPin size={20} />
                            <span className="text-xs font-bold">Other</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </motion.div>
                )}



                {step === 2 && (() => {
                  const savedDate = sessionStorage.getItem("chocoriches_delivery_date");
                  const displayDate = savedDate ? new Date(savedDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "No date selected";
                  return (
                  <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div>
                      {/* <h3 className="mb-4 text-lg font-black text-[#1f2221]">Order Items</h3> */}
                      <div className="space-y-3">
                        {cart.map((item) => (
                          <div key={item.id} className="flex gap-4 rounded-xl border border-[#ebebeb] p-4">
                            <img src={item.image} alt={item.name} loading="lazy" className="h-20 w-20 rounded-lg object-cover" />
                            <div className="min-w-0 flex-1 flex flex-col justify-center">
                              <p className="line-clamp-1 text-base font-black text-[#1f2221]">{item.name}</p>
                              <p className="mt-1 text-sm font-bold text-[#6f7573]">{item.size} × {item.quantity}</p>
                              <span className="mt-2 text-normal font-black text-[#000000]">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-[#ebebeb] p-4">
                        <h4 className="mb-2 text-xs font-black uppercase tracking-wider text-[#8a908e]">Delivery Details</h4>
                        <p className="text-sm font-bold text-[#1f2221]">{checkoutData.name}</p>
                        <p className="mt-1 text-sm text-[#6f7573]">{checkoutData.phone}</p>
                        <p className="mt-2 text-sm text-[#6f7573]">{[checkoutData.houseNo, checkoutData.street || checkoutData.address, checkoutData.city, checkoutData.landmark].filter(Boolean).join(", ")}</p>
                        <p className="mt-1 text-sm font-bold text-[#1f2221]">{checkoutData.pincode}</p>
                      </div>
                      <div className="rounded-xl border border-[#ebebeb] p-4 flex flex-col justify-center">
                        <h4 className="mb-2 text-xs font-black uppercase tracking-wider text-[#8a908e]">Delivery Date</h4>
                        <p className="text-base font-black text-[#1f2221]">{displayDate}</p>
                      </div>
                    </div>

                    <div className="rounded-xl bg-[#f7f7f7] p-4">
                      <div className="space-y-3 text-sm font-bold text-[#6f7573]">
                        <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                        <div className="flex justify-between"><span>Delivery Fee</span><span>{formatPrice(deliveryFee)}</span></div>
                      </div>
                      <div className="mt-4 flex justify-between border-t border-[#ebebeb] pt-4 text-xl font-black text-[#1f2221]">
                        <span>Total to Pay</span>
                        <span className="text-[#000000]">{formatPrice(total)}</span>
                      </div>
                    </div>
                  </motion.div>
                )})()}
              </div>

              <div className="sticky bottom-0 z-20 flex flex-col gap-3 border-t border-[#ebebeb] bg-white p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5">
                <button
                  type="button"
                  onClick={() => (step > 1 ? setStep(step - 1) : navigate("/cart"))}
                  className="order-2 flex h-10 items-center justify-center rounded-xl px-6 text-sm font-black text-[#6f7573] transition-colors hover:bg-[#f7f7f7] hover:text-[#1f2221] sm:order-1 sm:justify-start"
                >
                  {step === 1 ? "Return To Cart" : "Go Back"}
                </button>
                <button type="submit" disabled={loading} className="
                        order-1
                        flex
                        h-12
                        w-full
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        bg-[#e61951]
                        px-8
                        text-sm
                        font-black
                        text-white
                        shadow-lg
                        shadow-[#e61951]/25
                        transition-all
                        hover:scale-[1.01]
                        hover:bg-[#d61448]
                        disabled:scale-100
                        disabled:opacity-70
                        sm:h-12
                        sm:w-auto
                        ">
                  {loading ? "Processing..." : step === 2 ? "Proceed to Pay" : "Continue"}
                  {!loading && <ChevronRight size={18} />}
                </button>
              </div>
            </form>
            </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, type = "text", placeholder, required = false, defaultValue = "", min, maxLength, onChange }) {
  const isPincode = name === "pincode";
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-[#1f2221]">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        defaultValue={isPincode ? normalizePincode(defaultValue) : defaultValue}
        min={min}
        maxLength={isPincode ? 6 : maxLength}
        inputMode={isPincode ? "numeric" : undefined}
        onChange={onChange}
        onInput={isPincode ? (event) => { event.currentTarget.value = normalizePincode(event.currentTarget.value); } : undefined}
        className="
            h-11
            w-full
            rounded-2xl
            border
            border-gray-300
            bg-white
            px-4
            text-sm
            font-bold
            outline-none
            transition
            focus:border-[#0c8d25]
            focus:ring-4
            focus:ring-[#0c8d25]/10
            "
      />
    </label>
  );
}

export {
  Checkout as default
};