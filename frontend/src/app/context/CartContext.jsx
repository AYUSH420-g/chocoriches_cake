import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { addCartItem, clearCart as clearCartItems, getCart, removeCartItem, updateCartItem } from "../api/client";
import { SESSION_EVENT } from "../utils/session";

const CartContext = createContext(null);

function sameProduct(item, productId, size = "") {
  const productMatches = String(item.productId || item.id || "") === String(productId || "");
  if (!size) {
    return productMatches;
  }
  return productMatches && String(item.size || item.weight || "").toLowerCase() === String(size).toLowerCase();
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
    async (product, quantity = 1, size = "Half Kg") => {
      const item = await addCartItem({ productId: product.id, size, quantity });
      await refreshCart();
      return item;
    },
    [refreshCart]
  );

  const setQuantity = useCallback(
    async (itemId, quantity) => {
      const nextQuantity = Math.max(1, Math.min(Number(quantity) || 1, 9));
      setCart((items) => items.map((item) => (item.id === itemId ? { ...item, quantity: nextQuantity } : item)));
      await updateCartItem(itemId, nextQuantity);
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
    (productId, size = "") => cart.find((item) => sameProduct(item, productId, size)),
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
    }),
    [addProduct, cart, clearCart, itemForProduct, loading, refreshCart, removeItem, setQuantity]
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
