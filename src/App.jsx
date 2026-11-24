import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import "./App.css";
import { Routes, Route, Link, BrowserRouter, useNavigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import {
  Shop,
  ProductDetails,
  Cart,
  Checkout,
  OrderConfirmation,
  Orders,
  OrderDetails,
  SellerDashboard,
  MyListings,
  ListItem,
  Profile,
  Login,
  Register,
  Conversations,
  CreateShop,
  MyShop,
} from "./pages/Pages-temp"

function Hero() {
  return (
    <section className="hero">
      <div className="hero-text">
        <p className="welcome">WELCOME TO THE</p>

        <h1>
          UTM CAMPUS
          <br />
          TRADE
        </h1>

        <p className="hero-description">
          Discover products and services within your campus community.
          Buy, sell, and connect with fellow students — all in one place.
        </p>

        <div className="hero-buttons">
          <Link to="/shop" className="explore-button">
            Explore →
          </Link>

          <Link to="/sell" className="sell-button">
            Start Selling →
          </Link>
        </div>
      </div>

      <div className="hero-image">
        <img
          src="/images/campus-hero.png"
          alt="Campus student lifestyle"
        />
      </div>
    </section>
  );
}




function SearchBar() {
  return (
    <section className="seasonal-section">
      <div className="seasonal-content">
        <div className="seasonal-text">
          <p className="seasonal-eyebrow">
            CAMPUS HIGHLIGHTS
          </p>

          <h2>Seasonal & Viral Picks</h2>

          <p>
            Discover what's popular and trending
            around your campus.
          </p>

          <Link to="/shop" className="seasonal-button">
            Explore Picks →
          </Link>
        </div>

        <div className="seasonal-image">
          <img
            src="/images/student-services.jpg"
            alt="Campus Seasonal Picks"
          />
        </div>
      </div>
    </section>
  );
}





function ProductSection() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_deleted", false)
        .eq("status", "Available")
        .gt("quantity", 0)
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) {
        console.error("Error fetching home products:", error.message);
      } else {
        setProducts(data || []);
      }

      setLoading(false);
    }

    fetchProducts();
  }, []);

  return (
    <section className="products-section" id="products">
      <div className="section-heading">
        <div>
          <h2>Recommended for you</h2>
          <p>Good things find a place in your daily life.</p>
        </div>

        <Link to="/shop">Shop all objects →</Link>
      </div>

      {loading ? (
        <p>Loading products...</p>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <Link
              to={`/product/${product.product_id}`}
              className="product-card"
              key={product.product_id}
            >
              <img
                src={product.product_photo}
                alt={product.name}
              />

              <h3>{product.name}</h3>

              <p>
                RM {Number(product.price).toFixed(2)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}


function ServicesSection() {
  return (
    <section className="services-section">
      <div className="services-content">
        <div className="service-text">
          <h2>Student Services</h2>
          <p>
            More than just products. Discover useful services
            offered by fellow students around campus.
          </p>
          <Link to="/shop" className="services-button">
            Explore Services
          </Link>
        </div>

        <div className="services-image">
          <img
            src="/images/student-service.jpg"
            alt="Student Services"
          />
        </div>
      </div>
    </section>
  );
}


function HomePage() {
  return (
    <>
      <Hero />
      <SearchBar />
      <ProductSection />
      <ServicesSection />
    </>
  );
}

      function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-confirmation" element={<OrderConfirmation />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/order/:id" element={<OrderDetails />} />
        <Route path="/seller" element={<SellerDashboard />} />
        <Route path="/my-listings" element={<MyListings />} />
        <Route path="/sell" element={<ListItem />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/conversations" element={<Conversations />} />
        <Route path="/create-shop" element={<CreateShop />} />
        <Route path="/my-shop" element={<MyShop />} />
      </Routes>

      <Footer />
    </>
  );
}


export default App;
