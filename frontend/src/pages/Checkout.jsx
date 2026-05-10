import { useState } from "react";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import "./Checkout.css";

function Checkout() {
  const { cartItems } = useCart();
  const navigate = useNavigate();

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (
      !form.name ||
      !form.phone ||
      !form.email ||
      !form.city ||
      !form.state ||
      !form.pincode ||
      !form.address
    ) {
      alert("Please fill all fields");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const res = await fetch("http://localhost:5000/api/payment/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: total }),
      });

      const data = await res.json();

      if (!data.id) {
        alert("Order creation failed ❌");
        return;
      }

      const options = {
        key: "rzp_test_SVwS2bSO1A1R5a",
        amount: data.amount,
        currency: data.currency,
        order_id: data.id,
        name: "SmartCart",

        handler: function () {
          alert("Payment Successful ✅");
          navigate("/orders");
        },

        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },

        theme: {
          color: "#fb641b",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.log(err);
      alert("Payment failed ❌");
    }
  };

  return (
    <>
      <Navbar />

      <div className="checkout-page">
        <h2>Checkout</h2>

        <div className="checkout-container">

          {/* ✅ FIXED CLASS */}
          <div className="checkout-left">
            <h3>Delivery Details</h3>

            <div className="form-grid">

              <div className="field">
                <input name="name" value={form.name} onChange={handleChange} placeholder="Full Name" />
              </div>

              <div className="field">
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" />
              </div>

              <div className="field">
                <input name="email" value={form.email} onChange={handleChange} placeholder="Email" />
              </div>

              <div className="field">
                <input name="city" value={form.city} onChange={handleChange} placeholder="City" />
              </div>

              <div className="field">
                <input name="state" value={form.state} onChange={handleChange} placeholder="State" />
              </div>

              <div className="field">
                <input name="pincode" value={form.pincode} onChange={handleChange} placeholder="Pincode" />
              </div>

              <div className="field full">
                <textarea name="address" value={form.address} onChange={handleChange} placeholder="Address" />
              </div>

            </div>
          </div>

          {/* ✅ FIXED CLASS */}
          <div className="checkout-right">
            <h3>Order Summary</h3>
            <p>Items: {cartItems.length}</p>
            <h2>Total: ₹{total}</h2>

            <button className="pay-btn" onClick={handleSubmit}>
              Proceed to Payment
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

export default Checkout;