import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

function Login({ adminOnly = false }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(adminOnly ? "admin" : "customer");

  const [message, setMessage] = useState("");
  const [type, setType] = useState("");

  // 🔄 REFRESH/RESET FORM ON PAGE LOAD
  useEffect(() => {
    setEmail("");
    setPassword("");
    setRole(adminOnly ? "admin" : "customer");
    setMessage("");
    setType("");
    // Clear browser autofill
    document.querySelectorAll('input[type="email"], input[type="password"]').forEach(input => {
      input.value = "";
    });
  }, [adminOnly]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setType("error");
      setMessage("Please fill all fields");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password, role })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.removeItem("role");
        localStorage.setItem("role", role);

        setType("success");
        setMessage("OTP sent to your email 📩");

        setTimeout(() => {
          navigate("/verify-otp", { state: { email, role } });
        }, 1500);
      } else {
        setType("error");
        setMessage(data.message || "Login failed");
      }
    } catch (error) {
      setType("error");
      setMessage("Server error");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="bg-circle circle1"></div>
      <div className="bg-circle circle2"></div>

      <div className="auth-card">
        <h1 className="brand">SmartCart</h1>
        <p className="tagline">Shop Smart. Live Better.</p>

        {/* MESSAGE */}
        {message && (
          <div className={`auth-message ${type}`}>
            {message}
          </div>
        )}

        {/* ROLE INFO (no visible role select for users) */}
        <div className="input-box select-box" style={{ marginBottom: "5px" }}>
          <p style={{ color: "#fff", margin: 0, fontSize: "14px", textAlign: "left" }}>
            {adminOnly ? "Admin Login" : "Customer Login"}
          </p>
        </div>

        <form onSubmit={handleLogin} autoComplete="off">

          {/* EMAIL */}
          <div className="input-box">
            <input
              type="email"
              placeholder="your@email.com"
              autoComplete="off"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label>Email Address</label>
          </div>

          {/* PASSWORD */}
          <div className="input-box">
            <input
              type="password"
              placeholder="Enter your password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label>Password</label>
          </div>

          {/* BUTTON */}
          <button type="submit" className="login-button">
            Login
          </button>
        </form>

        {!adminOnly ? (
          <div className="bottom-text">
            Don't have an account? <span onClick={() => navigate("/register")}>Register</span>
          </div>
        ) : (
          <>
            <div className="bottom-text">
              Admin registration? <span onClick={() => navigate("/admin-register")}>Register as Admin</span>
            </div>
            <div className="bottom-text" style={{ marginTop: "8px" }}>
              Customer login? <span onClick={() => navigate("/login")}>Click here</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;