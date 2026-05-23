import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { motion } from "motion/react";
import {
  CakeSlice,
  CheckCircle2,
  ChevronRight,
  Clock,
  Heart,
  Info,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck
} from "lucide-react";
import { toast } from "sonner";
import { addCartItem, getProduct } from "../api/client";
import { getProductDetailFallback } from "../data/catalog";
import { formatOriginalPrice, formatPrice, ratingFor, reviewCountFor } from "../utils/format";

const weightOptions = [
  { label: "Half Kg", detail: "Serves 4-6", offset: 0 },
  { label: "1 Kg", detail: "Serves 8-10", offset: 30 },
  { label: "2 Kg", detail: "Serves 16-20", offset: 85 }
];

function ProductDetail() {
  const { id } = useParams();
  const [selectedWeight, setSelectedWeight] = useState(weightOptions[0]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [pincode, setPincode] = useState("");
  const [product, setProduct] = useState(getProductDetailFallback(id));

  useEffect(() => {
    let mounted = true;
    const fallback = getProductDetailFallback(id);
    setProduct(fallback);
    getProduct(id || "1")
      .then((item) => {
        if (mounted) {
          setProduct(item);
        }
      })
      .catch(() => void 0);
    return () => {
      mounted = false;
    };
  }, [id]);

  const effectivePrice = product.price + selectedWeight.offset;

  const handleAddToCart = () => {
    addCartItem({ productId: product.id, size: selectedWeight.label, quantity }).catch(() => void 0);
    toast.success(`${product.name} added to cart`, {
      description: `${selectedWeight.label} | Qty ${quantity}`
    });
  };

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
              <button type="button" title="Wishlist" aria-label="Wishlist" className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white text-[#1f2221] shadow-sm hover:text-[#e61951]">
                <Heart size={21} />
              </button>
              <span className="absolute bottom-4 left-4 bk-chip px-3 py-2 text-xs">
                <CakeSlice size={14} />
                Freshly Baked
              </span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((item) => (
                <button key={item} type="button" className={`aspect-square overflow-hidden rounded-lg border bg-[#f7f7f7] ${item === 0 ? "border-[#e61951]" : "border-[#ebebeb]"}`}>
                  <img src={product.image} alt={`${product.name} view ${item + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
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
              <span className="pb-1 text-sm font-bold text-[#9a9f9d] line-through">{formatOriginalPrice(effectivePrice)}</span>
              <span className="mb-1 rounded bg-[#fff2e9] px-2 py-1 text-xs font-black text-[#e61951]">16% OFF</span>
            </div>

            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-black text-[#1f2221]">Select Weight</h2>
                <span className="text-xs font-bold text-[#6f7573]">Eggless available</span>
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
                    <span className="mt-1 block text-xs font-bold text-[#6f7573]">{option.detail}</span>
                    <span className="mt-2 block text-sm font-black text-[#e61951]">{formatPrice(product.price + option.offset)}</span>
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
                    onChange={(event) => setPincode(event.target.value)}
                    inputMode="numeric"
                    placeholder="Enter pincode"
                    className="min-w-0 flex-1 py-3 pr-3 text-sm outline-none"
                  />
                  <button type="button" onClick={() => toast.success("Delivery slot available today")} className="px-4 text-sm font-black text-[#e61951]">
                    Check
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-[#1f2221]">Qty</label>
                <div className="flex h-12 items-center rounded-lg border border-[#ebebeb] bg-white">
                  <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="grid h-12 w-11 place-items-center text-[#1f2221] hover:text-[#e61951]">
                    <Minus size={15} />
                  </button>
                  <span className="w-9 text-center text-sm font-black">{quantity}</span>
                  <button type="button" onClick={() => setQuantity(quantity + 1)} className="grid h-12 w-11 place-items-center text-[#1f2221] hover:text-[#e61951]">
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
              <button type="button" onClick={handleAddToCart} className="bk-btn h-12 px-5 text-sm">
                Buy Now
              </button>
              <button type="button" title="Wishlist" aria-label="Wishlist" className="grid h-12 w-full place-items-center rounded-lg border border-[#ebebeb] text-[#1f2221] hover:bg-[#fff2e9] hover:text-[#e61951] sm:w-12">
                <Heart size={20} />
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
            {["description", "ingredients", "delivery"].map((tab) => (
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
            {activeTab === "ingredients" && (
              <div className="max-w-4xl space-y-4">
                <p className="text-sm leading-7 text-[#5f6663]">{product.ingredients}</p>
                <div className="inline-flex items-start gap-2 rounded-lg bg-[#fff2e9] px-4 py-3 text-sm font-bold text-[#e61951]">
                  <Info size={17} className="mt-0.5 shrink-0" />
                  {product.allergens}
                </div>
              </div>
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
