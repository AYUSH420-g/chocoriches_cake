import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { CreditCard, Gift, Heart, LogOut, MapPin, Package, Settings, Star, Wallet } from "lucide-react";
import { getOrders, getProfile } from "../api/client";
import { formatPrice } from "../utils/format";
import { clearUserSession, getStoredUser, isUserLoggedIn, saveUserSession } from "../utils/session";

function Profile() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isUserLoggedIn()) {
      navigate("/auth");
      return undefined;
    }

    let mounted = true;
    Promise.all([getProfile(), getOrders()])
      .then(([profileData, orderData]) => {
        if (mounted) {
          setProfile(profileData);
          saveUserSession({ user: profileData });
          setOrders(orderData);
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

  const rewardPoints = orders.length * 50;
  const savedPincodeCount = new Set(orders.map((order) => order.deliveryPincode).filter(Boolean)).size;
  const activeOrder = orders.find((order) => !["Delivered", "Cancelled"].includes(order.status));
  const pointsToNextTier = Math.max(0, 1000 - rewardPoints);

  if (loading && !profile) {
    return (
      <div className="bk-page">
        <div className="bk-shell grid min-h-[420px] place-items-center py-6">
          <p className="text-sm font-black text-[#e61951]">Loading your profile...</p>
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
              <img src={profile.avatar} alt={profile.name} className="mx-auto h-24 w-24 rounded-full border-4 border-[#fff2e9] object-cover" />
              <h1 className="mt-4 text-2xl font-black text-[#1f2221]">{profile.name}</h1>
              <p className="mt-1 text-sm font-bold text-[#6f7573]">{profile.email}</p>
              <span className="mt-4 inline-flex rounded-full bg-[#fff2e9] px-3 py-1 text-xs font-black text-[#e61951]">{profile.membership}</span>
            </div>

            <nav className="bk-card p-2">
              <ProfileNavItem icon={Package} label="My Orders" active />
              <ProfileNavItem icon={Heart} label="My Favourites" />
              <ProfileNavItem icon={Gift} label="My Occasions" />
              <ProfileNavItem icon={MapPin} label="Manage Address" />
              <ProfileNavItem icon={Wallet} label="My Wallet" />
              <ProfileNavItem icon={CreditCard} label="Payment Methods" />
              <ProfileNavItem icon={Settings} label="Account Settings" />
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

            <section className="bk-card overflow-hidden">
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
                      <div className="flex items-center justify-between gap-4 md:flex-col md:items-end">
                        <p className="text-xl font-black text-[#e61951]">{formatPrice(order.total)}</p>
                        <Link to={`/track?orderId=${encodeURIComponent(order.orderId || order.id)}`} className="bk-outline-btn h-10 px-4 text-sm">Track Details</Link>
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
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
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
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

function ProfileNavItem({ icon: Icon, label, active = false }) {
  return (
    <button
      type="button"
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
