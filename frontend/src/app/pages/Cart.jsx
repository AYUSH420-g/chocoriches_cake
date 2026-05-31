import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, BadgePercent, Minus, Plus, ShieldCheck, ShoppingCart, Trash2, Truck } from "lucide-react";
import { motion } from "motion/react";
import { getPublicSettings } from "../api/client";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/format";

function Cart() {
  const { cart, removeItem, setQuantity } = useCart();
  const [siteSettings, setSiteSettings] = useState(null);

  useEffect(() => {
    getPublicSettings().then(setSiteSettings).catch(() => void 0);
  }, []);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = cart.length ? (siteSettings?.deliveryFee ?? 0) : 0;
  const discount = 0;
  const total = Math.max(0, subtotal + deliveryFee);

  const handleQuantityChange = (id, quantity) => {
    const nextQuantity = Math.max(1, quantity);
    setQuantity(id, nextQuantity).catch(() => void 0);
  };

  const handleRemove = (id) => {
    removeItem(id).catch(() => void 0);
  };

  return (
    <div className={`bk-page ${cart.length ? "max-md:pb-20" : ""}`}>
      <div className="bk-shell py-5 md:py-6">
        <div className="mb-4 flex flex-col gap-3 md:mb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-[22px] font-black tracking-tight text-[#1f2221] md:text-5xl">My Cart</h1>
            <p className="mt-1.5 text-sm leading-6 text-[#6f7573] md:mt-2">Review your cakes, delivery slot, and offers before checkout.</p>
          </div>
          <Link to="/shop" className="bk-outline-btn h-12 w-[226px] self-center px-5 text-sm md:h-11 md:w-auto md:self-auto">Continue Shopping</Link>
        </div>

        <div className="grid gap-4 md:gap-5 lg:grid-cols-[1fr_380px]">
          <section className="space-y-4">
            {cart.length > 0 ? (
              cart.map((item) => (
                <motion.article
                  key={item.id}
                  layout
                  className="bk-card grid grid-cols-[92px_1fr] items-start gap-3 p-3 sm:grid-cols-[132px_1fr_auto] sm:items-center sm:gap-4 sm:p-4"
                >
                  <div className="aspect-square overflow-hidden rounded-lg bg-[#f1f1f1]">
                    <img src={item.image} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded bg-[#fff2e9] px-2 py-1 text-[11px] font-black text-[#e61951]">Fresh Cake</span>
                      <span className="text-xs font-bold text-[#6f7573]">{item.size}</span>
                    </div>
                    <h2 className="text-sm font-black leading-5 text-[#1f2221] sm:text-lg">{item.name}</h2>
                    <p className="mt-1 text-sm text-[#6f7573]">Earliest delivery: Today, 3 PM - 6 PM</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4 sm:gap-3">
                      <div className="flex h-10 items-center rounded-lg border border-[#ebebeb] bg-white">
                        <button type="button" onClick={() => handleQuantityChange(item.id, item.quantity - 1)} className="grid h-10 w-10 place-items-center hover:text-[#e61951]">
                          <Minus size={15} />
                        </button>
                        <span className="w-8 text-center text-sm font-black">{item.quantity}</span>
                        <button type="button" onClick={() => handleQuantityChange(item.id, item.quantity + 1)} className="grid h-10 w-10 place-items-center hover:text-[#e61951]">
                          <Plus size={15} />
                        </button>
                      </div>
                      <button type="button" onClick={() => handleRemove(item.id)} className="inline-flex h-10 items-center gap-2 rounded-lg px-2 text-sm font-black text-[#e61951] hover:bg-[#fff2e9] sm:px-3">
                        <Trash2 size={16} />
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center justify-between border-t border-[#ebebeb] pt-3 text-left sm:col-auto sm:block sm:border-0 sm:pt-0 sm:text-right">
                    <p className="text-lg font-black text-[#1f2221] sm:text-xl">{formatPrice(item.price * item.quantity)}</p>
                    <p className="mt-1 text-xs font-bold text-[#6f7573]">{formatPrice(item.price)} each</p>
                  </div>
                </motion.article>
              ))
            ) : (
              <div className="bk-card px-5 py-10 text-center md:py-20">
                <ShoppingCart className="mx-auto text-[#e61951]" size={44} />
                <h2 className="mt-5 text-xl font-black text-[#1f2221] md:text-2xl">Your cart is empty</h2>
                <p className="mt-2 text-sm text-[#6f7573]">Add a cake and your delivery summary will appear here.</p>
                <Link to="/shop" className="bk-btn mt-5 h-12 w-[226px] px-6 text-sm md:mt-6 md:h-11 md:w-auto">Shop Cakes</Link>
              </div>
            )}
          </section>

          <aside>
            <div className="bk-card overflow-hidden lg:sticky lg:top-[138px]">
              <div className="border-b border-[#ebebeb] bg-white p-4 md:p-5">
                <h2 className="text-lg font-black text-[#1f2221] md:text-xl">Price Details</h2>
                <p className="mt-1 text-sm text-[#6f7573]">{cart.length} item{cart.length === 1 ? "" : "s"}</p>
              </div>

              <div className="space-y-4 p-4 md:p-5">
                <div className="flex justify-between text-sm font-bold text-[#5f6663]">
                  <span>Order Total</span>
                  <span className="font-black text-[#1f2221]">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#5f6663]">
                  <span>Delivery Fee</span>
                  <span className="font-black text-[#1f2221]">{formatPrice(deliveryFee)}</span>
                </div>

                <div className="border-t border-[#ebebeb] pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-[#1f2221]">Total</span>
                    <span className="text-2xl font-black text-[#1f2221]">{formatPrice(total)}</span>
                  </div>
                </div>

                <Link to="/checkout" className={`bk-btn h-12 w-full text-sm ${
                  cart.length
                    ? "max-md:fixed max-md:inset-x-4 max-md:bottom-[calc(12px+env(safe-area-inset-bottom))] max-md:z-40 max-md:w-[calc(100%-2rem)] max-md:shadow-[0_-6px_20px_rgba(0,0,0,0.12)]"
                    : "pointer-events-none opacity-50"
                }`}>
                  Proceed To Checkout
                  <ArrowRight size={17} />
                </Link>

                <div className="grid gap-3 border-t border-[#ebebeb] pt-4">
                  <div className="flex items-center gap-3 text-xs font-bold text-[#6f7573]">
                    <Truck size={17} className="text-[#e61951]" />
                    Temperature-safe delivery
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
    </div>
  );
}

export {
  Cart as default
};
