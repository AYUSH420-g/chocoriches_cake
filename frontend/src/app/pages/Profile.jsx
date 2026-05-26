import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { CreditCard, Gift, Heart, LogOut, MapPin, Package, Settings, ShoppingCart, Star, Wallet } from "lucide-react";
import { toast } from "sonner";
import { getOrders, getProducts, getProfile } from "../api/client";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/format";
import { clearUserSession, getStoredUser, isUserLoggedIn, saveUserSession } from "../utils/session";
import { wishlistIds } from "../utils/wishlist";

function Profile() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(() => getStoredUser());
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("orders");
  const { addProduct } = useCart();

  useEffect(() => {
    if (!isUserLoggedIn()) {
      navigate("/auth");
      return undefined;
    }

    let mounted = true;
    Promise.all([getProfile(), getOrders(), getProducts().catch(() => [])])
      .then(([profileData, orderData, products]) => {
        if (mounted) {
          setProfile(profileData);
          saveUserSession({ user: profileData });
          setOrders(orderData);
          setCatalog(products);
        }
      })
      .catch(() => {
        clearUserSession();
        navigate("/auth");
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const logout = () => {
    clearUserSession();
    navigate("/auth");
  };

  const handleOrderAgain = async (order) => {
    const products = catalog.length ? catalog : await getProducts().catch(() => []);
    const orderedNames = Array.isArray(order.items) ? order.items : [];
    const matchedProducts = orderedNames
      .map((name) => products.find((product) => String(product.name || "").toLowerCase() === String(name || "").toLowerCase()))
      .filter(Boolean);

    if (!matchedProducts.length) {
      toast.error("Those products are no longer available");
      return;
    }

    try {
      await Promise.all(matchedProducts.map((product) => addProduct(product, 1, product.defaultWeight || product.weightOptions?.[0]?.label || "Half Kg")));
      toast.success("Added previous order to cart");
      navigate("/cart");
    } catch (error) {
      toast.error(error.message || "Could not add order to cart");
    }
  };

  const rewardPoints = orders.length * 50;
  const savedPincodeCount = new Set(orders.map((order) => order.deliveryPincode).filter(Boolean)).size;
  const savedPincodes = [...new Set(orders.map((order) => order.deliveryPincode).filter(Boolean))];
  const favouriteProducts = catalog.filter((product) => wishlistIds().includes(String(product.id)));
  const activeOrder = orders.find((order) => !["Delivered", "Cancelled"].includes(order.status));
  const pointsToNextTier = Math.max(0, 1000 - rewardPoints);

  if (!profile) {
    return (
      <div className="bk-page">
        <div className="bk-shell grid min-h-[420px] place-items-center py-6">
          <p className="text-sm font-black text-[#e61951]">{loading ? "Loading your profile..." : "Login to view your profile"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bk-page">
      <div className="bk-shell py-6">
        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          <aside className="space-y-5">
            <div className="bk-card p-5 text-center">
              <span className="mx-auto grid h-24 w-24 place-items-center rounded-full border-4 border-[#fff2e9] bg-[#e61951] text-4xl font-black uppercase text-white">
                {(profile.name || profile.email || "U").slice(0, 1)}
              </span>
              <h1 className="mt-4 text-2xl font-black text-[#1f2221]">{profile.name}</h1>
              <p className="mt-1 break-words text-sm font-bold text-[#6f7573]">{profile.email}</p>
              <span className="mt-4 inline-flex rounded-full bg-[#fff2e9] px-3 py-1 text-xs font-black text-[#e61951]">{profile.membership}</span>
            </div>

            <nav className="bk-card p-2">
              <ProfileNavItem icon={Package} label="My Orders" active={activeSection === "orders"} onClick={() => setActiveSection("orders")} />
              <ProfileNavItem icon={Heart} label="My Favourites" active={activeSection === "favourites"} onClick={() => setActiveSection("favourites")} />
              <ProfileNavItem icon={Gift} label="My Occasions" active={activeSection === "occasions"} onClick={() => setActiveSection("occasions")} />
              <ProfileNavItem icon={MapPin} label="Manage Address" active={activeSection === "address"} onClick={() => setActiveSection("address")} />
              <ProfileNavItem icon={Wallet} label="My Wallet" active={activeSection === "wallet"} onClick={() => setActiveSection("wallet")} />
              <ProfileNavItem icon={CreditCard} label="Payment Methods" active={activeSection === "payments"} onClick={() => setActiveSection("payments")} />
              <ProfileNavItem icon={Settings} label="Account Settings" active={activeSection === "settings"} onClick={() => setActiveSection("settings")} />
              <button type="button" onClick={logout} className="mt-2 flex h-11 w-full items-center gap-3 rounded-lg px-4 text-sm font-black text-[#e61951] hover:bg-[#fff2e9]">
                <LogOut size={18} />
                Logout
              </button>
            </nav>
          </aside>

          <main className="space-y-5">
            <section className="grid gap-4 md:grid-cols-3">
              {[
                ["Total Orders", orders.length],
                ["Reward Points", rewardPoints],
                ["Saved Addresses", savedPincodeCount]
              ].map(([label, value]) => (
                <div key={label} className="bk-card p-5">
                  <p className="text-sm font-bold text-[#6f7573]">{label}</p>
                  <p className="mt-2 text-3xl font-black text-[#1f2221]">{value}</p>
                </div>
              ))}
            </section>

            {activeSection === "orders" && <section className="bk-card overflow-hidden">
              <div className="border-b border-[#ebebeb] bg-white p-5">
                <h2 className="text-2xl font-black text-[#1f2221]">Recent Orders</h2>
                <p className="mt-1 text-sm text-[#6f7573]">Track current orders and repeat previous favourites.</p>
              </div>
              <div className="divide-y divide-[#ebebeb]">
                {orders.length ? (
                  orders.map((order) => (
                    <motion.article
                      key={order.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center"
                    >
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-black text-[#6f7573]">Order {order.orderId || order.id}</span>
                          <span className={`rounded-full px-3 py-1 text-[11px] font-black ${order.status === "Delivered" ? "bg-[#e8f8ef] text-[#0f8b57]" : "bg-[#fff2e9] text-[#e61951]"}`}>
                            {order.status}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-[#1f2221]">{order.items?.join(", ") || "Cake order"}</h3>
                        <p className="mt-1 text-sm font-bold text-[#6f7573]">{order.date}</p>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3 md:flex-col md:items-end">
                        <p className="text-xl font-black text-[#e61951]">{formatPrice(order.total)}</p>
                        <div className="flex flex-wrap justify-end gap-2">
                          <button type="button" onClick={() => handleOrderAgain(order)} className="bk-btn h-10 px-4 text-sm">
                            <ShoppingCart size={16} />
                            Order Again
                          </button>
                          <Link to={`/track?orderId=${encodeURIComponent(order.orderId || order.id)}`} className="bk-outline-btn h-10 px-4 text-sm">Track Details</Link>
                        </div>
                      </div>
                    </motion.article>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Package className="mx-auto text-[#e61951]" size={40} />
                    <h3 className="mt-4 text-xl font-black text-[#1f2221]">No orders yet</h3>
                    <p className="mt-2 text-sm text-[#6f7573]">Your cake orders will appear here after checkout.</p>
                    <Link to="/shop" className="bk-btn mt-5 h-11 px-5 text-sm">Shop Cakes</Link>
                  </div>
                )}
              </div>
            </section>}

            {activeSection === "favourites" && (
              <section className="bk-card p-5">
                <h2 className="text-2xl font-black text-[#1f2221]">My Favourites</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {favouriteProducts.length ? favouriteProducts.map((product) => (
                    <Link key={product.id} to={`/product/${product.id}`} className="flex gap-3 rounded-lg border border-[#ebebeb] p-3 hover:border-[#e61951]">
                      <img src={product.image} alt={product.name} className="h-16 w-16 rounded-lg object-cover" />
                      <div>
                        <h3 className="text-sm font-black text-[#1f2221]">{product.name}</h3>
                        <p className="mt-1 text-sm font-bold text-[#e61951]">{formatPrice(product.price)}</p>
                      </div>
                    </Link>
                  )) : <p className="rounded-lg bg-[#f7f7f7] p-4 text-sm font-bold text-[#6f7573]">Liked cakes will appear here.</p>}
                </div>
              </section>
            )}

            {activeSection === "occasions" && (
              <section className="bk-card p-5">
                <h2 className="text-2xl font-black text-[#1f2221]">My Occasions</h2>
                <div className="mt-4 grid gap-3">
                  {orders.length ? orders.map((order) => (
                    <div key={order.id} className="rounded-lg border border-[#ebebeb] p-4">
                      <p className="text-sm font-black text-[#1f2221]">{order.items?.join(", ") || "Cake order"}</p>
                      <p className="mt-1 text-sm font-bold text-[#6f7573]">{order.deliveryDate || order.date}</p>
                    </div>
                  )) : <p className="rounded-lg bg-[#f7f7f7] p-4 text-sm font-bold text-[#6f7573]">No saved occasions yet.</p>}
                </div>
              </section>
            )}

            {activeSection === "address" && (
              <section className="bk-card p-5">
                <h2 className="text-2xl font-black text-[#1f2221]">Manage Address</h2>
                <div className="mt-4 grid gap-3">
                  {savedPincodes.length ? savedPincodes.map((pincode) => (
                    <div key={pincode} className="flex items-center gap-3 rounded-lg border border-[#ebebeb] p-4">
                      <MapPin size={18} className="text-[#e61951]" />
                      <span className="text-sm font-black text-[#1f2221]">Pincode {pincode}</span>
                    </div>
                  )) : <p className="rounded-lg bg-[#f7f7f7] p-4 text-sm font-bold text-[#6f7573]">Checkout addresses will appear here.</p>}
                </div>
              </section>
            )}

            {activeSection === "wallet" && <section className="grid gap-5 lg:grid-cols-2">
              <div className="bk-card overflow-hidden bg-[#1f2221] p-6 text-white">
                <Star className="mb-5 text-[#ffcf4d]" size={36} fill="currentColor" />
                <h2 className="text-2xl font-black">Sweet Rewards</h2>
                <p className="mt-2 text-sm leading-6 text-white/75">You have earned {rewardPoints} points from completed account activity.</p>
                <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-[#e61951]" style={{ width: `${Math.min(100, rewardPoints / 10)}%` }} />
                </div>
                <p className="mt-3 text-xs font-bold text-white/70">{pointsToNextTier} points to next tier</p>
              </div>

              <div className="bk-card p-6">
                <h2 className="text-2xl font-black text-[#1f2221]">Upcoming Delivery</h2>
                <p className="mt-2 text-sm leading-6 text-[#6f7573]">
                  {activeOrder
                    ? `${activeOrder.orderId || activeOrder.id} is ${activeOrder.status} for ${activeOrder.deliveryDate || "your selected date"}.`
                    : "No active delivery right now. New checkout orders will appear here automatically."}
                </p>
                {activeOrder ? (
                  <Link to={`/track?orderId=${encodeURIComponent(activeOrder.orderId || activeOrder.id)}`} className="bk-btn mt-6 h-11 px-5 text-sm">Track Active Order</Link>
                ) : (
                  <Link to="/shop" className="bk-btn mt-6 h-11 px-5 text-sm">Shop Cakes</Link>
                )}
              </div>
            </section>}

            {activeSection === "payments" && (
              <section className="bk-card p-5">
                <h2 className="text-2xl font-black text-[#1f2221]">Payment Methods</h2>
                <p className="mt-2 text-sm font-bold text-[#6f7573]">Saved Razorpay cards and UPI handles will appear after checkout.</p>
              </section>
            )}

            {activeSection === "settings" && (
              <section className="bk-card p-5">
                <h2 className="text-2xl font-black text-[#1f2221]">Account Settings</h2>
                <div className="mt-4 grid gap-3">
                  <p className="rounded-lg bg-[#f7f7f7] p-4 text-sm font-bold text-[#1f2221]">Name: {profile.name}</p>
                  <p className="rounded-lg bg-[#f7f7f7] p-4 text-sm font-bold text-[#1f2221]">Email: {profile.email}</p>
                  <p className="rounded-lg bg-[#f7f7f7] p-4 text-sm font-bold text-[#1f2221]">Phone: {profile.phone || "Not added"}</p>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function ProfileNavItem({ icon: Icon, label, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-11 w-full items-center gap-3 rounded-lg px-4 text-sm font-black transition ${
        active ? "bg-[#e61951] text-white" : "text-[#5f6663] hover:bg-[#fff2e9] hover:text-[#e61951]"
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

export {
  Profile as default
};
