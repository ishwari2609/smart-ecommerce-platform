import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Auth.css";

function VerifyOTP() {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;
  const role = location.state?.role || "customer";

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      setType("error");
      setMessage("Please enter the OTP");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });

      const data = await res.json();

      if (res.ok) {
        setType("success");
        setMessage("OTP verified successfully ✅");
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", role);
        localStorage.setItem("userEmail", email);
        
        console.log(`✅ [LOGIN] SUCCESS: ${email} logged in as ${role.toUpperCase()}`);

        setTimeout(() => {
          if (role === "admin") {
            console.log("🔐 [REDIRECT] Sending admin to /admin");
            navigate("/admin");
          } else {
            console.log("🛍️ [REDIRECT] Sending customer to /");
            navigate("/");
          }
        }, 1200);
      } else {
        setType("error");
        setMessage(data.message || "Invalid OTP. Try again.");
      }
    } catch (error) {
      setType("error");
      setMessage("Server error. Please retry.");
    }
  };

  const handleResend = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (res.ok) {
        setType("success");
        setMessage("OTP resent! Check your email.");
      } else {
        setType("error");
        setMessage(data.message || "Failed to resend OTP");
      }
    } catch (error) {
      setType("error");
      setMessage("Server error while resending OTP");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="bg-circle circle1"></div>
      <div className="bg-circle circle2"></div>
      <div className="verify-card">
        <h1>Verify OTP</h1>
        <p className="verify-note">Enter the OTP sent to {email} to complete login.</p>

        {message && <div className={`auth-message ${type}`}>{message}</div>}

        <div className="input-box">
          <input
            className="otp-input"
            type="text"
            maxLength={6}
            inputMode="numeric"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <label>One-time Password</label>
        </div>

        <div className="otp-actions">
          <button className="resend-btn" type="button" onClick={handleResend}>Resend</button>
          <button className="verify-btn" type="button" onClick={handleVerify}>Verify</button>
        </div>

        <div className="bottom-text" style={{ marginTop: "14px" }}>
          <span onClick={() => navigate(role === "admin" ? "/admin-login" : "/login")}>Back to Login</span>
        </div>
      </div>
    </div>
  );
}

export default VerifyOTP;