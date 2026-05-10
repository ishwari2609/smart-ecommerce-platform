import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import "./Cart.css";

function Cart() {
  const { cartItems } = useCart();
  const navigate = useNavigate();

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  return (
    <>
      <Navbar />

      <div className="cart-page">
        <h2>Shopping Cart</h2>

        <div className="cart-container">

          <div className="cart-left">
            {cartItems.length === 0 ? (
              <p>Your cart is empty</p>
            ) : (
              cartItems.map((item) => (
                <div className="cart-item" key={item.id}>
                  <img src={item.image} alt={item.name} />

                  <div className="item-details">
                    <h3>{item.name}</h3>
                    <p className="stock">In stock</p>
                    <p>FREE delivery Tomorrow</p>

                    <h2>₹{item.price}</h2>

                    {/* ✅ FIXED */}
                    <div className="qty">
                      Quantity:
                      <select defaultValue={item.qty}>
                        <option>1</option>
                        <option>2</option>
                      </select>
                    </div>

                    <div className="links">
                      <span>Delete</span>
                      <span>Save for later</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="cart-right">
            <h3>Price Details</h3>
            <p>Subtotal ({cartItems.length} items)</p>
            <h2>₹{total}</h2>

            <button
              className="buy-btn"
              onClick={() => navigate("/checkout")}
            >
              Proceed to Checkout
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

export default Cart;