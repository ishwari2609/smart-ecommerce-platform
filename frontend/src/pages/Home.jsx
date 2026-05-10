import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import "./Home.css";

/* ===== BANNERS ===== */
import banner1 from "../assets/banners/banner1.jpg";
import banner2 from "../assets/banners/banner2.jpg";
import banner3 from "../assets/banners/banner3.jpg";

/* ===== PRODUCT IMAGES ===== */

// Bowls
import bowl from "../assets/products/bowl.jpg";
import bowl2 from "../assets/products/bowl2.jpg";
import bowlset3 from "../assets/products/bowlset3.jpg";
import bowlset4 from "../assets/products/bowlset4.jpg";

// Plates
import plate1 from "../assets/products/plate1.jpg";
import plateset from "../assets/products/plateset.jpg";
import plateset2 from "../assets/products/plateset2.jpg";
import plateset3 from "../assets/products/plateset3.jpg";

// Glasses
import glass from "../assets/products/glass.jpg";
import glassset from "../assets/products/glassset.jpg";
import glassset1 from "../assets/products/glassset1.jpg";
import glassset2 from "../assets/products/glassset2.jpg";

// Cutlery
import spoon from "../assets/products/spoon.jpg";
import spoon1 from "../assets/products/spoon1.jpg";
import fork from "../assets/products/fork.jpg";
import fork1 from "../assets/products/fork1.jpg";

// Kitchen Sets
import bowlset from "../assets/products/bowlset.jpg";
import bowlset5 from "../assets/products/bowlset5.jpg";
import glassset3 from "../assets/products/glassset3.jpg";
import glassset4 from "../assets/products/glassset4.jpg";

function Home() {
  return (
    <>
      <Navbar />

      {/* ===== SLIDER ===== */}
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        autoplay={{ delay: 3500 }}
        pagination={{ clickable: true }}
        navigation={true}
        loop={true}
        className="homeSwiper"
      >
        <SwiperSlide>
          <div className="slide" style={{ backgroundImage: `url(${banner1})` }}>
            <div className="overlay">
              <h1>Kitchen Essentials Sale 🔥</h1>
              <p>Up to 50% OFF on Bowls & Plates</p>
            </div>
          </div>
        </SwiperSlide>

        <SwiperSlide>
          <div className="slide" style={{ backgroundImage: `url(${banner2})` }}>
            <div className="overlay">
              <h1>Premium Steel Collection ✨</h1>
              <p>Elegant & Durable Kitchenware</p>
            </div>
          </div>
        </SwiperSlide>

        <SwiperSlide>
          <div className="slide" style={{ backgroundImage: `url(${banner3})` }}>
            <div className="overlay">
              <h1>Combo Kitchen Sets 🛒</h1>
              <p>Buy More & Save More</p>
            </div>
          </div>
        </SwiperSlide>
      </Swiper>

      {/* ===== CATEGORY SECTIONS ===== */}
      <div className="home-sections">
        {sectionsData.map((section, index) => (
          <div className="section-card" key={index}>
            <h2>{section.title}</h2>

            <div className="section-grid">
              {section.images.map((img, i) => (
                <div key={i}>
                  <img src={img} alt={section.title} />
                </div>
              ))}
            </div>

            <Link to={section.link} className="section-link">
              Explore more
            </Link>
          </div>
        ))}
      </div>

      <Footer />
    </>
  );
}

/* ===== DATA ===== */
const sectionsData = [
  {
    title: "Bowls",
    link: "/category/bowls",
    images: [bowl, bowl2, bowlset3, bowlset4]
  },
  {
    title: "Plates",
    link: "/category/plates",
    images: [plate1, plateset, plateset2, plateset3]
  },
  {
    title: "Glasses",
    link: "/category/glasses",
    images: [glass, glassset, glassset1, glassset2]
  },
  {
    title: "Cutlery",
    link: "/category/cutlery",
    images: [spoon, spoon1, fork, fork1]
  },
  {
    title: "Kitchen Sets",
    link: "/category/sets",
    images: [bowlset, bowlset5, glassset3, glassset4]
  },
  {
    title: "All Products",
    link: "/category/all",
    images: [bowl, plate1, glass, spoon]
  }
];

export default Home;