import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { CakeSlice, CheckCircle2, ClipboardList, MapPin, PackageCheck, Search, Truck } from "lucide-react";
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
    const intervalId = window.setInterval(() => fetchOrder(true), 5000);
    return () => window.clearInterval(intervalId);
  }, [orderId, email]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await fetchOrder();
  };

  return (
    <div className="bk-page">
      <div className="bk-shell py-6">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#1f2221] md:text-5xl">Track Order</h1>
            <p className="mt-2 text-sm leading-6 text-[#6f7573]">Live order status from the admin panel, refreshed automatically.</p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[380px_1fr] items-start">
          <section className="bk-card p-5">
            <form onSubmit={handleSubmit} className="grid gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-black text-[#1f2221]">Order ID</span>
                <input value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="CR-1234" className="bk-input h-12 px-4 text-sm" required />
              </label>

              <button disabled={loading} className="bk-btn h-12 text-sm disabled:opacity-60">
                <Search size={17} />
                {loading ? "Searching..." : "Track"}
              </button>
            </form>
          </section>

          <section className="bk-card overflow-hidden">
            {order ? (
              <>
                <div className="border-b border-[#ebebeb] bg-white p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase text-[#6f7573]">Order {order.orderId || order.id}</p>
                      <h2 className="mt-1 text-2xl font-black text-[#1f2221]">{order.items?.join(", ") || "Cake order"}</h2>
                    </div>
                    <span className="w-fit rounded-full bg-[#fff2e9] px-4 py-2 text-sm font-black text-[#e61951]">{order.status}</span>
                  </div>
                </div>

                <div className="grid gap-5 p-5">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Info icon={ClipboardList} label="Placed On" value={order.date} />
                    <Info icon={MapPin} label="Pincode" value={order.deliveryPincode || "Not added"} />
                    <Info icon={CakeSlice} label="Total" value={formatPrice(order.total)} />
                  </div>

                  <div className="rounded-lg border border-[#ebebeb] p-5">
                    <div className="grid gap-5 md:grid-cols-4">
                      {statuses.map((status, index) => {
                        const active = index <= activeIndex && order.status !== "Cancelled";
                        const Icon = index === 0 ? ClipboardList : index === 1 ? PackageCheck : index === 2 ? Truck : CheckCircle2;
                        return (
                          <div key={status} className="relative z-10 flex flex-col items-center text-center">
                            {index < statuses.length - 1 && (
                              <div className={`absolute left-1/2 top-[22px] -z-10 hidden h-[2px] w-[calc(100%+20px)] md:block ${
                                index < activeIndex && order.status !== "Cancelled" ? "bg-[#e61951]" : "bg-[#f1f1f1]"
                              }`} />
                            )}
                            <span className={`grid h-11 w-11 place-items-center rounded-full ${active ? "bg-[#e61951] text-white" : "bg-[#f1f1f1] text-[#9a9f9d]"}`}>
                              <Icon size={20} />
                            </span>
                            <p className={`mt-3 text-sm font-black ${active ? "text-[#1f2221]" : "text-[#8e9492]"}`}>{status}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {order.status === "Cancelled" && (
                    <div className="rounded-lg bg-red-50 p-4 text-sm font-black text-red-600">This order has been cancelled by admin.</div>
                  )}
                </div>
              </>
            ) : (
              <div className="grid min-h-[360px] place-items-center p-8 text-center">
                <div>
                  <Truck className="mx-auto text-[#e61951]" size={48} />
                  <h2 className="mt-5 text-2xl font-black text-[#1f2221]">Enter an order ID</h2>
                  <p className="mt-2 text-sm text-[#6f7573]">Use the order number from checkout or your profile.</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg bg-[#f7f7f7] p-4">
      <Icon className="text-[#e61951]" size={20} />
      <p className="mt-3 text-xs font-black uppercase text-[#6f7573]">{label}</p>
      <p className="mt-1 text-sm font-black text-[#1f2221]">{value}</p>
    </div>
  );
}

export {
  TrackOrder as default
};
