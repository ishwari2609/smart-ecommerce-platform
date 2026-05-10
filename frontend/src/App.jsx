import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminRegister from "./pages/AdminRegister";
import Category from "./pages/Category";
import AdminProducts from "./pages/AdminProducts";
import AdminUsers from "./pages/AdminUsers";
import AdminOrders from "./pages/AdminOrders";
import VerifyOTP from "./pages/VerifyOTP";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Admin from "./pages/Admin";
import Wishlist from "./pages/Wishlist";
import UserProfile from "./pages/UserProfile";
import Recommendations from "./pages/Recommendations";
import AdminRecommendations from "./pages/AdminRecommendations";

// Protected Route Component
const ProtectedAdminRoute = ({ element }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  
  if (!token || role !== "admin") {
    return <Navigate to="/admin-login" replace />;
  }
  
  return element;
};

const ProtectedCustomerRoute = ({ element }) => {
  const token = localStorage.getItem("token");
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return element;
};

// Strict role-based separation
const ProtectedStrictCustomerRoute = ({ element }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  
  if (!token || role !== "customer") {
    // Silently redirect - no logging needed, this is normal route protection
    return <Navigate to="/login" replace />;
  }
  
  return element;
};

const ProtectedStrictAdminRoute = ({ element }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  
  if (!token || role !== "admin") {
    // Silently redirect - no logging needed, this is normal route protection
    return <Navigate to="/admin-login" replace />;
  }
  
  return element;
};

function App() {
  const [authChecked, setAuthChecked] = useState(false);
  
  // Check authentication on app load
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const email = localStorage.getItem("userEmail");
    
    // Debug log
    if (token && role && email) {
      console.log(`✅ Auth persisted: ${email} (${role})`);
    }
    
    setAuthChecked(true);
  }, []);

  if (!authChecked) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin-login" element={<Login adminOnly />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin-register" element={<AdminRegister />} />
      <Route path="/category/:name" element={<ProtectedStrictCustomerRoute element={<Category />} />} />
      <Route path="/product/:id" element={<ProtectedStrictCustomerRoute element={<ProductDetails />} />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/cart" element={<ProtectedStrictCustomerRoute element={<Cart />} />} />
      <Route path="/checkout" element={<ProtectedStrictCustomerRoute element={<Checkout />} />} />
      <Route path="/orders" element={<ProtectedStrictCustomerRoute element={<Orders />} />} />
      <Route path="/wishlist" element={<ProtectedStrictCustomerRoute element={<Wishlist />} />} />
      <Route path="/recommendations" element={<ProtectedStrictCustomerRoute element={<Recommendations />} />} />
      <Route path="/profile" element={<ProtectedStrictCustomerRoute element={<UserProfile />} />} />
      <Route path="/admin" element={<ProtectedStrictAdminRoute element={<Admin />} />} />
      <Route path="/admin/products" element={<ProtectedStrictAdminRoute element={<AdminProducts />} />} />
      <Route path="/admin/users" element={<ProtectedStrictAdminRoute element={<AdminUsers />} />} />
      <Route path="/admin/orders" element={<ProtectedStrictAdminRoute element={<AdminOrders />} />} />
      <Route path="/admin/recommendations" element={<ProtectedStrictAdminRoute element={<AdminRecommendations />} />} />
    </Routes>
  );
}

export default App;
