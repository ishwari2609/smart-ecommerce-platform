import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

function AdminRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    password: "",
    confirmPassword: "",
    gender: "",
    adminCode: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const { name, email, phone, country, city, password, confirmPassword, gender, adminCode } = form;

    if (!name || !email || !phone || !country || !city || !password || !confirmPassword || !gender || !adminCode) {
      alert("Please fill all fields");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      alert("Phone number must be 10 digits");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const { confirmPassword: cp, ...userData } = form;
      userData.adminCode = adminCode.trim();
      userData.role = "admin";

      const apiBaseUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "http://localhost:5000/api";

      const res = await fetch(`${apiBaseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData)
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message || "Admin registration started. Check email for OTP.");
        navigate("/verify-otp", { state: { email: userData.email, role: "admin" } });
      } else {
        alert(data.message || "Admin registration failed");
      }
    } catch (error) {
      console.error(error);
      alert("Server error");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="bg-circle circle1"></div>
      <div className="bg-circle circle2"></div>

      <div className="auth-card large">
        <h2 className="brand">Admin Registration</h2>

        <form onSubmit={handleRegister} className="grid-form">
          <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} />
          <input name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} />
          <input name="country" placeholder="Country" value={form.country} onChange={handleChange} />
          <input name="city" placeholder="City" value={form.city} onChange={handleChange} />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} />
          <input name="confirmPassword" type="password" placeholder="Confirm Password" value={form.confirmPassword} onChange={handleChange} />
          <input name="adminCode" type="text" placeholder="Admin Code" value={form.adminCode} onChange={handleChange} />

          <div className="gender-box">
            <label><input type="radio" name="gender" value="Male" onChange={handleChange} /> Male</label>
            <label><input type="radio" name="gender" value="Female" onChange={handleChange} /> Female</label>
            <label><input type="radio" name="gender" value="Other" onChange={handleChange} /> Other</label>
          </div>

          <button type="submit" className="login-button">Register as Admin</button>
        </form>

        <div className="bottom-text">
          Already have an account? <span onClick={() => navigate("/admin-login")}>Login</span>
        </div>

        <div className="bottom-text" style={{ marginTop: "8px" }}>
          Customer signup? <span onClick={() => navigate("/register")}>Click here</span>
        </div>
      </div>
    </div>
  );
}

export default AdminRegister;
