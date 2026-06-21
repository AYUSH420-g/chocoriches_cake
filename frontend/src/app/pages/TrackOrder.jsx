import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { CakeSlice, CheckCircle2, ClipboardList, MapPin, PackageCheck, Search, Truck, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { trackOrder } from "../api/client";
import { formatPrice } from "../utils/format";

const statuses = ["Processing", "Packed", "Out For Delivery", "Delivered"];

function TrackOrder() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get("orderId") || "");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const activeIndex = useMemo(() => Math.max(0, statuses.indexOf(order?.status || "Processing")), [order]);

  const fetchOrder = async (silent = false) => {
    if (!orderId.trim()) {
      return;
    }

    if (!silent) {
      setLoading(true);
    }

    try {
      const data = await trackOrder(orderId.trim(), email.trim());
      setOrder(data);
      setSearchParams(email.trim() ? { orderId: orderId.trim(), email: email.trim() } : { orderId: orderId.trim() });
    } catch (error) {
      if (!silent) {
        setOrder(null);
        toast.error(error.message || "Order not found");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!orderId.trim()) {
      return undefined;
    }

    fetchOrder(true);
  }, [orderId, email]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await fetchOrder();
  };

  return (
    <div className="bk-page">
      <div className="bk-shell py-5 md:py-6">
        <div className={`grid items-start gap-5 md:gap-6 ${order ? "lg:grid-cols-1 max-w-4xl mx-auto" : "lg:grid-cols-[380px_1fr]"}`}>
          {!order && (
            <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bk-card p-5 md:p-7 shadow-sm border border-gray-100"
          >
            <form onSubmit={handleSubmit} className="grid gap-5">
              <div>
                <h3 className="text-lg font-black text-[#1f2221]">Track Your Order</h3>
                <p className="mt-1 text-xs text-[#6f7573]">Enter your order number to see the live status.</p>
              </div>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#6f7573]">Order ID</span>
                <input 
                  value={orderId} 
                  onChange={(event) => setOrderId(event.target.value)} 
                  placeholder="e.g. CR-1234" 
                  className="bk-input h-12 w-full rounded-xl border border-gray-300 bg-[#f9f9f9] px-4 text-sm font-bold text-[#1f2221] outline-none transition focus:border-[#e61951] focus:bg-white focus:ring-4 focus:ring-[#e61951]/10" 
                  required 
                />
              </label>

              <button disabled={loading} className="bk-btn h-12 w-full text-sm font-black shadow-lg shadow-[#e61951]/25 hover:scale-[1.01] hover:bg-[#d61448] disabled:scale-100 disabled:opacity-60 transition-all flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={18} />
                    Track Now
                  </>
                )}
              </button>
            </form>
          </motion.section>
          )}

          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bk-card overflow-hidden shadow-sm border border-gray-100"
          >
            <AnimatePresence mode="wait">
            {order ? (
              <motion.div
                key="order-details"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="border-b border-[#ebebeb] bg-gradient-to-r from-[#fafafa] to-white p-3 md:p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-[#6f7573]">Order {order.orderId || order.id}</p>
                      <h2 className="mt-1 text-xl font-black text-[#1f2221] md:text-2xl">{order.items?.map(i => typeof i === "string" ? i : i.name).join(", ") || "Cake order"}</h2>
                    </div>
                    <span className="w-fit rounded-full bg-[#fff2e9] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#e61951] ring-1 ring-[#e61951]/20 shadow-sm">{order.status}</span>
                  </div>
                </div>

                <div className="grid gap-5 p-5 md:gap-6 md:p-6">
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    <Info icon={ClipboardList} label="Ordered Date" value={order.date} />
                    <Info icon={Truck} label="Delivery Date" value={order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "Not specified"} />
                    <Info icon={MapPin} label="Selected Address" value={order.deliveryAddress || order.deliveryPincode || "Not added"} />
                    <Info icon={CakeSlice} label="Selected Flavour" value={
                      order.items?.map(i => {
                        if (typeof i === "string") return "Default";
                        const base = i.baseFlavour || "Default base";
                        const cream = i.creamFlavour || "Default cream";
                        return `${base} & ${cream}`;
                      }).join(", ") || "Default"
                    } />
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="grid gap-5 md:grid-cols-4">
                      {statuses.map((status, index) => {
                        const active = index <= activeIndex && order.status !== "Cancelled";
                        const Icon = index === 0 ? ClipboardList : index === 1 ? PackageCheck : index === 2 ? Truck : CheckCircle2;
                        return (
                          <div key={status} className="relative z-10 flex flex-col items-center text-center">
                            {index < statuses.length - 1 && (
                              <div className={`absolute left-1/2 top-[22px] -z-10 hidden h-[2px] w-[calc(100%+20px)] md:block transition-colors duration-500 ${
                                index < activeIndex && order.status !== "Cancelled" ? "bg-[#e61951]" : "bg-[#f1f1f1]"
                              }`} />
                            )}
                            <motion.span 
                              initial={false}
                              animate={active ? { scale: [1, 1.1, 1] } : {}}
                              transition={{ duration: 0.3 }}
                              className={`grid h-12 w-12 place-items-center rounded-full shadow-sm transition-colors duration-500 ${active ? "bg-[#e61951] text-white ring-4 ring-[#fff2e9]" : "bg-[#f7f7f7] text-[#a0a5a3] border border-gray-100"}`}
                            >
                              <Icon size={20} />
                            </motion.span>
                            <p className={`mt-4 text-xs font-black uppercase tracking-wider transition-colors duration-500 ${active ? "text-[#1f2221]" : "text-[#a0a5a3]"}`}>{status}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {order.status === "Cancelled" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-black text-red-600 flex items-center justify-center gap-2">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-red-600 text-white text-xs">!</span>
                      This order has been cancelled by admin.
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid min-h-[280px] place-items-center p-6 text-center md:min-h-[360px] md:p-8 bg-gradient-to-b from-[#fff2e9]/30 to-white"
              >
                <div>
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fff2e9] text-[#e61951] mb-5 shadow-sm"
                  >
                    <Truck size={36} />
                  </motion.div>
                  <h2 className="text-xl font-black text-[#1f2221] md:text-2xl">Where is your cake?</h2>
                  <p className="mt-2 text-sm text-[#6f7573] max-w-xs mx-auto leading-relaxed">Enter your order ID on the left to get live tracking updates straight from the kitchen to your door.</p>
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          </motion.section>
        </div>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-[#fbfbfb] p-2.5 shadow-sm transition-colors hover:bg-white hover:shadow-md">
      <div className="flex items-center gap-3 mb-3">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-[#fff2e9] text-[#e61951]">
          <Icon size={16} />
        </div>
        <p className="text-[11px] font-black uppercase tracking-wider text-[#6f7573]">{label}</p>
      </div>
      <p className="text-sm font-black text-[#1f2221] ml-1">{value}</p>
    </div>
  );
}

export {
  TrackOrder as default
};
