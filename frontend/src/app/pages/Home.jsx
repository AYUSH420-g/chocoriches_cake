import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CakeSlice, Clock, Gift, ShieldCheck, Sparkles, Star, Truck } from "lucide-react";
import { getProductsPaginated } from "../api/client";

const heroBanners = [
  { src: "/hero-banner.png", alt: "Theme Cakes Delivery" },
  { src: "/hreo-banner-2.png", alt: "Special Cake Collection" },
  { src: "/hero-banner-3.png", alt: "Premium Cake Selection" },
];
import ProductCard from "../components/ProductCard";

const wishCategories = [
  {
    name: "Classic",
    // image: "https://images.unsplash.com/photo-1602351447937-745cb720612f?auto=format&fit=crop&q=80&w=420",
    to: "/shop?cat=Essentials"
  },
  {
    name: "Gourmet",
    // image: "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&q=80&w=420",
    to: "/shop?cat=Signature"
  },
  {
    name: "Designer",
    // image: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&q=80&w=420",
    to: "/shop?cat=Wedding"
  },
  {
    name: "Photo Cakes",
    // image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&q=80&w=420",
    to: "/shop?cat=Celebration"
  },
  {
    name: "Desserts",
    // image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=420",
    to: "/shop?cat=Seasonal"
  },
  {
    name: "Hampers",
    // image: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&q=80&w=420",
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
  const [heroIndex, setHeroIndex] = useState(0);
  const pageRef = useRef(1);
  const requestIdRef = useRef(0);
  const sentinelRef = useRef(null);

  const loadPage = useCallback(async (page, requestId = requestIdRef.current) => {
    try {
      const data = await getProductsPaginated({}, page, 8);
      if (requestId !== requestIdRef.current) {
        return null;
      }
      if (page === 1) {
        setAllCakes(data.products);
      } else {
        setAllCakes((prev) => [...prev, ...data.products]);
      }
      setHasMore(data.hasMore);
      pageRef.current = data.currentPage;
      return data;
    } catch {
      if (requestId === requestIdRef.current && page === 1) {
        setAllCakes([]);
        setHasMore(false);
      }
      return null;
    }
  }, []);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    let cancelled = false;
    setIsLoading(true);
    setLoadingMore(false);
    setHasMore(true);
    pageRef.current = 1;
    loadPage(1, requestId).then((firstPage) => {
      if (cancelled || requestId !== requestIdRef.current) return;
      setIsLoading(false);
      // The IntersectionObserver will naturally load page 2 when the user scrolls near the bottom.
      // We removed the immediate double-fetch here.
    });
    return () => {
      cancelled = true;
    };
  }, [loadPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !isLoading) {
          const requestId = requestIdRef.current;
          setLoadingMore(true);
          loadPage(pageRef.current + 1, requestId).finally(() => {
            if (requestId === requestIdRef.current) {
              setLoadingMore(false);
            }
          });
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, isLoading, loadPage]);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bk-page overflow-hidden">
      <section className="bk-shell pt-4 pb-2 md:pt-8 md:pb-4">
        <Link
          to="/custom"
          className="relative mx-auto block max-w-6xl overflow-hidden rounded-[10px] bg-[#fff2e9] shadow-sm md:rounded-2xl"
          style={{ aspectRatio: "2017 / 528" }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.img
              key={heroIndex}
              src={heroBanners[heroIndex].src}
              alt={heroBanners[heroIndex].alt}
              loading={heroIndex === 0 ? "eager" : "lazy"}
              fetchpriority={heroIndex === 0 ? "high" : undefined}
              decoding="async"
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0 block h-full w-full object-contain"
            />
          </AnimatePresence>
        </Link>
        <div className="flex justify-center gap-1.5 pt-2 md:gap-2 md:pt-3">
          {heroBanners.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to banner ${i + 1}`}
              onClick={() => setHeroIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === heroIndex ? "w-5 bg-[#e61951]" : "w-1.5 bg-[#1f2221]/25 hover:bg-[#1f2221]/50"} md:h-2 ${i === heroIndex ? "md:w-6" : "md:w-2"}`}
            />
          ))}
        </div>
      </section>


      <section className="bk-shell py-4 md:py-8">
        <div className="mb-4 flex items-end justify-between gap-4 md:mb-5">
          <div>
            <p className="text-sm font-black lowercase tracking-[0.08em] text-[#DC184D]">explore</p>
            <h2 className="bk-section-title">Our Collection</h2>
          </div>
          <Link to="/shop" className="hidden items-center gap-2 text-sm font-black text-[#e61951] md:flex">
            View All
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-[8px] md:gap-4 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-lg border border-[#ebebeb] bg-white p-2 shadow-sm md:p-3">
                  <div className="aspect-square w-full rounded-lg bg-[#f5f0ec]"></div>
                  <div className="mt-4 h-4 w-2/3 rounded-full bg-[#f1f1f1]"></div>
                  <div className="mt-2 h-4 w-1/2 rounded-full bg-[#f1f1f1]"></div>
                </div>
              ))
            : allCakes.map((cake) => <ProductCard key={cake.id} product={cake}  mobileShopCard={true} />)}
        </div>
        {!isLoading && !allCakes.length && (
          <div className="bk-card py-10 text-center md:py-12">
            <h3 className="text-lg font-black text-[#1f2221] md:text-xl">No cakes found</h3>
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

      <section className="bg-white py-4 md:py-10">
        <div className="bk-shell">
          <div className="mb-4 flex items-end justify-between gap-4 md:mb-5">
            <div>
              <p className="text-sm font-black lowercase tracking-[0.08em] text-[#e61951] md:text-base">our promise</p>
              <h2 className="bk-section-title">Fresh bakes, On Time delivery</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-[8px] md:gap-4 lg:grid-cols-4">
            {promiseItems.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="rounded-lg border border-[#ebebeb] bg-[#f7f7f7] p-4 md:p-5">
                <span className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-[#fff2e9] text-[#e61951] md:mb-4 md:h-12 md:w-12">
                  <Icon size={22} />
                </span>
                <h3 className="text-sm font-black uppercase tracking-[0.04em] text-[#1f2221] md:text-base md:tracking-[0.06em]">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-[#6A716E] md:text-sm md:leading-6">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bk-shell grid gap-4 py-8 md:py-10 lg:grid-cols-2">
        <Link to="/custom" className="group relative min-h-[220px] overflow-hidden rounded-lg bg-[#1f2221] p-5 text-white md:min-h-[260px] md:rounded-xl md:p-8">
          <img
            src="/pic.jpg"
            alt="Make your own cake hamper"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-55 transition duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/10" />
          <div className="relative">
            <span className="bk-chip px-3 py-1 text-xs">
              <Sparkles size={13} />
              Personalized
            </span>
            <h2 className="mt-4 max-w-sm text-2xl font-black leading-tight md:mt-5 md:text-4xl">Make your own cake hamper</h2>
            <p className="mt-3 max-w-sm text-sm font-bold leading-6 text-white/85">Pick the flavour, theme, note, and delivery slot for a celebration built around your story.</p>
          </div>
        </Link>

        <Link to="/shop?cat=Wedding" className="group relative min-h-[220px] overflow-hidden rounded-lg bg-[#e61951] p-5 text-white md:min-h-[260px] md:rounded-xl md:p-8">
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
            <h2 className="mt-4 max-w-sm text-2xl font-black leading-tight md:mt-5 md:text-4xl">Designer cakes for grand moments</h2>
            <p className="mt-3 max-w-sm text-sm font-bold leading-6 text-white/90">Elegant multi-tier styles, anniversary favourites, and celebration showstoppers.</p>
          </div>
        </Link>
      </section>

      <section className="bk-shell pb-12">
        <div className="rounded-lg bg-[#fff2e9] px-4 py-5 md:flex md:items-center md:justify-between md:rounded-xl md:px-8 md:py-6">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-[#e61951]">
              <Clock size={22} />
            </span>
            <div>
              <h2 className="text-lg font-black text-[#1f2221] md:text-xl">Need it today?</h2>
              <p className="mt-1 text-sm leading-6 text-[#6f7573]">Choose express slots and send fresh cakes across major cities.</p>
            </div>
          </div>
          <Link to="/shop?filter=Same%20Day" className="bk-btn mt-5 h-12 w-full px-5 text-sm md:mt-0 md:h-11 md:w-auto">Explore Same Day Cakes</Link>
        </div>
      </section>
    </div>
  );
}

export {
  Home as default
};
