import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [toast, setToast] = useState("");

  // 🔥 AUTO HIDE TOAST (FOR ALL CASES)
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast("");
      }, 3000); // 3 sec

      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ADD TO CART
  const addToCart = (product, qty = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);

      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, qty: item.qty + qty }
            : item
        );
      }

      return [...prev, { ...product, qty }];
    });

    setToast("✅ Added to cart");
  };

  const removeFromCart = (id) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
    setToast("❌ Item removed");
  };

  const updateQty = (id, qty) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Number(qty) } : item
      )
    );
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQty,
        setToast, // ✅ IMPORTANT
      }}
    >
      {children}

      {/* GLOBAL TOAST */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "80px",
            right: "20px",
            background: "#22c55e",
            color: "white",
            padding: "12px 20px",
            borderRadius: "8px",
            fontWeight: "500",
            zIndex: 1000,
            boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
          }}
        >
          {toast}
        </div>
      )}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);