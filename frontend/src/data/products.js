// ===== IMPORT ALL IMAGES =====

// BOWLS
import bowl from "../assets/products/bowl.jpg";
import bowl2 from "../assets/products/bowl2.jpg";
import bowlset from "../assets/products/bowlset.jpg";
import bowlset3 from "../assets/products/bowlset3.jpg";
import bowlset4 from "../assets/products/bowlset4.jpg";
import bowlset5 from "../assets/products/bowlset5.jpg";

// PLATES
import plate1 from "../assets/products/plate1.jpg";
import plateset from "../assets/products/plateset.jpg";
import plateset2 from "../assets/products/plateset2.jpg";
import plateset3 from "../assets/products/plateset3.jpg";

// GLASSES
import glass from "../assets/products/glass.jpg";
import glassset from "../assets/products/glassset.jpg";
import glassset1 from "../assets/products/glassset1.jpg";
import glassset2 from "../assets/products/glassset2.jpg";
import glassset3 from "../assets/products/glassset3.jpg";
import glassset4 from "../assets/products/glassset4.jpg";

// CUTLERY
import spoon from "../assets/products/spoon.jpg";
import spoon1 from "../assets/products/spoon1.jpg";
import spoon2 from "../assets/products/spoon2.jpg";
import fork from "../assets/products/fork.jpg";
import fork1 from "../assets/products/fork1.jpg";
import fork2 from "../assets/products/fork2.jpg";


// ===== PRODUCTS ARRAY =====

export const products = [

  // ===== BOWLS =====
  {
    id: 1,
    name: "Stainless Steel Bowl",
    image: bowl,
    category: "bowls",
    price: 149,
    rating: 4.2,
    reviews: 110,
    bought: "500+ bought in past month",
    delivery: "FREE delivery Tomorrow",
    discount: "10% off",
    description: "Durable stainless steel bowl for daily kitchen use."
  },
  {
    id: 2,
    name: "Deep Steel Bowl",
    image: bowl2,
    category: "bowls",
    price: 199,
    rating: 4.4,
    reviews: 140,
    bought: "800+ bought",
    delivery: "FREE delivery Tomorrow",
    discount: "12% off",
    description: "Deep bowl perfect for curries and serving."
  },
  {
    id: 3,
    name: "Steel Bowl Set (6 pcs)",
    image: bowlset,
    category: "bowls",
    price: 499,
    rating: 4.5,
    reviews: 220,
    bought: "1K+ bought",
    delivery: "FREE delivery",
    discount: "20% off",
    description: "Premium stainless steel bowl set for kitchen."
  },
  {
    id: 4,
    name: "Premium Bowl Set",
    image: bowlset3,
    category: "bowls",
    price: 699,
    rating: 4.6,
    reviews: 180,
    bought: "900+ bought",
    delivery: "FREE delivery",
    discount: "25% off",
    description: "High-quality polished bowl set."
  },
  {
    id: 5,
    name: "Heavy Steel Bowl",
    image: bowlset4,
    category: "bowls",
    price: 299,
    rating: 4.3,
    reviews: 90,
    bought: "400+ bought",
    delivery: "FREE delivery",
    discount: "8% off",
    description: "Strong and durable steel bowl."
  },
  {
    id: 6,
    name: "Designer Bowl Set",
    image: bowlset5,
    category: "bowls",
    price: 799,
    rating: 4.7,
    reviews: 260,
    bought: "1.5K+ bought",
    delivery: "FREE delivery",
    discount: "30% off",
    description: "Stylish bowl set for modern kitchen."
  },

  // ===== PLATES =====
  {
    id: 7,
    name: "Steel Plate",
    image: plate1,
    category: "plates",
    price: 199,
    rating: 4.3,
    reviews: 120,
    bought: "1K+ bought",
    delivery: "FREE delivery Tomorrow",
    discount: "15% off",
    description: "High-quality stainless steel plate."
  },
  {
    id: 8,
    name: "Plate Set (6 pcs)",
    image: plateset,
    category: "plates",
    price: 799,
    rating: 4.6,
    reviews: 210,
    bought: "1.2K+ bought",
    delivery: "FREE delivery",
    discount: "25% off",
    description: "Premium plate set for family use."
  },
  {
    id: 9,
    name: "Dinner Plate Set",
    image: plateset2,
    category: "plates",
    price: 999,
    rating: 4.7,
    reviews: 300,
    bought: "2K+ bought",
    delivery: "FREE delivery",
    discount: "30% off",
    description: "Complete dinner plate collection."
  },
  {
    id: 10,
    name: "Heavy Steel Plate",
    image: plateset3,
    category: "plates",
    price: 299,
    rating: 4.2,
    reviews: 80,
    bought: "500+ bought",
    delivery: "FREE delivery",
    discount: "10% off",
    description: "Durable heavy steel plate."
  },

  // ===== GLASSES =====
  {
    id: 11,
    name: "Steel Glass",
    image: glass,
    category: "glasses",
    price: 149,
    rating: 4.2,
    reviews: 100,
    bought: "700+ bought",
    delivery: "FREE delivery",
    discount: "12% off",
    description: "Classic stainless steel glass."
  },
  {
    id: 12,
    name: "Glass Set (6 pcs)",
    image: glassset,
    category: "glasses",
    price: 499,
    rating: 4.5,
    reviews: 180,
    bought: "1K+ bought",
    delivery: "FREE delivery",
    discount: "20% off",
    description: "Premium glass set."
  },
  {
    id: 13,
    name: "Designer Glass Set",
    image: glassset1,
    category: "glasses",
    price: 699,
    rating: 4.6,
    reviews: 210,
    bought: "1.3K+ bought",
    delivery: "FREE delivery",
    discount: "25% off",
    description: "Stylish modern glass set."
  },
  {
    id: 14,
    name: "Tall Steel Glass",
    image: glassset2,
    category: "glasses",
    price: 199,
    rating: 4.3,
    reviews: 90,
    bought: "600+ bought",
    delivery: "FREE delivery",
    discount: "10% off",
    description: "Tall stainless steel glass."
  },
  {
    id: 15,
    name: "Premium Glass Set",
    image: glassset3,
    category: "glasses",
    price: 799,
    rating: 4.7,
    reviews: 250,
    bought: "1.5K+ bought",
    delivery: "FREE delivery",
    discount: "30% off",
    description: "High-quality premium set."
  },
  {
    id: 16,
    name: "Luxury Glass Set",
    image: glassset4,
    category: "glasses",
    price: 999,
    rating: 4.8,
    reviews: 320,
    bought: "2K+ bought",
    delivery: "FREE delivery",
    discount: "35% off",
    description: "Luxury finish glass set."
  },

  // ===== CUTLERY =====
  {
    id: 17,
    name: "Steel Spoon",
    image: spoon,
    category: "cutlery",
    price: 99,
    rating: 4.1,
    reviews: 80,
    bought: "400+ bought",
    delivery: "FREE delivery",
    discount: "5% off",
    description: "Basic steel spoon."
  },
  {
    id: 18,
    name: "Spoon Set",
    image: spoon1,
    category: "cutlery",
    price: 299,
    rating: 4.4,
    reviews: 120,
    bought: "800+ bought",
    delivery: "FREE delivery",
    discount: "15% off",
    description: "Set of stainless steel spoons."
  },
  {
    id: 19,
    name: "Premium Spoon Set",
    image: spoon2,
    category: "cutlery",
    price: 499,
    rating: 4.6,
    reviews: 200,
    bought: "1K+ bought",
    delivery: "FREE delivery",
    discount: "25% off",
    description: "Premium spoon collection."
  },
  {
    id: 20,
    name: "Steel Fork",
    image: fork,
    category: "cutlery",
    price: 99,
    rating: 4.2,
    reviews: 70,
    bought: "300+ bought",
    delivery: "FREE delivery",
    discount: "5% off",
    description: "Durable steel fork."
  },
  {
    id: 21,
    name: "Fork Set",
    image: fork1,
    category: "cutlery",
    price: 299,
    rating: 4.5,
    reviews: 150,
    bought: "900+ bought",
    delivery: "FREE delivery",
    discount: "20% off",
    description: "Set of stainless steel forks."
  },
  {
    id: 22,
    name: "Premium Fork Set",
    image: fork2,
    category: "cutlery",
    price: 499,
    rating: 4.7,
    reviews: 230,
    bought: "1.4K+ bought",
    delivery: "FREE delivery",
    discount: "30% off",
    description: "Luxury fork set."
  }
];