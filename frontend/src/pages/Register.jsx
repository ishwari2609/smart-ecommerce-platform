import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";
import Toast from "../components/Toast";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    password: "",
    confirmPassword: "",
    gender: ""
  });

  const [toast, setToast] = useState({
    message: "",
    type: ""
  });

  // 🔹 SHOW TOAST NOTIFICATION
  const showToast = (message, type) => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast({ message: "", type: "" });
  };

  // 🔹 HANDLE INPUT CHANGE
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔹 HANDLE REGISTER
  const handleRegister = async (e) => {
    e.preventDefault();

    const {
      name,
      email,
      phone,
      country,
      city,
      password,
      confirmPassword,
      gender
    } = form;

    // ✅ VALIDATIONS
    if (!name || !email || !phone || !country || !city || !password || !confirmPassword || !gender) {
      showToast("Please fill all fields", "error");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      showToast("Phone number must be 10 digits", "error");
      return;
    }

    if (password.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    try {
      // ❗ Remove confirmPassword before sending
      const { confirmPassword, ...userData } = form;
      userData.role = "customer";

      const apiBaseUrl = import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/api`
        : "http://localhost:5000/api";

      const res = await fetch(`${apiBaseUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(userData)
      });

      const data = await res.json();

      // ✅ SUCCESS HANDLING
      if (res.ok) {
        // 👉 ADMIN FLOW (OTP)
        if (userData.role === "admin" && data.message?.includes("OTP")) {
          showToast("Admin registration started. Check your email for OTP", "success");
          setTimeout(() => {
            navigate("/verify-otp", {
              state: { email: userData.email, role: "admin" }
            });
          }, 1500);
        } else {
          // 👉 CUSTOMER FLOW
          showToast(data.message || "Registration successful", "success");
          setTimeout(() => {
            navigate("/login");
          }, 1500);
        }
      } else {
        showToast(data.message || "Registration failed", "error");
      }

    } catch (error) {
      console.error(error);
      showToast("Server error occurred", "error");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="bg-circle circle1"></div>
      <div className="bg-circle circle2"></div>

      <Toast message={toast.message} type={toast.type} onClose={closeToast} />

      <div className="auth-card large">
        <h2 className="brand">Registration</h2>

        <form onSubmit={handleRegister} className="grid-form">

          <input
            name="name"
            placeholder="Full Name"
            onChange={handleChange}
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
          />

          <input
            name="phone"
            placeholder="Phone Number"
            onChange={handleChange}
          />

          <input
            name="country"
            placeholder="Country"
            onChange={handleChange}
          />

          <input
            name="city"
            placeholder="City"
            onChange={handleChange}
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
          />

          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            onChange={handleChange}
          />

          {/* 🔹 GENDER */}
          <div className="gender-box">
            <label>
              <input type="radio" name="gender" value="Male" onChange={handleChange} />
              Male
            </label>

            <label>
              <input type="radio" name="gender" value="Female" onChange={handleChange} />
              Female
            </label>

            <label>
              <input type="radio" name="gender" value="Other" onChange={handleChange} />
              Other
            </label>
          </div>

          <button type="submit" className="login-button">
            Register
          </button>
        </form>

        <div className="bottom-text">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")}>Login</span>
        </div>
      </div>
    </div>
  );
}

export default Register;