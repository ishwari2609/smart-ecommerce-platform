import { useState } from "react";
import "./ImageGallery.css";

function ImageGallery({ images }) {
  const validImages = Array.isArray(images) && images.length > 0 ? images : ["https://via.placeholder.com/500?text=Product+Image"];
  const [mainImage, setMainImage] = useState(validImages[0]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleThumbnailClick = (img, index) => {
    setMainImage(img);
    setSelectedIndex(index);
  };

  return (
    <div className="image-gallery-container">
      <div className="main-image-wrapper">
        <img 
          src={mainImage} 
          className="main-image" 
          alt="Product"
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/500?text=Product+Image";
          }}
        />
      </div>

      {validImages.length > 1 && (
        <div className="thumbnail-row">
          {validImages.map((img, index) => (
            <div
              key={index}
              className={`thumbnail-wrapper ${selectedIndex === index ? "active" : ""}`}
              onClick={() => handleThumbnailClick(img, index)}
            >
              <img
                src={img}
                className="thumbnail"
                alt={`Product ${index + 1}`}
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/100?text=Thumb";
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageGallery;