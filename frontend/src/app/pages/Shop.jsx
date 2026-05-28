import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Filter, SlidersHorizontal, Truck, X } from "lucide-react";
import { getProducts, getCategories, getSubcategories } from "../api/client";
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
  const searchQuery = searchParams.get("q") || "";

  useEffect(() => {
    setActiveCategory(searchParams.get("cat") || "All");
    setActiveSubcategory(searchParams.get("subcat") || "");
    const filter = searchParams.get("filter");
    setActiveFilters(filter && filters.includes(filter) ? [filter] : []);
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    getProducts({ q: searchQuery })
      .then((items) => {
        if (mounted) setProducts(items);
      })
      .catch(() => {
        if (mounted) setProducts([]);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    getCategories()
      .then((cats) => { if (mounted) setCategories(cats); })
      .catch(() => {});
    getSubcategories()
      .then((subs) => { if (mounted) setSubcategories(subs); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [searchQuery]);

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

  const filteredProducts = useMemo(() => {
    let visible = products;

    if (activeCategory !== "All") {
      visible = visible.filter((product) => product.category === activeCategory || product.categories?.includes(activeCategory));
    }
    if (activeSubcategory) {
      visible = visible.filter((product) => product.subcategory === activeSubcategory);
    }

    if (activeFilters.includes("Same Day")) {
      visible = visible.filter((product) => Number(product.stock ?? 1) > 0);
    }
    if (activeFilters.includes("Bestseller")) {
      visible = visible.filter((product) => product.isBestSeller || product.featured);
    }
    if (activeFilters.includes("Under Rs. 799")) {
      visible = visible.filter((product) => Number(product.price || 0) <= 799);
    }

    return [...visible].sort((left, right) => {
      if (sortBy === "Price: Low to High") return left.price - right.price;
      if (sortBy === "Price: High to Low") return right.price - left.price;
      if (sortBy === "Name: A to Z") return String(left.name || "").localeCompare(String(right.name || ""));
      if (sortBy === "Newest") return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
      return 0;
    });
  }, [activeCategory, activeSubcategory, activeFilters, products, sortBy]);

  return (
    <div className="bk-page">
      <div className="border-b border-[#ebebeb] bg-white">
        <div className="bk-shell py-6">
          <nav className="mb-4 flex gap-2 text-xs font-bold text-[#6f7573]">
            <Link to="/" className="hover:text-[#e61951]">Home</Link>
            <span>/</span>
            {activeCategory !== "All" && (
              <>
                <Link to={`/shop?cat=${encodeURIComponent(activeCategory)}`} className="hover:text-[#e61951]">{activeCategory}</Link>
                {activeSubcategory && <span>/</span>}
              </>
            )}
            <span className="text-[#1f2221]">{activeSubcategory || (activeCategory === "All" ? "All Cakes" : activeCategory)}</span>
          </nav>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#1f2221] md:text-4xl">{pageTitle}</h1>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#fff2e9] px-4 py-2 text-sm font-bold text-[#e61951]">
              <Truck size={18} />
              Same Day Delivery Available
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-[118px] z-30 border-b border-[#ebebeb] bg-white/95 backdrop-blur">
        <div className="bk-shell flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#ebebeb] bg-white px-4 text-sm font-bold text-[#1f2221] lg:hidden"
            >
              <Filter size={17} />
              Filter
            </button>
          </div>
          <label className="inline-flex h-10 items-center gap-1 rounded-lg border border-[#ebebeb] bg-white pl-3 pr-2 text-sm font-bold text-[#6f7573]">
            Sort by:
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="appearance-none bg-transparent px-1 font-semibold text-[#1f2221] outline-none"
            >
              {sortOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
            <ChevronDown size={15} className="text-[#1f2221]" />
          </label>
        </div>
      </div>

      <div className="bk-shell grid gap-5 py-6 lg:grid-cols-[250px_1fr]">
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

        <main>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-bold text-[#6f7573]">
              {isLoading ? (
                "Loading cakes..."
              ) : (
                <>Showing <span className="font-black text-[#1f2221]">{filteredProducts.length}</span> cakes</>
              )}
            </p>
            {/* <p className="hidden text-sm font-bold text-[#6f7573] md:block">Ratings, price, and delivery slot visible on every card</p> */}
          </div>

          <div className="grid gap-4 grid-cols-2 xl:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-white p-3 shadow-sm border border-[#ebebeb]">
                  <div className="aspect-square w-full rounded-xl bg-[#f5f0ec]"></div>
                  <div className="mt-4 h-4 w-2/3 rounded-full bg-[#f1f1f1]"></div>
                  <div className="mt-2 h-4 w-1/2 rounded-full bg-[#f1f1f1]"></div>
                </div>
              ))
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.22 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {!isLoading && filteredProducts.length === 0 && (
            <div className="bk-card py-20 text-center">
              <h3 className="text-2xl font-black text-[#1f2221]">No cakes found</h3>
              <p className="mt-2 text-sm text-[#6f7573]">Try another category or clear filters.</p>
              <button type="button" onClick={clearFilters} className="bk-btn mt-6 h-11 px-6 text-sm">
                Show All Cakes
              </button>
            </div>
          )}
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
              className="fixed inset-x-0 bottom-0 z-[90] rounded-t-2xl bg-white p-5 shadow-2xl lg:hidden"
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
              <button type="button" onClick={() => setIsFilterOpen(false)} className="bk-btn mt-5 h-11 w-full text-sm">Apply Filters</button>
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
