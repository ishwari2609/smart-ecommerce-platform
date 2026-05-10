import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css";

function Admin() {
  const navigate = useNavigate();

  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    password: "",
    adminCode: ""
  });
  const [message, setMessage] = useState("");
  const [type, setType] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("role");

    if (role !== "admin") {
      navigate("/login");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("role");
    navigate("/login");
  };

  const handleAdminFormChange = (e) => {
    setAdminForm({ ...adminForm, [e.target.name]: e.target.value });
  };

  const handleAdminRegister = async (e) => {
    e.preventDefault();

    const { name, email, password, adminCode } = adminForm;

    if (!name || !email || !password || !adminCode) {
      setType("error");
      setMessage("Please fill all fields for admin registration");
      return;
    }

    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api";
      const res = await fetch(`${apiBaseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, adminCode, role: "admin" })
      });

      const data = await res.json();
      if (res.ok) {
        setType("success");
        setMessage("Admin invited. OTP sent to email for verification.");

        setTimeout(() => {
          navigate("/verify-otp", { state: { email, role: "admin" } });
        }, 1000);
      } else {
        setType("error");
        setMessage(data.message || "Admin registration failed");
      }
    } catch (error) {
      setType("error");
      setMessage("Server error while registering admin");
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <div className="admin-content">
        <div className="welcome-card">
          <h2>Welcome Admin 👩‍💻</h2>
          <p>Manage your e-commerce platform here</p>
        </div>

        <div className="admin-card" style={{ marginBottom: "20px" }}>
          <h3>🔐 Invite New Admin</h3>
          <p>Only existing verified admin can create new admin.</p>

          {message && (
            <div className={`auth-message ${type}`} style={{ marginBottom: "10px" }}>
              {message}
            </div>
          )}

          <form onSubmit={handleAdminRegister} style={{ display: "grid", gap: "10px" }}>
            <input
              name="name"
              type="text"
              placeholder="Admin Name"
              value={adminForm.name}
              onChange={handleAdminFormChange}
              required
            />
            <input
              name="email"
              type="email"
              placeholder="Admin Email"
              value={adminForm.email}
              onChange={handleAdminFormChange}
              required
            />
            <input
              name="password"
              type="password"
              placeholder="Admin Password"
              value={adminForm.password}
              onChange={handleAdminFormChange}
              required
            />
            <input
              name="adminCode"
              type="text"
              placeholder="Admin Secret Code"
              value={adminForm.adminCode}
              onChange={handleAdminFormChange}
              required
            />
            <button type="submit" className="login-button">Create Admin</button>
          </form>
        </div>

        <div className="admin-grid">
          <div className="admin-card" onClick={() => navigate("/admin")}> 
            <h3>📊 Dashboard</h3>
            <p>View sales and analytics</p>
          </div>
          <div className="admin-card" onClick={() => navigate("/admin/products")}> 
            <h3>📦 Products</h3>
            <p>Manage products and inventory</p>
          </div>
          <div className="admin-card" onClick={() => navigate("/admin/recommendations")}> 
            <h3>🎯 Recommendations</h3>
            <p>Send personalized product recommendations</p>
          </div>
          <div className="admin-card" onClick={() => navigate("/admin/users")}> 
            <h3>👥 Users</h3>
            <p>Manage customer accounts</p>
          </div>
          <div className="admin-card" onClick={() => navigate("/admin/orders")}> 
            <h3>📋 Orders</h3>
            <p>View and process orders</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;