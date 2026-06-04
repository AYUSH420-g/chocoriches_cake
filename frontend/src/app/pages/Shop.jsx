import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Filter, SlidersHorizontal, Truck, X } from "lucide-react";
import { getProductsPaginated, getCategories, getSubcategories } from "../api/client";
import ProductCard from "../components/ProductCard";

const filters = ["Same Day", "Bestseller", "Under Rs. 799"];
const sortOptions = ["Newest", "Price: Low to High", "Price: High to Low", "Name: A to Z"];

function Shop() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("cat") || "All";
  const initialSubcategory = searchParams.get("subcat") || "";
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activeSubcategory, setActiveSubcategory] = useState(initialSubcategory);
  const [activeFilters, setActiveFilters] = useState(() => {
    const filter = searchParams.get("filter");
    return filter && filters.includes(filter) ? [filter] : [];
  });
  const [sortBy, setSortBy] = useState("Newest");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);
  const requestIdRef = useRef(0);
  const sentinelRef = useRef(null);
  const searchQuery = searchParams.get("q") || "";

  useEffect(() => {
    setActiveCategory(searchParams.get("cat") || "All");
    setActiveSubcategory(searchParams.get("subcat") || "");
    const filter = searchParams.get("filter");
    setActiveFilters(filter && filters.includes(filter) ? [filter] : []);
  }, [searchParams]);

  const loadPage = useCallback(async (page, query, cat, subcat, filterArr, sort, requestId = requestIdRef.current) => {
    try {
      const options = { q: query };
      if (cat && cat !== "All") options.category = cat;
      if (subcat) options.subcategory = subcat;
      if (filterArr.includes("Same Day")) options.sameDay = true;
      if (filterArr.includes("Bestseller")) options.bestseller = true;
      if (filterArr.includes("Under Rs. 799")) options.maxPrice = 799;
      if (sort) options.sortBy = sort;

      const data = await getProductsPaginated(options, page, 8);
      if (requestId !== requestIdRef.current) {
        return null;
      }
      if (page === 1) {
        setProducts(data.products);
      } else {
        setProducts((prev) => [...prev, ...data.products]);
      }
      setHasMore(data.hasMore);
      pageRef.current = data.currentPage;
      return data;
    } catch {
      if (requestId === requestIdRef.current && page === 1) {
        setProducts([]);
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
    setProducts([]);
    pageRef.current = 1;
    setHasMore(true);
    loadPage(1, searchQuery, activeCategory, activeSubcategory, activeFilters, sortBy, requestId).then((firstPage) => {
      if (cancelled || requestId !== requestIdRef.current) return;
      setIsLoading(false);
      if (!firstPage?.hasMore) return;

      setLoadingMore(true);
      loadPage(firstPage.currentPage + 1, searchQuery, activeCategory, activeSubcategory, activeFilters, sortBy, requestId).finally(() => {
        if (!cancelled && requestId === requestIdRef.current) {
          setLoadingMore(false);
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, [searchQuery, activeCategory, activeSubcategory, activeFilters, sortBy, loadPage]);

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      getCategories().then((items) => { if (mounted) setCategories(items); }).catch(() => {});
      getSubcategories().then((items) => { if (mounted) setSubcategories(items); }).catch(() => {});
    }, 300);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !isLoading) {
          const requestId = requestIdRef.current;
          setLoadingMore(true);
          loadPage(pageRef.current + 1, searchQuery, activeCategory, activeSubcategory, activeFilters, sortBy, requestId).finally(() => {
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
  }, [hasMore, loadingMore, isLoading, loadPage, searchQuery, activeCategory, activeSubcategory, activeFilters, sortBy]);

  const toggleFilter = (filter) => {
    setActiveFilters((current) =>
      current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter]
    );
  };

  const clearFilters = () => {
    setActiveCategory("All");
    setActiveFilters([]);
  };

  const pageTitle = useMemo(() => {
    if (searchQuery) return `Search: "${searchQuery}"`;
    if (activeSubcategory) {
      const sub = subcategories.find((s) => s.name === activeSubcategory);
      return sub ? sub.name : activeSubcategory;
    }
    if (activeCategory && activeCategory !== "All") {
      const cat = categories.find((c) => c.name === activeCategory);
      return cat ? cat.name : activeCategory;
    }
    return "All Cakes";
  }, [activeCategory, activeSubcategory, searchQuery, categories, subcategories]);

  return (
    <div className="bk-page">
      <div className="border-b border-[#ebebeb] bg-white">
        <div className="bk-shell md:pb-6 pt-0">
          {/* <nav className="flex gap-2 text-xs font-bold text-[#6f7573] md:mb-4">
            <Link to="/" className="hover:text-[#e61951]">Home</Link>
            <span>/</span>
            {activeCategory !== "All" && (
              <>
                <Link to={`/shop?cat=${encodeURIComponent(activeCategory)}`} className="hover:text-[#e61951]">{activeCategory}</Link>
                {activeSubcategory && <span>/</span>}
              </>
            )}
            <span className="text-[#1f2221]">{activeSubcategory || (activeCategory === "All" ? "All Cakes" : activeCategory)}</span>
          </nav> */}
          <div className=" flex-col items-center gap-3 text-center md:flex-row md:items-end md:justify-between md:text-left hidden md:flex sm:flex">
            <div>
              <h1 className="text-[20px] font-bold tracking-tight text-[#1f2221] md:text-4xl">{pageTitle}</h1>
            </div>
            <div className=" w-fit items-center gap-2 rounded-full bg-[#fff2e9] px-3 py-1.5 text-xs font-bold text-[#e61951] md:px-4 md:py-2 md:text-sm hidden md:inline-flex sm:inline-flex">
              <Truck size={18} />
              Same Day Delivery Available
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-[108px] z-30 border-b border-[#ebebeb] bg-white/95 backdrop-blur md:top-[118px]">
        <div className="bk-shell grid grid-cols-2 items-center gap-3 py-2.5 md:flex md:justify-between md:py-3">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#ebebeb] bg-white px-3 text-sm font-bold text-[#1f2221] shadow-sm transition-colors hover:border-[#e61951] hover:text-[#e61951] lg:hidden md:w-auto md:px-4"
            >
              <Filter size={17} />
              Filter
            </button>
          </div>
          <label className="inline-flex h-10 w-full min-w-0 items-center justify-center gap-1 rounded-full border border-[#ebebeb] bg-white pl-4 pr-3 text-xs font-bold text-[#6f7573] shadow-sm transition-colors hover:border-[#e61951] hover:text-[#e61951] md:w-auto md:text-sm">
            <span className="shrink-0 whitespace-nowrap">Sort by:</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="min-w-0 max-w-[88px] appearance-none truncate bg-transparent px-1 font-semibold text-[#1f2221] outline-none md:max-w-none group-hover:text-[#e61951]"
            >
              {sortOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
            <ChevronDown size={15} className="text-current" />
          </label>
        </div>
      </div>

      <div className="bk-shell grid gap-2 py-3 md:gap-5 md:py-6 lg:grid-cols-[250px_1fr] bg-white">
        <aside className="hidden lg:block">
          <div className="bk-card sticky top-[190px] p-5">
            <div className="mb-5 flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-[#e61951]" />
              <h2 className="text-base font-black">Filters</h2>
            </div>
            <div className="space-y-3">
              {filters.map((filter) => (
                <label key={filter} className="flex cursor-pointer items-center justify-between rounded-lg border border-[#ebebeb] px-3 py-3 text-sm font-bold text-[#5f6663] hover:border-[#e61951]">
                  {filter}
                  <input
                    type="checkbox"
                    checked={activeFilters.includes(filter)}
                    onChange={() => toggleFilter(filter)}
                    className="h-4 w-4 accent-[#e61951]"
                  />
                </label>
              ))}
            </div>
            <div className="mt-5 rounded-lg bg-[#fff2e9] p-4">
              <p className="text-sm font-black text-[#1f2221]">Delivery Promise</p>
              <p className="mt-1 text-xs leading-5 text-[#6f7573]">Fresh cakes packed securely and delivered in your selected slot.</p>
            </div>
          </div>
        </aside>

        <main className="bg-white">
          <div className="mb-3 flex items-center justify-between md:mb-4">
            <p className="text-sm font-bold text-[#6f7573]">
              {isLoading ? (
                "Loading cakes..."
              ) : (
                <>Showing <span className="font-black text-[#1f2221]">{products.length}</span> cakes</>
              )}
            </p>
            {/* <p className="hidden text-sm font-bold text-[#6f7573] md:block">Ratings, price, and delivery slot visible on every card</p> */}
          </div>

          <div className="grid grid-cols-2 gap-[8px] md:gap-4 xl:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-lg border border-[#ebebeb] bg-white p-2 shadow-sm md:p-3">
                  <div className="aspect-square w-full rounded-lg bg-[#f5f0ec]"></div>
                  <div className="mt-4 h-4 w-2/3 rounded-full bg-[#f1f1f1]"></div>
                  <div className="mt-2 h-4 w-1/2 rounded-full bg-[#f1f1f1]"></div>
                </div>
              ))
            ) : (
              <AnimatePresence mode="popLayout">
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.22 }}
                  >
                    <ProductCard product={product} mobileShopCard />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {!isLoading && products.length === 0 && (
            <div className="bk-card py-12 text-center md:py-20">
              <h3 className="text-xl font-black text-[#1f2221] md:text-2xl">No cakes found</h3>
              <p className="mt-2 text-sm text-[#6f7573]">Try another category or clear filters.</p>
              <button type="button" onClick={clearFilters} className="bk-btn mt-5 h-12 px-6 text-sm md:mt-6 md:h-11">
                Show All Cakes
              </button>
            </div>
          )}
          {loadingMore && (
            <div className="flex justify-center py-6">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#ebebeb] border-t-[#e61951]" />
            </div>
          )}
          <div ref={sentinelRef} className="h-1" />
        </main>
      </div>

      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close filters"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 z-[80] bg-black/35 lg:hidden"
            />
            <motion.aside
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 230 }}
              className="fixed inset-x-0 bottom-0 z-[90] rounded-t-[14px] bg-white p-4 pb-[calc(16px+env(safe-area-inset-bottom))] shadow-2xl lg:hidden md:p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-black">Filters</h2>
                <button type="button" title="Close" aria-label="Close filters" onClick={() => setIsFilterOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-[#f7f7f7]">
                  <X size={18} />
                </button>
              </div>
              <div className="grid gap-3">
                {filters.map((filter) => (
                  <label key={filter} className="flex cursor-pointer items-center justify-between rounded-lg border border-[#ebebeb] px-3 py-3 text-sm font-bold text-[#5f6663]">
                    {filter}
                    <input
                      type="checkbox"
                      checked={activeFilters.includes(filter)}
                      onChange={() => toggleFilter(filter)}
                      className="h-4 w-4 accent-[#e61951]"
                    />
                  </label>
                ))}
              </div>
              <button type="button" onClick={() => setIsFilterOpen(false)} className="bk-btn mt-5 h-12 w-full text-sm md:h-11">Apply Filters</button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export {
  Shop as default
};
