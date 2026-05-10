import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css";
import Toast from "../components/Toast";

function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      // Verify admin access
      if (!token || role !== "admin") {
        setType("error");
        setMessage("Admin authentication required");
        navigate("/login");
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api";
      const res = await fetch(`${apiBaseUrl}/auth/all-users`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const data = await res.json();

      if (res.ok) {
        setUsers(data.users || []);
        setMessage(`Loaded ${data.count || 0} users`);
        setType("success");
      } else {
        setType("error");
        setMessage(data.message || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setType("error");
      setMessage("Server error while fetching users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Verify admin access
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      navigate("/login");
      return;
    }

    fetchUsers();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Manage Users</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="admin-content">
        {message && (
          <div className={`auth-message ${type}`} style={{ marginBottom: "20px" }}>
            {message}
          </div>
        )}

        <div className="admin-card" style={{ marginBottom: "20px" }}>
          <h3>👥 Registered Customers</h3>
          <p>Total Users: <strong>{users.length}</strong></p>

          <div style={{ marginBottom: "20px" }}>
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "5px",
                border: "1px solid #ddd",
                fontSize: "14px"
              }}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p>Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p>No users found</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Header Row */}
              <div style={{
                background: "#1a2d3d",
                border: "1px solid #404d63",
                borderRadius: "6px",
                padding: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "13px",
                fontWeight: "bold",
                color: "#ffc107"
              }}>
                <div style={{ flex: "0 0 13%", paddingRight: "10px" }}>
                  Name
                </div>
                <div style={{ flex: "0 0 20%", paddingRight: "10px" }}>
                  Email
                </div>
                <div style={{ flex: "0 0 12%", paddingRight: "10px" }}>
                  Phone
                </div>
                <div style={{ flex: "0 0 12%", paddingRight: "10px" }}>
                  Gender
                </div>
                <div style={{ flex: "0 0 12%", paddingRight: "10px" }}>
                  City
                </div>
                <div style={{ flex: "0 0 12%", paddingRight: "10px" }}>
                  Country
                </div>
                <div style={{ flex: "0 0 14%" }}>
                  Status
                </div>
              </div>

              {filteredUsers.map((user, index) => (
                <div key={index} style={{
                  background: "#2a3f5f",
                  border: "1px solid #404d63",
                  borderRadius: "6px",
                  padding: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "13px"
                }}>
                  <div style={{ flex: "0 0 13%", paddingRight: "10px" }}>
                    <strong>{user.name}</strong>
                  </div>
                  <div style={{ flex: "0 0 20%", paddingRight: "10px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user.email}
                  </div>
                  <div style={{ flex: "0 0 12%", paddingRight: "10px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user.phone || "N/A"}
                  </div>
                  <div style={{ flex: "0 0 12%", paddingRight: "10px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user.gender || "N/A"}
                  </div>
                  <div style={{ flex: "0 0 12%", paddingRight: "10px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user.city || "N/A"}
                  </div>
                  <div style={{ flex: "0 0 12%", paddingRight: "10px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user.country || "N/A"}
                  </div>
                  <div style={{ flex: "0 0 14%" }}>
                    <span style={{
                      background: user.emailVerified ? "#d4edda" : "#f8d7da",
                      color: user.emailVerified ? "#155724" : "#721c24",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      whiteSpace: "nowrap",
                      display: "inline-block"
                    }}>
                      {user.emailVerified ? "✓ Verified" : "✗ Not Verified"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: "20px" }}>
          <button
            onClick={() => navigate("/admin")}
            style={{
              background: "#6c757d",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            Back to Admin Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminUsers;
