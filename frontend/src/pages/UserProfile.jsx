import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Toast from "../components/Toast";
import "./UserProfile.css";

function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState("");
  const [profilePic, setProfilePic] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India"
  });

  const token = localStorage.getItem("token");
  const email = localStorage.getItem("userEmail");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchProfile();
  }, [token, navigate]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Failed to fetch profile");

      const data = await res.json();
      setUser(data.user);
      setFormData({
        name: data.user.name || "",
        phone: data.user.phone || "",
        address: data.user.address || "",
        city: data.user.city || "",
        state: data.user.state || "",
        zipCode: data.user.zipCode || "",
        country: data.user.country || "India"
      });
      setProfilePic(data.user.profilePicture || "");
    } catch (err) {
      setMsgType("error");
      setMessage("❌ Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePic(reader.result);
      setFormData(prev => ({ ...prev, profilePicture: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          profilePicture: profilePic
        })
      });

      if (!res.ok) throw new Error("Failed to update profile");

      const data = await res.json();
      setUser(data.user);
      setEditing(false);
      setMsgType("success");
      setMessage("✅ Profile updated successfully");
    } catch (err) {
      setMsgType("error");
      setMessage("❌ Failed to update profile");
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <p>⏳ Loading profile...</p>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <p>❌ Unable to load profile</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <Toast message={message} type={msgType} onClose={() => setMessage("")} />

      <div className="profile-container">
        {/* PROFILE HEADER */}
        <div className="profile-header">
          <div className="profile-pic-section">
            {/* PROFILE PICTURE */}
            <div className="profile-picture">
              <img
                src={
                  profilePic ||
                  `https://ui-avatars.com/api/?name=${user.name || "User"}&background=f0c14b&color=131921&size=200`
                }
                alt={user.name}
              />
              {editing && (
                <label className="upload-label">
                  📷
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    hidden
                  />
                </label>
              )}
            </div>

            {/* PROFILE INFO */}
            <div className="profile-header-info">
              <h1>{user.name}</h1>
              <p className="email">📧 {user.email}</p>
              <p className="role">👤 {user.role === "admin" ? "Admin" : "Customer"}</p>
              {!editing && (
                <button className="edit-btn" onClick={() => setEditing(true)}>
                  ✏️ Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* PROFILE FORM */}
        <div className="profile-content">
          <div className="profile-card">
            <h2>📋 Profile Information</h2>

            {editing ? (
              <form
                className="profile-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
              >
                {/* NAME */}
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                  />
                </div>

                {/* PHONE */}
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />
                </div>

                {/* ADDRESS */}
                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter your address"
                    rows="3"
                  />
                </div>

                {/* CITY */}
                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Enter city"
                    />
                  </div>

                  {/* STATE */}
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="Enter state"
                    />
                  </div>
                </div>

                {/* ZIP CODE */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Zip Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      placeholder="Enter zip code"
                    />
                  </div>

                  {/* COUNTRY */}
                  <div className="form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="Enter country"
                    />
                  </div>
                </div>

                {/* BUTTONS */}
                <div className="form-actions">
                  <button type="submit" className="save-btn">
                    💾 Save Changes
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setEditing(false)}
                  >
                    ❌ Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-info-display">
                <div className="info-grid">
                  <div className="info-item">
                    <label>Full Name</label>
                    <p>{user.name || "Not provided"}</p>
                  </div>

                  <div className="info-item">
                    <label>Email</label>
                    <p>{user.email}</p>
                  </div>

                  <div className="info-item">
                    <label>Phone</label>
                    <p>{user.phone || "Not provided"}</p>
                  </div>

                  <div className="info-item">
                    <label>Address</label>
                    <p>{user.address || "Not provided"}</p>
                  </div>

                  <div className="info-item">
                    <label>City</label>
                    <p>{user.city || "Not provided"}</p>
                  </div>

                  <div className="info-item">
                    <label>State</label>
                    <p>{user.state || "Not provided"}</p>
                  </div>

                  <div className="info-item">
                    <label>Zip Code</label>
                    <p>{user.zipCode || "Not provided"}</p>
                  </div>

                  <div className="info-item">
                    <label>Country</label>
                    <p>{user.country || "Not provided"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* WISHLIST BUTTON */}
          <div className="profile-card">
            <h2>❤️ My Wishlist</h2>
            <button
              className="wishlist-link-btn"
              onClick={() => navigate("/wishlist")}
            >
              View My Wishlist →
            </button>
          </div>

          {/* ACCOUNT OPTIONS */}
          <div className="profile-card">
            <h2>⚙️ Account Settings</h2>
            <div className="account-options">
              <button className="option-btn">
                🔒 Change Password
              </button>
              <button className="option-btn">
                📧 Email Preferences
              </button>
              <button className="option-btn logout">
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default UserProfile;
