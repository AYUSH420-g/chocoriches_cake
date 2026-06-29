import { Outlet, Link, useLocation, useNavigate, useNavigationType, ScrollRestoration } from "react-router";
import {
  CakeSlice,
  ChevronDown,
  Facebook,
  Gift,
  Headphones,
  Instagram,
  MapPin,
  Menu,
  Search,
  ShoppingCart,
  Truck,
  User,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Toaster } from "./ui/sonner";
import { getPublicSettings, getCategories, getSubcategories } from "../api/client";
import { useCart } from "../context/CartContext";
import { getStoredUser, isUserLoggedIn, SESSION_EVENT, getGuestUser } from "../utils/session";
import TopLoader from "./TopLoader";
import StampSystem from "./StampSystem";



const footerLinks = [
  ["Our Company", "About Us", "Contact Us", "Corporate Orders"],
  ["Quick Links", "Cakes", "Designer Cakes", "Custom Cakes", "Track Order"],
  ["Help", "Return Policy", "FAQs", "Terms & Conditions"]
];

function RootLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(() => getStoredUser());
  const [loggedIn, setLoggedIn] = useState(() => isUserLoggedIn());
  const [settings, setSettings] = useState({ maintenanceMode: false, maintenanceMessage: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [dbCategories, setDbCategories] = useState([]);
  const [dbSubcategories, setDbSubcategories] = useState([]);
  const [hoveredCat, setHoveredCat] = useState(null);
  const [mobileExpandedCat, setMobileExpandedCat] = useState(null);
  const closeMenuTimerRef = useRef(null);
  const { cartCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const isAuthPage = location.pathname === "/auth";

  const categoryLinks = useMemo(() => {
    const links = [{ label: "Design My Cake", to: "/custom", isSpecial: true }];
    dbCategories.forEach((cat) => {
      links.push({ label: cat.name, to: `/shop?cat=${encodeURIComponent(cat.name)}` });
    });
    return links;
  }, [dbCategories]);

  const subcatsByCategory = useMemo(() => {
    const map = {};
    dbSubcategories.forEach((sub) => {
      if (!map[sub.category]) map[sub.category] = [];
      map[sub.category].push(sub);
    });
    return map;
  }, [dbSubcategories]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    if (navigationType !== "POP") {
      // Don't override scroll on back/forward
      window.scrollTo(0, 0);
    }
    setUser(getStoredUser());
    setLoggedIn(isUserLoggedIn());
    setSearchTerm(new URLSearchParams(location.search).get("q") || "");
  }, [location.pathname, location.search, navigationType]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const syncSession = () => {
      setUser(getStoredUser());
      setLoggedIn(isUserLoggedIn());
    };

    window.addEventListener(SESSION_EVENT, syncSession);
    return () => {
      window.removeEventListener(SESSION_EVENT, syncSession);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    getPublicSettings()
      .then((nextSettings) => {
        if (mounted) {
          setSettings(nextSettings);
        }
      })
      .catch(() => void 0);

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    // Delay non-critical navbar data so product APIs get network priority
    const timer = setTimeout(() => {
      getCategories()
        .then((cats) => { if (mounted) setDbCategories(cats); })
        .catch(() => {});
      getSubcategories()
        .then((subs) => { if (mounted) setDbSubcategories(subs); })
        .catch(() => {});
    }, 500);
    return () => { mounted = false; clearTimeout(timer); };
  }, []);

  useEffect(() => () => {
    if (closeMenuTimerRef.current) {
      window.clearTimeout(closeMenuTimerRef.current);
    }
  }, []);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = searchTerm.trim();
    navigate(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
  };

  const isActiveCategory = (to) => {
    const [path, query = ""] = to.split("?");
    if (location.pathname !== path) {
      return false;
    }
    // Exact match OR the current URL's query starts with the category query
    // e.g. cat=Birthday matches cat=Birthday&subcat=Bento
    const currentQuery = (location.search || "").replace(/^\?/, "");
    if (!query) return currentQuery === "";
    return currentQuery === query || currentQuery.startsWith(query + "&");
  };

  const isActiveSubcategory = (catLabel, subName) => {
    if (location.pathname !== "/shop") return false;
    const params = new URLSearchParams(location.search);
    return params.get("cat") === catLabel && params.get("subcat") === subName;
  };

  const keepDesktopMenuOpen = () => {
    if (closeMenuTimerRef.current) {
      window.clearTimeout(closeMenuTimerRef.current);
      closeMenuTimerRef.current = null;
    }
  };

  const openDesktopMenu = (label, target) => {
    keepDesktopMenuOpen();
    const rect = target.getBoundingClientRect();
    const menuWidth = 220;
    setHoveredCat({
      label,
      left: Math.max(16, Math.min(rect.left, window.innerWidth - menuWidth - 16)),
      top: rect.bottom,
    });
  };

  const scheduleDesktopMenuClose = () => {
    keepDesktopMenuOpen();
    closeMenuTimerRef.current = window.setTimeout(() => setHoveredCat(null), 120);
  };

  if (settings.maintenanceMode) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7f7f7] px-6 text-center text-[#1f2221]">
        <div className="max-w-lg rounded-xl border border-[#ebebeb] bg-white p-8 shadow-xl shadow-black/5">
          <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-[#fff2e9] text-[#e63946]">
            <CakeSlice size={28} />
          </span>
          <h1 className="text-3xl font-black text-[#1f2221]">ChocoRiches is under maintenance</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-[#6f7573]">
            {settings.maintenanceMessage || "We are under maintenance. Please check back shortly."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f7] text-[#1f2221] w-full">
      <TopLoader />
      <Toaster position="top-center" />

      {!isAuthPage && (
        <>
      <header className={`fixed inset-x-0 top-0 z-50 bg-white transition-shadow ${scrolled ? "shadow-md shadow-black/5" : "shadow-sm shadow-black/5"}`}>
        <div className="bk-shell">
          <div className="flex h-16 items-center gap-2 md:h-[72px] md:gap-3">
            <button
              type="button"
              aria-label="Open menu"
              title="Menu"
              onClick={() => setIsMenuOpen(true)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full  text-[#1f2221] lg:hidden"
            >
              <Menu size={20} />
            </button>

            <Link to="/" className="flex min-w-0 shrink-0 items-center pr-1 md:pr-2" aria-label="ChocoRiches home">
              <span className="min-w-0 leading-none">
                <span className="block truncate text-[20px] font-black tracking-tight text-[#e63946] md:text-[22px]">ChocoRiches</span>
                <span className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-[#6f7573] sm:block">Fresh Cakes Online</span>
              </span>
            </Link>

            {/* <button
              type="button"
              className="hidden min-w-[172px] items-center justify-between rounded-lg border border-[#ebebeb] px-3 py-2 text-left lg:flex"
              title="Deliver to"
            >
              <span className="flex min-w-0 items-center gap-2">
                <MapPin size={18} className="shrink-0 text-[#e63946]" />
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase text-[#6f7573]">Deliver To</span>
                  <span className="block truncate text-sm font-black text-[#1f2221]">Gujrat</span>
                </span>
              </span>
            </button> */}

            <form onSubmit={handleSearchSubmit} className="relative hidden flex-1 max-w-md mr-auto lg:max-w-lg xl:max-w-xl md:block lg:ml-4">
              <Search size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7f8583]" />
              <input
                type="search"
                aria-label="Search cakes"
                placeholder="Search for cakes, flavours, occasions..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-11 w-full rounded-lg border border-[#ebebeb] bg-[#f7f7f7] pl-12 pr-4 text-sm outline-none transition focus:border-[#e63946] focus:bg-white focus:ring-4 focus:ring-[#e63946]/10"
              />
            </form>

            <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-2">
              <Link
                to="/track"
                title="Track order"
                className="hidden h-11 items-center gap-2 rounded-lg px-3 text-xs font-black text-[#1f2221] transition hover:bg-[#fff2e9] lg:flex"
              >
                <Truck size={19} className="text-[#e63946]" />
                Track Order
              </Link>
              
              <StampSystem />
              
              <Link
                to="/cart"
                title="Cart"
                aria-label="Cart"
                className="relative grid h-6 w-10 place-items-center rounded-lg text-[#1f2221] transition hover:bg-[#fff2e9] hover:text-[#e63946] md:h-11 md:w-11"
              >
                <ShoppingCart size={21} />
                {cartCount>0 ? 
                <span className="absolute right-1 top-0 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-[#e63946] px-1 text-[10px] font-black leading-none text-white">{cartCount}</span>
                :<span className=""></span>}
              </Link>
              <Link
                to={loggedIn ? "/profile" : "/auth"}
                title={loggedIn ? "My profile" : "Login or signup"}
                aria-label={loggedIn ? "My profile" : "Login or signup"}
                className="grid h-10 w-10 place-items-center rounded-lg text-[#1f2221] transition hover:bg-[#fff2e9] hover:text-[#e63946] md:h-11 md:w-11"
              >
                {loggedIn && user?.name ? (
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#fefefe] text-sm font-black text-[#454545] border-[#49494950] border">
                    {user.name.slice(0, 1).toUpperCase()}
                  </span>
                ) : (
                  <User size={20} />
                )}
              </Link>
            </div>
            
          </div>
        </div>
          <div className="flex pl-[16px] h-11 min-w-0 items-center gap-3 border-t border-[#dfdfdf] overflow-x-auto scrollbar-hide md:h-[46px] lg:overflow-visible bg-[#f4f4f4]" style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}>
            <div className="flex min-w-0 flex-1 lg:justify-center gap-1">
              {categoryLinks.map((item) => {
                const subs = subcatsByCategory[item.label];
                const hasSubs = subs && subs.length > 0;
                const isOpen = hoveredCat?.label === item.label;
                return (
                  <div
                    key={item.label}
                    className="relative"
                    onPointerEnter={(event) => event.pointerType === "mouse" && hasSubs && openDesktopMenu(item.label, event.currentTarget)}
                    onPointerLeave={(event) => event.pointerType === "mouse" && hasSubs ? scheduleDesktopMenuClose() : undefined}
                  >
                    <Link
                      to={item.to}
                      onClick={(e) => {
                        if (hasSubs && (window.innerWidth < 1024 || ("ontouchstart" in window))) {
                          e.preventDefault();
                          if (isOpen) {
                            setHoveredCat(null);
                          } else {
                            openDesktopMenu(item.label, e.currentTarget.parentElement);
                          }
                        }
                      }}
                      className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-bold transition md:py-2 ${
                        isActiveCategory(item.to) || isOpen
                          ? "text-[#e63946] font-black decoration-2 underline-offset-4"
                          : item.isSpecial
                          ? "text-[#323635] font-black hover:text-[#e63946]"
                          : "text-[#323635] hover:text-[#e63946]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </div>
                );
              })}
            </div>
            <Link
              to="/custom"
              className="hidden shrink-0 items-center gap-2 rounded-lg bg-[#fff2e9] px-3 py-2 text-sm font-black text-[#e63946] md:flex"
            >
              <Gift size={17} />
              Order Custom
            </Link>
          </div>
          {hoveredCat?.label && subcatsByCategory[hoveredCat.label]?.length > 0 && (
            <>
              <div className="fixed inset-0 z-[190] lg:hidden" onClick={() => setHoveredCat(null)} />
              <div
                className="fixed z-[200] pt-1"
                style={{ left: hoveredCat.left, top: hoveredCat.top }}
                onMouseEnter={keepDesktopMenuOpen}
                onMouseLeave={scheduleDesktopMenuClose}
              >
              <div className="min-w-[220px] rounded-xl border border-[#ebebeb] bg-white py-2 shadow-xl shadow-black/10">
                <Link
                  to={`/shop?cat=${encodeURIComponent(hoveredCat.label)}`}
                  className="block px-4 py-2 text-sm font-normal text-[#323635] transition hover:bg-[#fff2e9] hover:text-[#e63946]"
                  onClick={() => setHoveredCat(null)}
                >
                  Show All
                </Link>
                <div className="my-1 border-t border-[#f1f1f1]" />
                {subcatsByCategory[hoveredCat.label].map((sub) => (
                  <Link
                    key={sub.id}
                    to={`/shop?cat=${encodeURIComponent(hoveredCat.label)}&subcat=${encodeURIComponent(sub.name)}`}
                    className={`block px-4 py-2 text-sm font-normal transition hover:text-[#e63946] ${
                      isActiveSubcategory(hoveredCat.label, sub.name)
                        ? "text-[#e63946] font-bold underline decoration-2 underline-offset-4"
                        : "text-[#323635]"
                    }`}
                    onClick={() => setHoveredCat(null)}
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
              </div>
            </>
          )}
        
      </header>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-[60] bg-black/35"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed inset-y-0 left-0 z-[70] flex w-[65vw] max-w-[280px] flex-col bg-white shadow-2xl"
            >
              <div className="flex h-16 items-center justify-between border-b border-[#ebebeb] px-5">
                <Link to="/" className="flex items-center text-xl font-black text-[#e63946]">
                  ChocoRiches
                </Link>
                <button type="button" aria-label="Close menu" title="Close" onClick={() => setIsMenuOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-[#f7f7f7]">
                  <X size={20} />
                </button>
              </div>
              {/* <div className="border-b border-[#ebebeb] bg-[#fdefef] p-3">
                <button type="button" className="flex w-full items-center justify-between rounded-lg bg-white px-4 py-3 text-left">
                  <span className="flex items-center gap-3">
                    <MapPin className="text-[#e63946]" size={19} />
                    <span>
                      <span className="block text-[10px] font-black uppercase text-[#6f7573]">Delivering to</span>
                      <span className="text-sm font-black">{getGuestUser()?.city || getGuestUser()?.pincode || "Select Location"}</span>
                    </span>
                  </span>
                  
                </button>
              </div> */}
              <nav className="flex flex-1 flex-col overflow-y-auto p-3 pb-28">
                {categoryLinks.map((item) => {
                  const subs = subcatsByCategory[item.label];
                  const hasSubs = subs && subs.length > 0;
                  const isExpanded = mobileExpandedCat === item.label;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center">
                        {hasSubs ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setMobileExpandedCat(isExpanded ? null : item.label);
                            }}
                            className={`flex-1 w-full rounded-lg px-4 py-3 text-base font-bold flex items-center justify-between transition ${
                              isActiveCategory(item.to) || isExpanded
                                ? "text-[#e63946] underline decoration-2 underline-offset-4"
                                : "text-[#1f2221] hover:text-[#e63946]"
                            }`}
                          >
                            {item.label}
                            <ChevronDown size={16} className={`text-[#6f7573] transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </button>
                        ) : (
                          <Link
                            to={item.to}
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex-1 rounded-lg px-4 py-3 text-base flex items-center justify-between transition ${
                              item.isSpecial
                                ? isActiveCategory(item.to)
                                ? "text-[#e63946] font-black underline decoration-2 underline-offset-4"
                                : "text-[#323635] font-black hover:text-[#e63946]"
                                : "text-[#1f2221] hover:text-[#e63946] font-bold"
                            }`}
                          >
                            {item.label}
                          </Link>
                        )}
                      </div>
                      {hasSubs && isExpanded && (
                        <div className="mb-1 grid gap-1">
                          {subs.map((sub) => (
                            <Link
                              key={sub.id}
                              to={`/shop?cat=${encodeURIComponent(item.label)}&subcat=${encodeURIComponent(sub.name)}`}
                              className={`block rounded-lg px-8 py-2.5 text-sm font-medium transition hover:text-[#e63946] ${
                                isActiveSubcategory(item.label, sub.name)
                                  ? "text-[#e63946] font-bold underline decoration-2 underline-offset-4"
                                  : "text-[#6f7573]"
                              }`}
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* <div className="mt-4 px-2">
                  <Link 
                    to="/custom" 
                    onClick={() => setIsMenuOpen(false)} 
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#fff2e9] px-4 py-3.5 text-sm font-black text-[#e63946] transition hover:bg-[#ffe1cc]"
                  >
                    <Gift size={18} />
                    Order Custom Cake
                  </Link>
                </div> */}
              </nav>
              <div className="absolute inset-x-0 bottom-0 border-t border-[#ebebeb] p-5">
                <Link to={loggedIn ? "/profile" : "/auth"} className={`bk-btn h-11 w-full text-sm
                  ${loggedIn ? "bg-[#3e3e3e] hover:bg-[#4a4a4a]" : "bg-[#3e3e3e] hover:bg-[#4a4a4a]"}`}>
                  {loggedIn ? "My Profile" : "Login / Signup"}
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
        </>
      )}

      <main className={isAuthPage ? "flex-1" : "min-h-[75svh] flex-1 pt-[108px] md:pt-[118px] bg-[#ffffff]"}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col h-full w-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {!isAuthPage && (
      <footer className="min-h-[520px] shrink-0 border-t border-[#e8e8e8] bg-white sm:min-h-[340px] lg:min-h-[300px]">
        <div className="bk-shell py-7">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_2fr_1fr]">
            <div>
              <Link to="/" className="mb-4 flex items-center gap-2 text-2xl font-black text-[#e63946]">
                ChocoRiches
              </Link>
              <p className="max-w-sm text-sm leading-6 text-[#6f7573]">
                From custom celebration cakes to delightful bento treats, every creation is made fresh with premium ingredients and designed to make your moments unforgettable.
              </p>
              <div className="mt-5 flex gap-3">
                {[
                  { Icon: Instagram, href: "https://www.instagram.com/choco_riches_cake?igsh=MTdrbDMxNjU5cWZyOQ%3D%3D&utm_source=qr" },
                  
                ].map(({ Icon, href }) =>
                  href ? (
                    <a key={Icon.displayName || Icon.name} href={href} target="_blank" rel="noopener noreferrer" className="grid h-10 w-10 place-items-center rounded-full bg-[#fff2e9] text-[#e63946] transition-colors hover:bg-[#e63946] hover:text-white">
                      <Icon size={18} />
                    </a>
                  ) : (
                    <span key={Icon.displayName || Icon.name} className="grid h-10 w-10 place-items-center rounded-full bg-[#fff2e9] text-[#e63946]">
                      <Icon size={18} />
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              {footerLinks.map(([heading, ...links]) => (
                <div key={heading}>
                  <p className="mb-2 text-sm font-black text-[#1f2221]">{heading}</p>
                  <ul className="space-y-2 text-sm text-[#6f7573]">
                    {links.map((link) => {
                      let url = "/";
                      if (link === "Track Order") url = "/track";
                      else if (link === "About Us") url = "/about";
                      else if (link === "Contact Us" || link === "Corporate Orders") url = "/contact";
                      else if (link === "Return Policy") url = "/return-policy";
                      else if (link === "FAQs") url = "/faq";
                      else if (link === "Terms & Conditions") url = "/terms";
                      else if (link.includes("Cake") || link.includes("Order")) url = "/shop";

                      return (
                        <li key={link}>
                          <Link to={url} className="hover:text-[#e63946]">
                            {link}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            {/* <div>
              <h4 className="mb-4 text-sm font-black text-[#1f2221]">Fresh Offers</h4>
              <div className="rounded-xl bg-[#fff2e9] p-4">
                <p className="text-sm leading-6 text-[#6f7573]">Get launch offers and same-day delivery updates.</p>
                <div className="mt-4 flex gap-2">
                  <input type="email" aria-label="Email" placeholder="Email" className="bk-input h-10 px-3 text-sm" />
                  <button type="button" className="bk-btn h-10 px-4 text-sm">Join</button>
                </div>
              </div>
            </div> */}
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-[#ebebeb] pt-5 text-xs font-bold text-[#7f8583] md:flex-row md:items-center md:justify-between">
            {/* <p>Copyright 2026 ChocoRiches. All rights reserved.</p> */}
            <div className="flex gap-5">
              <Link to="/return-policy">Return Policy</Link>
              <Link to="/terms">Terms & Conditions</Link>
            </div>
          </div>
        </div>
      </footer>
      )}
      <ScrollRestoration />
    </div>
  );
}

export {
  RootLayout as default
};
