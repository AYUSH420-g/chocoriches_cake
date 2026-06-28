import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { addCartItem, clearCart as clearCartItems, getCart, removeCartItem, updateCartItem } from "../api/client";
import { SESSION_EVENT } from "../utils/session";
import { toast } from "sonner";

const CartContext = createContext(null);

function sameProduct(item, productId, size = "", baseFlavour = "", creamFlavour = "") {
  const productMatches = String(item.productId || item.id || "") === String(productId || "");
  const sizeMatches = !size || String(item.size || item.weight || "").toLowerCase() === String(size).toLowerCase();
  const baseFlavourMatches = !baseFlavour || item.baseFlavour === baseFlavour;
  const creamFlavourMatches = !creamFlavour || item.creamFlavour === creamFlavour;
  
  return productMatches && sizeMatches && baseFlavourMatches && creamFlavourMatches;
}

function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshCart = useCallback(async () => {
    const items = await getCart();
    setCart(items);
    return items;
  }, []);

  useEffect(() => {
    let mounted = true;
    getCart()
      .then((items) => {
        if (mounted) {
          setCart(items);
        }
      })
      .catch(() => {
        if (mounted) {
          setCart([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const syncCart = () => {
      refreshCart().catch(() => setCart([]));
    };

    window.addEventListener(SESSION_EVENT, syncCart);
    return () => window.removeEventListener(SESSION_EVENT, syncCart);
  }, [refreshCart]);

  const addProduct = useCallback(
    async (product, quantity = 1, size = "Half Kg", baseFlavour = "", creamFlavour = "", isStampReward = false) => {
      const deliveryDate = sessionStorage.getItem("chocoriches_delivery_date") || new Date().toISOString().slice(0, 10);
      const item = await addCartItem({ productId: product.id, size, quantity, baseFlavour, creamFlavour, deliveryDate, isStampReward });
      // Optimistically merge the returned item into cart state immediately
      setCart((prev) => {
        const exists = prev.findIndex((ci) => ci.id === item.id);
        if (exists >= 0) {
          const next = [...prev];
          next[exists] = item;
          return next;
        }
        return [...prev, item];
      });
      // Sync with server in background (don't block the UI)
      refreshCart().catch(() => void 0);
      return item;
    },
    [refreshCart]
  );

  const setQuantity = useCallback(
    async (itemId, quantity) => {
      const nextQuantity = Math.max(1, Math.min(Number(quantity) || 1, 9));
      const deliveryDate = sessionStorage.getItem("chocoriches_delivery_date") || new Date().toISOString().slice(0, 10);
      
      // Optimistically update
      setCart((items) => items.map((item) => (item.id === itemId ? { ...item, quantity: nextQuantity } : item)));
      
      try {
        await updateCartItem(itemId, { quantity: nextQuantity, deliveryDate });
        await refreshCart();
      } catch (error) {
        toast.error(error.message || "Could not update quantity.");
        await refreshCart(); // Revert on failure
        throw error;
      }
    },
    [refreshCart]
  );

  const setMessageOnCake = useCallback(
    async (itemId, messageOnCake) => {
      setCart((items) => items.map((item) => (item.id === itemId ? { ...item, messageOnCake } : item)));
      await updateCartItem(itemId, { messageOnCake });
      await refreshCart();
    },
    [refreshCart]
  );

  const removeItem = useCallback(
    async (itemId) => {
      setCart((items) => items.filter((item) => item.id !== itemId));
      await removeCartItem(itemId);
      await refreshCart();
    },
    [refreshCart]
  );

  const clearCart = useCallback(async () => {
    setCart([]);
    await clearCartItems();
  }, []);

  const itemForProduct = useCallback(
    (productId, size = "", baseFlavour = "", creamFlavour = "") => cart.find((item) => sameProduct(item, productId, size, baseFlavour, creamFlavour)),
    [cart]
  );

  const value = useMemo(
    () => ({
      cart,
      cartCount: cart.reduce((count, item) => count + Number(item.quantity || 0), 0),
      loading,
      addProduct,
      itemForProduct,
      clearCart,
      refreshCart,
      removeItem,
      setQuantity,
      setMessageOnCake,
    }),
    [addProduct, cart, clearCart, itemForProduct, loading, refreshCart, removeItem, setQuantity, setMessageOnCake]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}

export {
  CartProvider,
  useCart
};
