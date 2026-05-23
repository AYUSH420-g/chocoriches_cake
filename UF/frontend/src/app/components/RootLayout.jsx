import { Outlet, Link, useLocation } from "react-router";
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
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Toaster } from "sonner";
import { getCart, getPublicSettings } from "../api/client";
import { getStoredUser, isUserLoggedIn, SESSION_EVENT } from "../utils/session";

const categoryLinks = [
  { label: "Cakes", to: "/shop" },
  { label: "Designer Cakes", to: "/shop?cat=Celebration" },
  { label: "Birthday", to: "/shop?cat=Celebration" },
  { label: "Anniversary", to: "/shop?cat=Wedding" },
  { label: "Chocolate", to: "/shop?cat=Signature" },
  { label: "Custom Cakes", to: "/custom" },
  { label: "Same Day Delivery", to: "/shop" }
];

const footerLinks = [
  ["Our Company", "About Us", "Careers", "Contact Us", "Corporate Orders"],
  ["Quick Links", "Cakes", "Designer Cakes", "Custom Cakes", "Track Order"],
  ["Help", "Shipping Policy", "Return Policy", "FAQs", "Terms & Conditions"]
];

function RootLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(() => getStoredUser());
  const [loggedIn, setLoggedIn] = useState(() => isUserLoggedIn());
  const [settings, setSettings] = useState({ maintenanceMode: false, maintenanceMessage: "" });
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    window.scrollTo(0, 0);
    setUser(getStoredUser());
    setLoggedIn(isUserLoggedIn());
  }, [location.pathname, location.search]);

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
    const loadSettings = () => getPublicSettings()
      .then((nextSettings) => {
        if (mounted) {
          setSettings(nextSettings);
        }
      })
      .catch(() => void 0);

    loadSettings();
    const intervalId = window.setInterval(loadSettings, 3000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    getCart()
      .then((items) => {
        if (mounted) {
          setCartCount(items.reduce((count, item) => count + Number(item.quantity || 0), 0));
        }
      })
      .catch(() => void 0);

    return () => {
      mounted = false;
    };
  }, [location.pathname, location.search]);

  if (settings.maintenanceMode) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7f7f7] px-6 text-center text-[#1f2221]">
        <div className="max-w-lg rounded-xl border border-[#ebebeb] bg-white p-8 shadow-xl shadow-black/5">
          <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-[#fff2e9] text-[#e61951]">
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
    <div className="min-h-screen bg-[#f7f7f7] text-[#1f2221]">
      <Toaster position="top-center" richColors />

      <header className={`fixed inset-x-0 top-0 z-50 bg-white transition-shadow ${scrolled ? "shadow-md shadow-black/5" : "shadow-sm shadow-black/5"}`}>
        <div className="bk-shell">
          <div className="flex h-[72px] items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              title="Menu"
              onClick={() => setIsMenuOpen(true)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#ebebeb] text-[#1f2221] lg:hidden"
            >
              <Menu size={21} />
            </button>

            <Link to="/" className="flex shrink-0 items-center gap-2 pr-2" aria-label="ChocoRiches home">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#fff2e9] text-[#e61951]">
                <CakeSlice size={22} />
              </span>
              <span className="leading-none">
                <span className="block text-[22px] font-black tracking-tight text-[#e61951]">ChocoRiches</span>
                <span className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-[#6f7573] sm:block">Fresh Cakes Online</span>
              </span>
            </Link>

            <button
              type="button"
              className="hidden min-w-[172px] items-center justify-between rounded-lg border border-[#ebebeb] px-3 py-2 text-left lg:flex"
              title="Deliver to"
            >
              <span className="flex min-w-0 items-center gap-2">
                <MapPin size={18} className="shrink-0 text-[#e61951]" />
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase text-[#6f7573]">Deliver To</span>
                  <span className="block truncate text-sm font-black text-[#1f2221]">Bangalore</span>
                </span>
              </span>
              <ChevronDown size={16} className="text-[#6f7573]" />
            </button>

            <div className="relative hidden flex-1 md:block">
              <Search size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7f8583]" />
              <input
                type="search"
                aria-label="Search cakes"
                placeholder="Search for cakes, flavours, occasions..."
                className="h-11 w-full rounded-lg border border-[#ebebeb] bg-[#f7f7f7] pl-12 pr-4 text-sm outline-none transition focus:border-[#e61951] focus:bg-white focus:ring-4 focus:ring-[#e61951]/10"
              />
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
              <Link
                to="/track"
                title="Track order"
                className="hidden h-11 items-center gap-2 rounded-lg px-3 text-xs font-black text-[#1f2221] transition hover:bg-[#fff2e9] lg:flex"
              >
                <Truck size={19} className="text-[#e61951]" />
                Track Order
              </Link>
              <Link
                to={loggedIn ? "/profile" : "/auth"}
                title={loggedIn ? "My profile" : "Login or signup"}
                aria-label={loggedIn ? "My profile" : "Login or signup"}
                className="grid h-11 w-11 place-items-center rounded-lg text-[#1f2221] transition hover:bg-[#fff2e9] hover:text-[#e61951]"
              >
                {user?.name ? (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#fff2e9] text-xs font-black text-[#e61951]">
                    {user.name.slice(0, 1).toUpperCase()}
                  </span>
                ) : (
                  <User size={20} />
                )}
              </Link>
              <Link
                to="/cart"
                title="Cart"
                aria-label="Cart"
                className="relative grid h-11 w-11 place-items-center rounded-lg text-[#1f2221] transition hover:bg-[#fff2e9] hover:text-[#e61951]"
              >
                <ShoppingCart size={21} />
                <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#e61951] px-1 text-[10px] font-black leading-none text-white">{cartCount}</span>
              </Link>
            </div>
          </div>

          <div className="flex h-[46px] min-w-0 items-center gap-3 border-t border-[#f1f1f1]">
            <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
              {categoryLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-black text-[#323635] transition hover:bg-[#fff2e9] hover:text-[#e61951]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <Link
              to="/custom"
              className="hidden shrink-0 items-center gap-2 rounded-lg bg-[#fff2e9] px-3 py-2 text-sm font-black text-[#e61951] md:flex"
            >
              <Gift size={17} />
              Order Custom
            </Link>
          </div>
        </div>
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
              className="fixed inset-y-0 left-0 z-[70] w-[86vw] max-w-sm bg-white shadow-2xl"
            >
              <div className="flex h-16 items-center justify-between border-b border-[#ebebeb] px-5">
                <Link to="/" className="flex items-center gap-2 text-xl font-black text-[#e61951]">
                  <CakeSlice size={22} />
                  ChocoRiches
                </Link>
                <button type="button" aria-label="Close menu" title="Close" onClick={() => setIsMenuOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-[#f7f7f7]">
                  <X size={20} />
                </button>
              </div>
              <div className="border-b border-[#ebebeb] bg-[#fff2e9] p-5">
                <button type="button" className="flex w-full items-center justify-between rounded-lg bg-white px-4 py-3 text-left">
                  <span className="flex items-center gap-3">
                    <MapPin className="text-[#e61951]" size={19} />
                    <span>
                      <span className="block text-[10px] font-black uppercase text-[#6f7573]">Delivering to</span>
                      <span className="text-sm font-black">Bangalore</span>
                    </span>
                  </span>
                  <ChevronDown size={16} />
                </button>
              </div>
              <nav className="flex flex-col p-3">
                {categoryLinks.map((item) => (
                  <Link key={item.label} to={item.to} className="rounded-lg px-4 py-3 text-base font-black text-[#1f2221] hover:bg-[#fff2e9] hover:text-[#e61951]">
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="absolute inset-x-0 bottom-0 border-t border-[#ebebeb] p-5">
                <Link to={loggedIn ? "/profile" : "/auth"} className="bk-btn h-11 w-full text-sm">
                  {loggedIn ? "My Profile" : "Login / Signup"}
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="pt-[118px]">
        <Outlet />
      </main>

      <footer className="border-t border-[#e8e8e8] bg-white">
        <div className="bk-shell py-10">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_2fr_1fr]">
            <div>
              <Link to="/" className="mb-4 flex items-center gap-2 text-2xl font-black text-[#e61951]">
                <CakeSlice size={26} />
                ChocoRiches
              </Link>
              <p className="max-w-sm text-sm leading-6 text-[#6f7573]">
                Fresh cakes, bento treats, designer celebrations, and custom orders delivered with the same crisp marketplace experience.
              </p>
              <div className="mt-5 flex gap-3">
                {[Instagram, Facebook, Headphones].map((Icon) => (
                  <span key={Icon.displayName || Icon.name} className="grid h-10 w-10 place-items-center rounded-full bg-[#fff2e9] text-[#e61951]">
                    <Icon size={18} />
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              {footerLinks.map(([heading, ...links]) => (
                <div key={heading}>
                  <h4 className="mb-4 text-sm font-black text-[#1f2221]">{heading}</h4>
                  <ul className="space-y-3 text-sm text-[#6f7573]">
                    {links.map((link) => (
                      <li key={link}>
                        <Link to={link === "Track Order" ? "/track" : link.includes("Cake") || link.includes("Order") ? "/shop" : "/"} className="hover:text-[#e61951]">
                          {link}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div>
              <h4 className="mb-4 text-sm font-black text-[#1f2221]">Fresh Offers</h4>
              <div className="rounded-xl bg-[#fff2e9] p-4">
                <p className="text-sm leading-6 text-[#6f7573]">Get launch offers and same-day delivery updates.</p>
                <div className="mt-4 flex gap-2">
                  <input type="email" aria-label="Email" placeholder="Email" className="bk-input h-10 px-3 text-sm" />
                  <button type="button" className="bk-btn h-10 px-4 text-sm">Join</button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-[#ebebeb] pt-5 text-xs font-bold text-[#7f8583] md:flex-row md:items-center md:justify-between">
            <p>Copyright 2026 ChocoRiches. All rights reserved.</p>
            <div className="flex gap-5">
              <Link to="/">Privacy Policy</Link>
              <Link to="/">Terms of Use</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export {
  RootLayout as default
};
