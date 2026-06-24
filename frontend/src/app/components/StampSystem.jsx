import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Gift } from "lucide-react";
import { useCart } from "../context/CartContext";
import { getStoredUser, isUserLoggedIn, SESSION_EVENT } from "../utils/session";
import { getProductsPaginated } from "../api/client";
import { formatPrice } from "../utils/format";
import { useNavigate } from "react-router";
import { toast } from "sonner";

function StampSystem() {
  const [user, setUser] = useState(() => getStoredUser());
  const [loggedIn, setLoggedIn] = useState(() => isUserLoggedIn());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [rewardProducts, setRewardProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  
  const { addProduct } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const syncSession = () => {
      setUser(getStoredUser());
      setLoggedIn(isUserLoggedIn());
    };
    window.addEventListener(SESSION_EVENT, syncSession);
    return () => window.removeEventListener(SESSION_EVENT, syncSession);
  }, []);

  if (!loggedIn || !user) return null;

  const stampCount = user.stampCount || 0;
  const maxStamps = 5;

  const loadRewardProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const res = await getProductsPaginated({}, 1, 100);
      const allProducts = res.products || [];
      const filtered = allProducts.filter(p => 
        p.isTrending || 
        (p.category && p.category.toLowerCase().includes("bento")) ||
        (p.subcategory && p.subcategory.toLowerCase().includes("bento")) ||
        (p.name && p.name.toLowerCase().includes("bento"))
      );
      setRewardProducts(filtered);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load reward items.");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleCollectFreeItem = () => {
    setIsModalOpen(false);
    setIsSelectorOpen(true);
    if (rewardProducts.length === 0) {
      loadRewardProducts();
    }
  };

  const handleAddFreeItem = async (product) => {
    try {
      toast.loading("Adding to cart...");
      await addProduct(product, 1, product.defaultWeight || "Half Kg", "", "", true);
      toast.dismiss();
      toast.success("Free item added to cart!");
      setIsSelectorOpen(false);
      navigate("/cart");
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to add free item.");
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-[#1f2221] transition hover:bg-[#fff2e9] hover:text-[#e61951] md:h-11 md:w-11"
        aria-label="Stamp Card"
        title="Your Stamp Card"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-current font-black text-sm">
          C
        </span>
        {stampCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0f8b57] px-1 text-[10px] font-black leading-none text-white">
            {stampCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="bg-gradient-to-r from-[#ffe4d6] to-[#ffc9b3] p-6 text-center">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute right-4 top-4 text-[#e61951] hover:text-[#c41544]"
                >
                  <X size={20} />
                </button>
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#e61951] shadow-sm">
                  <Gift size={28} />
                </div>
                <h3 className="text-xl font-black text-[#1f2221]">Loyalty Card</h3>
                <p className="mt-2 text-xs font-bold text-[#e61951]">
                  Fill this card by doing orders and get any one product for free from bento or trending section!
                </p>
              </div>

              <div className="p-6">
                <div className="flex justify-between gap-2">
                  {Array.from({ length: maxStamps }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 border-dashed ${
                        i < stampCount
                          ? "border-[#e61951] bg-[#fff2e9] text-[#e61951]"
                          : "border-[#ebebeb] bg-[#f7f7f7] text-[#c2c2c2]"
                      }`}
                    >
                      {i < stampCount ? (
                        <span className="text-[9px] font-black uppercase tracking-tighter -rotate-12 leading-tight text-center">
                          Choco<br/>Riches
                        </span>
                      ) : (
                        <span className="text-lg font-black">{i + 1}</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm font-bold text-[#6f7573]">
                    {stampCount >= maxStamps
                      ? "Card full! Claim your reward now."
                      : `You have ${stampCount} stamp${stampCount !== 1 ? 's' : ''}. Only ${maxStamps - stampCount} more to go!`}
                  </p>
                </div>
              </div>

              {stampCount >= maxStamps && (
                <div className="border-t border-[#ebebeb] bg-[#f7f7f7] p-4">
                  <button
                    onClick={handleCollectFreeItem}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0f8b57] px-6 text-sm font-black text-white shadow-lg transition-transform hover:scale-[1.02] hover:bg-[#0c784b]"
                  >
                    <Gift size={18} />
                    Collect Free Item
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSelectorOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSelectorOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative flex h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-[#ebebeb] p-5">
                <div>
                  <h3 className="text-lg font-black text-[#1f2221]">Select Your Free Item</h3>
                  <p className="text-xs font-bold text-[#6f7573]">Choose from Bento or Trending products</p>
                </div>
                <button
                  onClick={() => setIsSelectorOpen(false)}
                  className="rounded-full bg-[#f7f7f7] p-2 text-[#6f7573] hover:bg-[#ebebeb]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {isLoadingProducts ? (
                  <div className="flex h-full items-center justify-center text-sm font-bold text-[#6f7573]">
                    Loading reward options...
                  </div>
                ) : rewardProducts.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm font-bold text-[#6f7573]">
                    No eligible products found.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {rewardProducts.map((product) => (
                      <div key={product.id} className="overflow-hidden rounded-xl border border-[#ebebeb] bg-white transition hover:border-[#0f8b57]">
                        <div className="aspect-[4/3] w-full overflow-hidden bg-[#f7f7f7]">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-3">
                          <p className="line-clamp-1 text-sm font-black text-[#1f2221]">{product.name}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs font-bold text-[#6f7573] line-through">{formatPrice(product.price)}</span>
                            <span className="text-xs font-black text-[#0f8b57]">FREE</span>
                          </div>
                          <button
                            onClick={() => handleAddFreeItem(product)}
                            className="mt-3 flex h-9 w-full items-center justify-center rounded-lg bg-[#eefbf3] text-xs font-black text-[#0f8b57] transition hover:bg-[#0f8b57] hover:text-white"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default StampSystem;
