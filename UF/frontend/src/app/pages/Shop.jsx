import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Filter, SlidersHorizontal, Truck, X } from "lucide-react";
import { getProducts } from "../api/client";
import ProductCard from "../components/ProductCard";
import { PRODUCTS } from "../data/catalog";

const baseCategoryTabs = [
  { label: "All Cakes", value: "All" },
  { label: "Chocolate Cakes", value: "Signature" },
  { label: "Designer Cakes", value: "Wedding" },
  { label: "Mango Cakes", value: "Seasonal" },
  { label: "Birthday Cakes", value: "Birthday Cakes" },
  { label: "Classic Cakes", value: "Essentials" }
];

const filters = ["Eggless", "Same Day", "Bestseller", "Under Rs. 799", "Premium"];

function Shop() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("cat") || "All";
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState("Recommended");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [products, setProducts] = useState(PRODUCTS);

  useEffect(() => {
    setActiveCategory(searchParams.get("cat") || "All");
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;
    getProducts()
      .then((items) => {
        if (mounted && items.length) {
          setProducts(items);
        }
      })
      .catch(() => void 0);
    return () => {
      mounted = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const visible = activeCategory === "All" ? products : products.filter((product) => product.category === activeCategory);
    return [...visible].sort((left, right) => {
      if (sortBy === "Price: Low to High") {
        return left.price - right.price;
      }
      if (sortBy === "Price: High to Low") {
        return right.price - left.price;
      }
      return 0;
    });
  }, [activeCategory, products, sortBy]);

  const categoryTabs = useMemo(() => {
    const knownValues = new Set(baseCategoryTabs.map((category) => category.value));
    const dynamicTabs = [...new Set(products.map((product) => product.category).filter(Boolean))]
      .filter((category) => !knownValues.has(category))
      .map((category) => ({ label: category, value: category }));

    return [...baseCategoryTabs, ...dynamicTabs];
  }, [products]);

  return (
    <div className="bk-page">
      <div className="border-b border-[#ebebeb] bg-white">
        <div className="bk-shell py-6">
          <nav className="mb-4 flex gap-2 text-xs font-bold text-[#6f7573]">
            <Link to="/" className="hover:text-[#e61951]">Home</Link>
            <span>/</span>
            <span className="text-[#1f2221]">Cakes</span>
          </nav>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-[#1f2221] md:text-5xl">Online Cake Delivery</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f7573]">
                Browse fresh cakes by flavour, occasion, and delivery slot with a Bakingo-style marketplace flow.
              </p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#fff2e9] px-4 py-2 text-sm font-black text-[#e61951]">
              <Truck size={18} />
              Same Day Delivery Available
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-[118px] z-30 border-b border-[#ebebeb] bg-white/95 backdrop-blur">
        <div className="bk-shell flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto">
            {categoryTabs.map((category) => (
              <button
                key={category.value}
                type="button"
                onClick={() => setActiveCategory(category.value)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-black transition ${
                  activeCategory === category.value
                    ? "bg-[#e61951] text-white"
                    : "bg-[#f7f7f7] text-[#1f2221] hover:bg-[#fff2e9] hover:text-[#e61951]"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#ebebeb] bg-white px-4 text-sm font-black text-[#1f2221] lg:hidden"
            >
              <Filter size={17} />
              Filter
            </button>
            <label className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#ebebeb] bg-white px-3 text-sm font-black text-[#1f2221]">
              Sort
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="bg-transparent text-sm outline-none"
              >
                <option>Recommended</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
              <ChevronDown size={15} />
            </label>
          </div>
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
                  <input type="checkbox" className="h-4 w-4 accent-[#e61951]" />
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
              Showing <span className="font-black text-[#1f2221]">{filteredProducts.length}</span> cakes
            </p>
            <p className="hidden text-sm font-bold text-[#6f7573] md:block">Ratings, price, and delivery slot visible on every card</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
          </div>

          {filteredProducts.length === 0 && (
            <div className="bk-card py-20 text-center">
              <h3 className="text-2xl font-black text-[#1f2221]">No cakes found</h3>
              <p className="mt-2 text-sm text-[#6f7573]">Try another category or clear filters.</p>
              <button type="button" onClick={() => setActiveCategory("All")} className="bk-btn mt-6 h-11 px-6 text-sm">
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
                    <input type="checkbox" className="h-4 w-4 accent-[#e61951]" />
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
