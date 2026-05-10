import { useNavigate } from "react-router-dom";
import "./ProductCard.css";

function ProductCard({ product }) {
  const navigate = useNavigate();

  return (
    <div
      className="product-card"
      onClick={() => navigate(`/product/${product._id}`)}  // ✅ FIXED _id
      style={{ cursor: "pointer" }}
    >

      {/* IMAGE */}
      <img
        src={product.images?.[0] || "https://via.placeholder.com/150"} // ✅ FIXED
        alt={product.name}
        onError={(e) => {
          e.target.src = "https://via.placeholder.com/150?text=Product+Image";
        }}
      />

      {/* TITLE */}
      <h3>{product.name}</h3>

      {/* RATING */}
      <p className="rating">
        ⭐ {product.rating} ({product.reviews})
      </p>

      {/* PRICE INFO */}
      {product.discountPercent ? (
        <div className="discount-details">
          <p className="old-price">₹{product.price}</p>

          <p className="offer-price">
            ₹{(product.price * (1 - product.discountPercent / 100)).toFixed(0)}
          </p>

          <p className="discount-tag">
            {product.discountPercent}% OFF
          </p>
        </div>
      ) : (
        <p className="price">₹{product.price}</p>
      )}

      {/* DELIVERY */}
      <p className="delivery">Free delivery</p>

      {/* BUTTON */}
      <button
        className="cart-btn"
        onClick={(event) => {
          event.stopPropagation(); // ✅ prevent card click
          navigate(`/product/${product._id}`); // ✅ FIXED
        }}
      >
        Add to Cart
      </button>

    </div>
  );
}

export default ProductCard;