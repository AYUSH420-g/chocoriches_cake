import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, CakeSlice, Clock, Gift, ShieldCheck, Sparkles, Star, Truck } from "lucide-react";
import { getProductsPaginated } from "../api/client";
import ProductCard from "../components/ProductCard";

const wishCategories = [
  {
    name: "Classic",
    image: "https://images.unsplash.com/photo-1602351447937-745cb720612f?auto=format&fit=crop&q=80&w=420",
    to: "/shop?cat=Essentials"
  },
  {
    name: "Gourmet",
    image: "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&q=80&w=420",
    to: "/shop?cat=Signature"
  },
  {
    name: "Designer",
    image: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&q=80&w=420",
    to: "/shop?cat=Wedding"
  },
  {
    name: "Photo Cakes",
    image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&q=80&w=420",
    to: "/shop?cat=Celebration"
  },
  {
    name: "Desserts",
    image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=420",
    to: "/shop?cat=Seasonal"
  },
  {
    name: "Hampers",
    image: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&q=80&w=420",
    to: "/custom"
  }
];

const promiseItems = [
  { icon: Truck, title: "On-Time Delivery", copy: "Fresh cakes delivered today" },
  { icon: CakeSlice, title: "300+ Designs", copy: "For every celebration" },
  { icon: Star, title: "Loved by Foodies", copy: "High rated cake picks" },
  { icon: ShieldCheck, title: "Baked Fresh", copy: "Prepared after order" }
];

function Home() {
  const [allCakes, setAllCakes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);
  const sentinelRef = useRef(null);

  const loadPage = useCallback(async (page) => {
    try {
      const data = await getProductsPaginated({}, page, 12);
      if (page === 1) {
        setAllCakes(data.products);
      } else {
        setAllCakes((prev) => [...prev, ...data.products]);
      }
      setHasMore(data.hasMore);
      pageRef.current = data.currentPage;
    } catch {
      if (page === 1) setAllCakes([]);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadPage(1).finally(() => setIsLoading(false));
  }, [loadPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !isLoading) {
          setLoadingMore(true);
          loadPage(pageRef.current + 1).finally(() => setLoadingMore(false));
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, isLoading, loadPage]);

  return (
    <div className="bk-page overflow-hidden">
      <section className="bk-shell pt-6 pb-3 md:pt-8 md:pb-4">
        <Link to="/custom" className="mx-auto block max-w-6xl overflow-hidden rounded-2xl bg-[#fff2e9] shadow-sm hover:opacity-95 transition">
          <motion.img
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            src="/hero-banner.png"
            alt="Theme Cakes Delivery"
            className="w-full h-auto object-contain"
          />
        </Link>
      </section>

      <section className="bk-shell py-7">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            {/* <p className="text-sm font-black lowercase tracking-[0.08em] text-[#e61951]">menu</p> */}
            <h2 className="bk-section-title">What will you wish for?</h2>
          </div>
          <Link to="/shop" className="hidden items-center gap-2 text-sm font-black text-[#e61951] md:flex">
            View All
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="max-w-5xl grid grid-cols-3 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {wishCategories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={category.to} className="group block text-center">
                <span className="block aspect-square overflow-hidden rounded-2xl bg-[#f5f0ec]">
                  <img src={category.image} alt={category.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                </span>
                <span className="mt-2.5 block text-sm font-semibold text-[#1f2221]">{category.name}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bk-shell py-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black lowercase tracking-[0.08em] text-[#e61951]">explore</p>
            <h2 className="bk-section-title">Our Collection</h2>
          </div>
          <Link to="/shop" className="hidden items-center gap-2 text-sm font-black text-[#e61951] md:flex">
            View All
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-white p-3 shadow-sm border border-[#ebebeb]">
                  <div className="aspect-square w-full rounded-xl bg-[#f5f0ec]"></div>
                  <div className="mt-4 h-4 w-2/3 rounded-full bg-[#f1f1f1]"></div>
                  <div className="mt-2 h-4 w-1/2 rounded-full bg-[#f1f1f1]"></div>
                </div>
              ))
            : allCakes.map((cake) => <ProductCard key={cake.id} product={cake} />)}
        </div>
        {!isLoading && !allCakes.length && (
          <div className="bk-card py-12 text-center">
            <h3 className="text-xl font-black text-[#1f2221]">No cakes found</h3>
            <p className="mt-2 text-sm text-[#6f7573]">Add products from admin to show them here.</p>
          </div>
        )}
        {loadingMore && (
          <div className="flex justify-center py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#ebebeb] border-t-[#e61951]" />
          </div>
        )}
        <div ref={sentinelRef} className="h-1" />
      </section>

      <section className="bg-white py-10">
        <div className="bk-shell">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-base font-black lowercase tracking-[0.08em] text-[#e61951]">our promise</p>
              <h2 className="bk-section-title">Fresh bakes, On Time delivery</h2>
            </div>
          </div>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {promiseItems.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="rounded-xl border border-[#ebebeb] bg-[#f7f7f7] p-5">
                <span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-[#fff2e9] text-[#e61951]">
                  <Icon size={22} />
                </span>
                <h3 className="text-base font-black uppercase tracking-[0.06em] text-[#1f2221]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#6f7573]">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bk-shell grid gap-4 py-10 lg:grid-cols-2">
        <Link to="/custom" className="group relative min-h-[260px] overflow-hidden rounded-xl bg-[#1f2221] p-8 text-white">
          <img
            src="https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&q=80&w=1200"
            alt="Celebration cake"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-55 transition duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/10" />
          <div className="relative">
            <span className="bk-chip px-3 py-1 text-xs">
              <Sparkles size={13} />
              Personalized
            </span>
            <h2 className="mt-5 max-w-sm text-3xl font-black leading-tight md:text-4xl">Make your own cake hamper</h2>
            <p className="mt-3 max-w-sm text-sm font-bold leading-6 text-white/85">Pick the flavour, theme, note, and delivery slot for a celebration built around your story.</p>
          </div>
        </Link>

        <Link to="/shop?cat=Wedding" className="group relative min-h-[260px] overflow-hidden rounded-xl bg-[#e61951] p-8 text-white">
          <img
            src="https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&q=80&w=1200"
            alt="Designer wedding cake"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-45 transition duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#e61951]/90 to-[#e61951]/10" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black text-[#e61951]">
              <Gift size={13} />
              Designer Picks
            </span>
            <h2 className="mt-5 max-w-sm text-3xl font-black leading-tight md:text-4xl">Designer cakes for grand moments</h2>
            <p className="mt-3 max-w-sm text-sm font-bold leading-6 text-white/90">Elegant multi-tier styles, anniversary favourites, and celebration showstoppers.</p>
          </div>
        </Link>
      </section>

      <section className="bk-shell pb-12">
        <div className="rounded-xl bg-[#fff2e9] px-5 py-6 md:flex md:items-center md:justify-between md:px-8">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-[#e61951]">
              <Clock size={22} />
            </span>
            <div>
              <h2 className="text-xl font-black text-[#1f2221]">Need it today?</h2>
              <p className="mt-1 text-sm leading-6 text-[#6f7573]">Choose express slots and send fresh cakes across major cities.</p>
            </div>
          </div>
          <Link to="/shop?filter=Same%20Day" className="bk-btn mt-5 h-11 px-5 text-sm md:mt-0">Explore Same Day Cakes</Link>
        </div>
      </section>
    </div>
  );
}

export {
  Home as default
};
