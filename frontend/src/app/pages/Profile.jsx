import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, ChevronRight, CreditCard, Gift, Heart, LogOut, MapPin, Package, Settings, ShoppingCart, Star, Wallet, FileText } from "lucide-react";
import { toast } from "sonner";
import { getOrders, getProducts, getProfile, addAddress, deleteAddress, updateProfile, getUserReviews, addReview } from "../api/client";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/format";
import { clearUserSession, getStoredUser, isUserLoggedIn, saveUserSession } from "../utils/session";
import { wishlistIds } from "../utils/wishlist";
import FullScreenLoader from "../components/FullScreenLoader";

function normalizePincode(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 6);
}

function Profile() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(() => getStoredUser());
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("main");
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [userReviews, setUserReviews] = useState([]);
  const [reviewModal, setReviewModal] = useState({ open: false, product: null, rating: 5, comment: "", submitting: false });
  const { addProduct } = useCart();

  useEffect(() => {
    if (!isUserLoggedIn()) {
      navigate("/auth");
      return undefined;
    }

    let mounted = true;
    Promise.all([getProfile(), getOrders().catch(() => []), getProducts().catch(() => []), getUserReviews().catch(() => [])])
      .then(([profileData, orderData, products, reviewsData]) => {
        if (mounted) {
          setProfile(profileData);
          saveUserSession({ user: profileData });
          setOrders(orderData);
          setCatalog(products);
          setUserReviews(reviewsData || []);
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

  const handleAddAddress = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    payload.pincode = normalizePincode(payload.pincode);
    if (payload.pincode.length !== 6) {
      toast.error("Please enter a valid 6-digit pincode");
      return;
    }
    try {
      const updatedUser = await addAddress(payload);
      setProfile(updatedUser);
      saveUserSession({ user: updatedUser });
      setShowAddAddress(false);
      e.target.reset();
      toast.success("Address saved successfully");
    } catch (error) {
      toast.error(error.message || "Failed to save address");
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      const updatedUser = await deleteAddress(id);
      setProfile(updatedUser);
      saveUserSession({ user: updatedUser });
      toast.success("Address removed");
    } catch (error) {
      toast.error(error.message || "Failed to remove address");
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name")?.toString().trim();
    const phone = formData.get("phone")?.toString().trim();

    try {
      const updatedUser = await updateProfile({ name, phone });
      setProfile(updatedUser);
      saveUserSession({ user: updatedUser });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewModal.product) return;
    try {
      setReviewModal((p) => ({ ...p, submitting: true }));
      await addReview({ productId: reviewModal.product.id, rating: reviewModal.rating, comment: reviewModal.comment });
      const newReview = { productId: reviewModal.product.id, rating: reviewModal.rating, comment: reviewModal.comment, createdAt: new Date().toISOString(), userName: profile.name };
      setUserReviews((p) => [newReview, ...p]);
      setReviewModal({ open: false, product: null, rating: 5, comment: "", submitting: false });
      toast.success("Review submitted successfully");
    } catch (error) {
      toast.error(error.message || "Failed to submit review");
      setReviewModal((p) => ({ ...p, submitting: false }));
    }
  };

  const handleDownloadInvoice = (order) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup blocker prevented opening the invoice. Please allow popups for this site.");
      return;
    }

    const price = formatPrice(order.total);
    const date = order.date || new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
    
    const itemsHtml = (order.items || ["Cake order"])
      .map(
        (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #ebebeb; font-size: 14px; color: #1f2221; font-weight: 600;">${item}</td>
        <td style="padding: 12px; border-bottom: 1px solid #ebebeb; font-size: 14px; color: #1f2221; text-align: center;">1</td>
        <td style="padding: 12px; border-bottom: 1px solid #ebebeb; font-size: 14px; color: #1f2221; text-align: right; font-weight: 600;">${price}</td>
      </tr>
    `
      )
      .join("");

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${order.orderId || order.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 40px;
            color: #1f2221;
            background-color: #ffffff;
            -webkit-print-color-adjust: exact;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #e61951;
            padding-bottom: 24px;
            margin-bottom: 40px;
          }
          .logo-container {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .logo-circle {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background-color: #e61951;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .logo-svg {
            color: #ffffff;
            width: 24px;
            height: 24px;
          }
          .brand-name {
            font-size: 26px;
            font-weight: 900;
            color: #1f2221;
            letter-spacing: -0.5px;
          }
          .invoice-title {
            text-align: right;
          }
          .invoice-title h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 900;
            color: #e61951;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .invoice-title p {
            margin: 4px 0 0 0;
            font-size: 14px;
            color: #6f7573;
            font-weight: 600;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
          }
          .details-block h3 {
            margin: 0 0 8px 0;
            font-size: 14px;
            text-transform: uppercase;
            color: #6f7573;
            font-weight: 800;
            letter-spacing: 0.5px;
          }
          .details-block p {
            margin: 4px 0;
            font-size: 14px;
            line-height: 1.5;
            color: #1f2221;
          }
          .details-block .highlight {
            font-weight: 800;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }
          .items-table th {
            background-color: #fff2e9;
            color: #e61951;
            padding: 12px;
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: left;
          }
          .items-table th.center {
            text-align: center;
          }
          .items-table th.right {
            text-align: right;
          }
          .totals {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 60px;
          }
          .totals-table {
            width: 250px;
            border-collapse: collapse;
          }
          .totals-table td {
            padding: 8px 12px;
            font-size: 14px;
          }
          .totals-table tr.total-row td {
            border-top: 2px solid #e61951;
            font-size: 18px;
            font-weight: 900;
            color: #e61951;
            padding-top: 12px;
          }
          .footer {
            border-top: 1px solid #ebebeb;
            padding-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #6f7573;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div class="logo-container">
              <div class="logo-circle">
                <svg class="logo-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2v4M12 2a3 3 0 0 0-3 3v1h6V5a3 3 0 0 0-3-3z"/>
                  <path d="M4 11.5a2.5 2.5 0 0 0 2.5 2.5h11a2.5 2.5 0 0 0 2.5-2.5V8H4z"/>
                  <path d="M4 14v4a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-4"/>
                </svg>
              </div>
              <span class="brand-name">Chocoriches</span>
            </div>
            <div class="invoice-title">
              <h1>Invoice</h1>
              <p>ID: ${order.orderId || order.id}</p>
            </div>
          </div>

          <div class="details-grid">
            <div class="details-block">
              <h3>Billed To:</h3>
              <p class="highlight">${profile.name}</p>
              <p>${profile.email}</p>
              ${profile.phone ? `<p>${profile.phone}</p>` : ""}
            </div>
            <div class="details-block" style="text-align: right;">
              <h3>Invoice Details:</h3>
              <p><span style="color: #6f7573; font-weight: 600;">Date:</span> ${date}</p>
              <p><span style="color: #6f7573; font-weight: 600;">Pincode:</span> ${order.deliveryPincode || "N/A"}</p>
              <p><span style="color: #6f7573; font-weight: 600;">Status:</span> <span style="color: #e61951; font-weight: 800;">${order.status}</span></p>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th class="center" style="width: 100px;">Qty</th>
                <th class="right" style="width: 150px;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <table class="totals-table">
              <tr>
                <td style="color: #6f7573; font-weight: 600;">Subtotal</td>
                <td style="text-align: right; font-weight: 600; color: #1f2221;">${price}</td>
              </tr>
              <tr>
                <td style="color: #6f7573; font-weight: 600;">Delivery Fee</td>
                <td style="text-align: right; font-weight: 600; color: #1f2221;">₹ 0</td>
              </tr>
              <tr class="total-row">
                <td>Total</td>
                <td style="text-align: right;">${price}</td>
              </tr>
            </table>
          </div>

          <div class="footer">
            <p>Thank you for celebrating with Chocoriches!</p>
            <p style="margin-top: 4px; font-size: 10px; color: #b8bebc;">This is a system generated document. No signature required.</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
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
        <FullScreenLoader visible={loading} />
        <div className="bk-shell grid min-h-[420px] place-items-center py-6">
          <p className="text-sm font-black text-[#e61951]">{loading ? "Loading your profile..." : "Login to view your profile"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bk-page bg-[#f7f7f7]">
      <div className="bk-shell py-4 md:py-8">
        <div className="mx-auto max-w-2xl">
          {activeSection === "main" ? (
            <div className="space-y-4">
              <div className="bk-card flex items-center gap-5 p-5 md:p-6 shadow-sm">
                <span className="grid h-16 w-16 place-items-center rounded-full border-4 border-[#fff2e9] bg-[#e61951] text-2xl font-black uppercase text-white md:h-20 md:w-20 md:text-3xl shrink-0">
                  {(profile.name || profile.email || "U").slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <h1 className="truncate text-xl font-black text-[#1f2221] md:text-2xl">{profile.name}</h1>
                  <p className="mt-1 truncate text-sm font-bold text-[#6f7573]">{profile.phone || profile.email}</p>
                </div>
              </div>

              <div className="bk-card overflow-hidden shadow-sm">
                <ProfileNavItem icon={Package} label="My Orders" onClick={() => setActiveSection("orders")} />
                <ProfileNavItem icon={Heart} label="My Favourites" onClick={() => setActiveSection("favourites")} />
                <ProfileNavItem icon={MapPin} label="Saved Addresses" onClick={() => setActiveSection("address")} />
                <ProfileNavItem icon={Star} label="My Reviews" onClick={() => setActiveSection("reviews")} />
                <ProfileNavItem icon={Settings} label="Account Settings" onClick={() => setActiveSection("settings")} />
              </div>

              <button type="button" onClick={logout} className="bk-card flex h-[60px] w-full items-center justify-center gap-2 text-sm font-black text-[#e61951] shadow-sm hover:bg-[#fff2e9] transition">
                <LogOut size={18} />
                Logout
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-4 px-1">
                <button
                  type="button"
                  onClick={() => setActiveSection("main")}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white border border-[#ebebeb] text-[#1f2221] shadow-sm hover:bg-[#fafafa] transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
                <h1 className="text-xl font-black text-[#1f2221] capitalize">
                  {activeSection === "address" ? "Saved Addresses" : 
                   activeSection === "favourites" ? "My Favourites" :
                   activeSection === "settings" ? "Account Settings" :
                   `My ${activeSection}`}
                </h1>
              </div>
              
              <main>

            {activeSection === "orders" && <section className="bk-card overflow-hidden shadow-sm">
              <div className="divide-y divide-[#ebebeb]">
                {orders.length ? (
                  orders.map((order) => (
                    <motion.article
                      key={order.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center hover:bg-[#fafafa] transition"
                    >
                      <div>
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-black text-[#6f7573]">Order {order.orderId || order.id}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${order.status === "Delivered" ? "bg-[#e8f8ef] text-[#0f8b57]" : "bg-[#fff2e9] text-[#e61951]"}`}>
                            {order.status}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-[#1f2221]">{order.items?.join(", ") || "Cake order"}</h3>
                        <p className="mt-0.5 text-xs font-bold text-[#6f7573]">{order.date}</p>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3 md:flex-col md:items-end">
                        <p className="text-lg font-black text-black">{formatPrice(order.total)}</p>
                        <div className="flex flex-wrap justify-end gap-2">
                          <button type="button" onClick={() => handleOrderAgain(order)} className="bk-btn h-9 px-3 text-xs">
                            <ShoppingCart size={14} />
                            Order Again
                          </button>
                          <Link to={`/track?orderId=${encodeURIComponent(order.orderId || order.id)}`} className="bk-outline-btn h-9 px-3 text-xs">Track Details</Link>
                          <button type="button" onClick={() => handleDownloadInvoice(order)} className="bk-outline-btn h-9 px-3 text-xs flex items-center gap-1">
                            <FileText size={13} />
                            Invoice
                          </button>
                        </div>
                      </div>
                      {order.status === "Delivered" && (
                        <div className="mt-4 pt-4 border-t border-[#ebebeb] flex gap-2 flex-wrap md:col-span-2 w-full">
                          {order.items.map((itemName, idx) => {
                            const p = catalog.find((c) => String(c.name || "").toLowerCase() === String(itemName || "").toLowerCase());
                            if (!p) return <span key={idx} className="text-xs text-[#6f7573]">{itemName}</span>;
                            const isReviewed = userReviews.some((r) => r.productId === p.id);
                            return (
                              <div key={`${order.id}-${p.id}`} className="flex items-center gap-2 rounded-lg border border-[#ebebeb] p-2 bg-white">
                                <span className="text-xs font-bold text-[#1f2221] truncate max-w-[140px]">{p.name}</span>
                                {isReviewed ? (
                                  <span className="text-[10px] font-black text-[#0f8b57] bg-[#e8f8ef] px-2 py-0.5 rounded">Reviewed</span>
                                ) : (
                                  <button type="button" onClick={() => setReviewModal({ open: true, product: p, rating: 5, comment: "", submitting: false })} className="text-[10px] font-black text-[#e61951] bg-[#fff2e9] px-2 py-0.5 rounded hover:bg-[#e61951] hover:text-white transition">Review</button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.article>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Package className="mx-auto text-[#e61951]" size={40} />
                    <h3 className="mt-4 text-lg font-black text-[#1f2221] md:text-xl">No orders yet</h3>
                    <p className="mt-2 text-sm text-[#6f7573]">Your cake orders will appear here after checkout.</p>
                    <Link to="/shop" className="bk-btn mt-5 h-11 px-5 text-sm">Shop Cakes</Link>
                  </div>
                )}
              </div>
            </section>}

            {activeSection === "reviews" && (
              <section className="bk-card overflow-hidden shadow-sm">
                <div className="divide-y divide-[#ebebeb]">
                  {userReviews.length ? (
                    userReviews.map((review, idx) => {
                      const product = catalog.find((p) => p.id === review.productId);
                      return (
                        <article key={review.id || review._id || idx} className="p-4 bg-white transition hover:bg-[#fafafa]">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-sm font-black text-[#1f2221]">{product ? product.name : "Unknown Product"}</h3>
                              <p className="text-[10px] font-bold text-[#6f7573] mt-0.5">{new Date(review.createdAt).toLocaleDateString()}</p>
                            </div>
                            {product && (
                              <Link to={`/product/${product.id}`} className="text-xs font-bold text-[#e61951] hover:underline">View Product</Link>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mb-2 text-[#e61951]">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-[#ebebeb]"} />
                            ))}
                          </div>
                          <p className="text-sm text-[#6f7573] leading-6">{review.comment}</p>
                        </article>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center">
                      <Star className="mx-auto text-[#ebebeb]" size={40} />
                      <h3 className="mt-4 text-base font-black text-[#1f2221]">No reviews yet</h3>
                      <p className="mt-2 text-sm text-[#6f7573]">Review products from your delivered orders.</p>
                      <button type="button" onClick={() => setActiveSection("orders")} className="bk-outline-btn mt-4 h-10 px-4 text-xs">View Orders</button>
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeSection === "favourites" && (
              <section className="bk-card p-4 md:p-5 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  {favouriteProducts.length ? favouriteProducts.map((product) => (
                    <Link key={product.id} to={`/product/${product.id}`} className="flex gap-3 rounded-lg border border-[#ebebeb] p-3 hover:border-[#e61951]">
                      <img src={product.image} alt={product.name} loading="lazy" className="h-16 w-16 rounded-lg object-cover" />
                      <div>
                        <h3 className="text-sm font-black text-[#1f2221]">{product.name}</h3>
                        <p className="mt-1 text-sm font-bold text-[#1f2221]">{formatPrice(product.price)}</p>
                      </div>
                    </Link>
                  )) : <p className="rounded-lg bg-[#f7f7f7] p-4 text-sm font-bold text-[#6f7573]">Liked cakes will appear here.</p>}
                </div>
              </section>
            )}

            {activeSection === "address" && (
              <section className="bk-card p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-end">
                  <button type="button" onClick={() => setShowAddAddress(!showAddAddress)} className="bk-btn h-9 px-4 text-xs">
                    {showAddAddress ? "Cancel" : "+ Add New"}
                  </button>
                </div>
                {showAddAddress && (
                  <form onSubmit={handleAddAddress} className="mb-6 rounded-lg border border-[#ebebeb] p-4">
                    <h3 className="mb-4 text-sm font-black text-[#1f2221]">Add New Address</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-1 block text-xs font-bold text-[#6f7573]">Label (e.g., Home, Work)</span>
                        <input name="label" required className="bk-input h-10 px-3 text-sm" />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-bold text-[#6f7573]">Name</span>
                        <input name="name" required className="bk-input h-10 px-3 text-sm" />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-bold text-[#6f7573]">Phone</span>
                        <input name="phone" required className="bk-input h-10 px-3 text-sm" />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-bold text-[#6f7573]">Address</span>
                        <input name="address" required className="bk-input h-10 px-3 text-sm" />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-bold text-[#6f7573]">Pincode</span>
                        <input
                          name="pincode"
                          required
                          inputMode="numeric"
                          maxLength={6}
                          onInput={(event) => { event.currentTarget.value = normalizePincode(event.currentTarget.value); }}
                          className="bk-input h-10 px-3 text-sm"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-bold text-[#6f7573]">City</span>
                        <input name="city" required className="bk-input h-10 px-3 text-sm" />
                      </label>
                      <label className="block md:col-span-2">
                        <span className="mb-1 block text-xs font-bold text-[#6f7573]">Landmark (Optional)</span>
                        <input name="landmark" className="bk-input h-10 px-3 text-sm" />
                      </label>
                    </div>
                    <button type="submit" className="bk-btn mt-4 h-10 w-full text-sm">Save Address</button>
                  </form>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  {profile.addresses?.length ? profile.addresses.map((addr) => (
                    <div key={addr.id} className="relative rounded-lg border border-[#ebebeb] p-4 flex flex-col justify-between">
                      <div>
                        <span className="absolute right-4 top-4 rounded bg-[#f7f7f7] px-2 py-0.5 text-[10px] font-black text-[#6f7573] uppercase tracking-wider">{addr.label}</span>
                        <p className="text-sm font-black text-[#1f2221] pr-12">{addr.name}</p>
                        <p className="mt-0.5 text-xs font-bold text-[#6f7573]">{addr.phone}</p>
                        <p className="mt-2 text-xs text-[#6f7573] leading-relaxed">{addr.address}, {addr.landmark ? `${addr.landmark}, ` : ""}{addr.city} - {addr.pincode}</p>
                      </div>
                      <button type="button" onClick={() => handleDeleteAddress(addr.id)} className="mt-3 text-xs font-bold text-[#e61951] hover:underline self-start">Remove</button>
                    </div>
                  )) : !showAddAddress && <p className="rounded-lg bg-[#f7f7f7] p-4 text-sm font-bold text-[#6f7573]">No saved addresses yet.</p>}
                </div>
              </section>
            )}

            {activeSection === "settings" && (
              <section className="bk-card p-4 shadow-sm">
                <form onSubmit={handleUpdateProfile} className="grid gap-4">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-[#6f7573]">Name</span>
                    <input
                      type="text"
                      name="name"
                      defaultValue={profile.name}
                      required
                      className="bk-input h-10 px-3 text-sm font-bold text-[#1f2221]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-[#6f7573]">Email Address (cannot be changed)</span>
                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      disabled
                      readOnly
                      className="bk-input h-10 px-3 text-sm font-bold text-[#8c9290] bg-[#f7f7f7] cursor-not-allowed border-[#ebebeb]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-[#6f7573]">Phone</span>
                    <input
                      type="text"
                      name="phone"
                      defaultValue={profile.phone || ""}
                      placeholder="Add phone number"
                      className="bk-input h-10 px-3 text-sm font-bold text-[#1f2221]"
                    />
                  </label>

                  <button type="submit" className="bk-btn h-10 text-sm font-black mt-2">
                    Save Changes
                  </button>
                </form>
              </section>
            )}
          </main>
            </div>
          )}
        </div>
      </div>

      {reviewModal.open && reviewModal.product && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl"
          >
            <div className="border-b border-[#ebebeb] p-5">
              <h2 className="text-xl font-black text-[#1f2221]">Write a Review</h2>
              <p className="mt-1 text-sm text-[#6f7573] truncate">{reviewModal.product.name}</p>
            </div>
            <form onSubmit={handleReviewSubmit} className="p-5">
              <div className="mb-4">
                <label className="mb-2 block text-sm font-black text-[#1f2221]">Rating</label>
                <div className="flex gap-2 text-[#e61951]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setReviewModal((p) => ({ ...p, rating: i + 1 }))}
                      className="transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star size={24} fill={i < reviewModal.rating ? "currentColor" : "none"} className={i < reviewModal.rating ? "" : "text-[#ebebeb]"} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <label className="mb-2 block text-sm font-black text-[#1f2221]">Comment</label>
                <textarea
                  required
                  rows={4}
                  value={reviewModal.comment}
                  onChange={(e) => setReviewModal((p) => ({ ...p, comment: e.target.value }))}
                  placeholder="How was the cake? Share your experience..."
                  className="bk-input w-full resize-none px-4 py-3 text-sm"
                />
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setReviewModal({ open: false, product: null, rating: 5, comment: "", submitting: false })}
                  className="bk-outline-btn h-11 px-5 text-sm disabled:opacity-50 sm:h-10"
                  disabled={reviewModal.submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bk-btn h-11 px-5 text-sm disabled:opacity-50 sm:h-10"
                  disabled={reviewModal.submitting}
                >
                  {reviewModal.submitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function ProfileNavItem({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[72px] w-full items-center justify-between border-b border-[#ebebeb] bg-white px-5 text-[#1f2221] transition hover:bg-[#fafafa] last:border-0"
    >
      <div className="flex items-center gap-4">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-[#f7f7f7] text-[#6f7573]">
          <Icon size={18} />
        </div>
        <span className="text-base font-black">{label}</span>
      </div>
      <ChevronRight size={18} className="text-[#a0a5a3]" />
    </button>
  );
}

export {
  Profile as default
};
