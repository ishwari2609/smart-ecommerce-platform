import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";

function Orders() {
  const { cartItems } = useCart();

  // Ensure cartItems is an array
  const orders = Array.isArray(cartItems) ? cartItems : [];

  return (
    <>
      <Navbar />

      <div style={{ padding: "30px", background: "#f5f7fa", minHeight: "100vh" }}>
        
        {/* HEADER */}
        <h2>Your Orders</h2>
        <p style={{ color: "#6b7280", marginBottom: "20px" }}>
          Track, manage and view all your recent orders
        </p>

        {/* ORDERS */}
        {orders.length === 0 ? (
          <div
            style={{
              background: "#fff",
              padding: "30px",
              borderRadius: "10px",
              textAlign: "center",
            }}
          >
            <h3>No orders yet 😔</h3>
            <p>Start shopping to see your orders here.</p>
          </div>
        ) : (
          orders.map((item, index) => (
            <div
              key={index}
              style={{
                background: "#fff",
                padding: "20px",
                marginBottom: "20px",
                borderRadius: "10px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
              }}
            >
              {/* TOP INFO BAR */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "15px",
                  fontSize: "14px",
                  color: "#555",
                }}
              >
                <div>
                  <strong>ORDER PLACED:</strong> Today
                </div>
                <div>
                  <strong>TOTAL:</strong> ₹{item.price}
                </div>
                <div>
                  <strong>ORDER ID:</strong> #{Math.floor(Math.random() * 100000)}
                </div>
              </div>

              {/* MAIN CONTENT */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                {/* LEFT */}
                <div style={{ display: "flex", gap: "20px" }}>
                  <img src={item.image} alt="" style={{ width: "100px" }} />

                  <div>
                    <h4>{item.name}</h4>

                    <p style={{ color: "green", fontWeight: "bold" }}>
                      Arriving tomorrow by 9 PM
                    </p>

                    <p style={{ fontSize: "14px", color: "#555" }}>
                      Sold by SmartCart • Free Delivery
                    </p>

                    <p style={{ marginTop: "5px" }}>₹{item.price}</p>
                  </div>
                </div>

                {/* RIGHT */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <button
                    style={{
                      background: "#ffd814",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "20px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Track Package
                  </button>

                  <button
                    style={{
                      padding: "8px",
                      borderRadius: "10px",
                      border: "1px solid #ddd",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Cancel Order
                  </button>

                  <button
                    style={{
                      padding: "8px",
                      borderRadius: "10px",
                      border: "1px solid #ddd",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>

              {/* EXTRA FOOTER */}
              <div
                style={{
                  marginTop: "15px",
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                Need help? Contact support • Easy returns available
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default Orders;