
import { useState, useRef, useEffect } from "react";

import {
  Link,
  useParams,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { supabase } from "../lib/supabase";


function Shop() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_deleted", false)
        .eq("status", "Available")
        .gt("quantity", 0)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching products:", error.message);
        setError("Unable to load products. Please try again.");
      } else {
        setProducts(data);
      }

      setLoading(false);
    }

    fetchProducts();
  }, []);

  let filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || product.category === category;

    return matchesSearch && matchesCategory;
  });

  if (sort === "low-to-high") {
    filteredProducts.sort((a, b) => a.price - b.price);
  }

  if (sort === "high-to-low") {
    filteredProducts.sort((a, b) => b.price - a.price);
  }

  return (
    <div className="shop-page">
      <div className="shop-header">
        <p className="shop-eyebrow">UTM CAMPUS MARKETPLACE</p>
        <h1>Find something you love.</h1>
        <p>Discover everyday essentials from your campus community.</p>
      </div>

      <div className="shop-controls">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="All">All Categories</option>
          <option value="Study Item">Study Item</option>
          <option value="Food">Food</option>
          <option value="Hostel Item">Hostel Item</option>
          <option value="Student Services">Student Services</option>
          <option value="Other">Other</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="default">Sort by</option>
          <option value="low-to-high">Price: Low to High</option>
          <option value="high-to-low">Price: High to Low</option>
        </select>
      </div>

      <div className="shop-results">
        {loading ? (
          <p>Loading products...</p>
        ) : error ? (
          <p>{error}</p>
        ) : (
          <>
            <p>{filteredProducts.length} products found</p>

            <div className="shop-grid">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <Link
                    to={`/product/${product.product_id}`}
                    className="shop-card"
                    key={product.product_id}
                  >
                    <img
                      src={product.product_photo}
                      alt={product.name}
                    />

                    <div className="shop-card-info">
                      <p className="shop-category">{product.category}</p>
                      <h3>{product.name}</h3>
                      <p className="shop-price">
                        RM {Number(product.price).toFixed(2)}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="no-products">
                  <h3>No products found</h3>
                  <p>Try another keyword or category.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}




function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    async function fetchProduct() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("product_id", id)
        .eq("is_deleted", false)
        .eq("status", "Available")
        .maybeSingle();

      if (error) {
        console.error("Error fetching product:", error.message);
      }

      setProduct(data);

if (data) {
  let relatedQuery = supabase
    .from("products")
    .select("*")
    .eq("is_deleted", false)
    .eq("status", "Available")
    .gt("quantity", 0)
    .neq("product_id", data.product_id)
    .limit(4);

  if (data.shop_id) {
    relatedQuery = relatedQuery.eq("shop_id", data.shop_id);
  } else {
    relatedQuery = relatedQuery.eq("category", data.category);
  }

  const { data: relatedData, error: relatedError } =
    await relatedQuery;

  if (relatedError) {
    console.error("Error fetching related products:", relatedError.message);
  }

  setRelatedProducts(relatedData || []);
}

setLoading(false);
    }

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="page-container">
        <h2>Loading product...</h2>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-container">
        <h1>Product not found</h1>
        <Link to="/shop">Back to Shop</Link>
      </div>
    );
  }
}

  
async function addToCart() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    alert("Please log in before adding products to your cart.");
    navigate("/login");
    return;
  }

  const existingCart =
    JSON.parse(localStorage.getItem("cart")) || [];

  const existingItem = existingCart.find(
    (item) => item.id === product.product_id
  );

  if (existingItem) {
    if (existingItem.quantity + quantity > product.quantity) {
      alert("Not enough stock available.");
      return;
    }
    existingItem.quantity += quantity;
  } else {
    existingCart.push({
      id: product.product_id,
      name: product.name,
      price: Number(product.price),
      image: product.product_photo,
      quantity: quantity,
      stock: product.quantity,
    });
  }

  localStorage.setItem("cart", JSON.stringify(existingCart));
  alert("Product added to cart!");
}




 

function Cart() {
  const [cart, setCart] = useState(() => {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  });

  const navigate = useNavigate();

  function updateQuantity(id, newQuantity) {
    const updatedCart = cart.map((item) =>
      item.id === id
        ? { ...item, quantity: newQuantity }
        : item
    );

    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  }

  function removeItem(id) {
    const updatedCart = cart.filter((item) => item.id !== id);

    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  }

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="cart-page">
      <div className="cart-header">
        <p className="shop-eyebrow">YOUR SELECTION</p>
        <h1>Shopping Cart</h1>
        <p>Review your items before checking out.</p>
      </div>

      <div className="cart-container">
        <div className="cart-items">
          {cart.length > 0 ? (
            cart.map((item) => (
              <div className="cart-item" key={item.id}>
                <img
                  src={`/images/${item.image}`}
                  alt={item.name}
                />

                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  <p>RM {item.price.toFixed(2)}</p>

                  <div className="cart-quantity">
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          Math.max(1, item.quantity - 1)
                        )
                      }
                    >
                      −
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          Math.min(item.stock, item.quantity + 1)
                        )
                      }
                    >
                      +
                    </button>
                  </div>

                  <button
                    className="remove-item"
                    onClick={() => removeItem(item.id)}
                  >
                    Remove
                  </button>
                </div>

                <div className="cart-item-total">
                  RM {(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-cart">
              <h2>Your cart is empty</h2>
              <p>Looks like you haven't added anything yet.</p>

              <Link to="/shop" className="continue-shopping">
                Explore Shop →
              </Link>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-summary">
            <h2>Order Summary</h2>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>RM {total.toFixed(2)}</span>
            </div>

            <div className="summary-row">
              <span>Delivery</span>
              <span>RM 0.00</span>
            </div>

            <div className="summary-total">
              <span>Total</span>
              <span>RM {total.toFixed(2)}</span>
            </div>

            <button
              className="checkout-button"
              onClick={() => navigate("/checkout")}
            >
              Proceed to Checkout →
            </button>

            <Link to="/shop" className="continue-link">
              Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Checkout() {
  const navigate = useNavigate();

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  function placeOrder(e) {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Your cart is empty!");
      navigate("/shop");
      return;
    }

    const order = {
      id: Date.now(),
      customerName: name,
      phone: phone,
      location: location,
      notes: notes,
      items: cart,
      total: total,
      date: new Date().toLocaleString(),
      status: "Pending",
    };

    const existingOrders = JSON.parse(
      localStorage.getItem("orders") || "[]"
    );

    existingOrders.push(order);

    localStorage.setItem("orders", JSON.stringify(existingOrders));
    localStorage.setItem("latestOrder", JSON.stringify(order));
    localStorage.removeItem("cart");

    navigate("/order-confirmation");
  }

  if (cart.length === 0) {
    return (
      <div className="page-container">
        <h1>Your cart is empty</h1>
        <Link to="/shop">Back to Shop</Link>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <p className="shop-eyebrow">ALMOST THERE</p>
        <h1>Checkout</h1>
        <p>Confirm your details and arrange your campus handover.</p>
      </div>

      <div className="checkout-container">
        <form className="checkout-form" onSubmit={placeOrder}>
          <h2>Contact Information</h2>

          <label>Full Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label>Phone Number</label>
          <input
            type="tel"
            placeholder="Enter your phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <h2>Handover Details</h2>

          <label>Handover Location</label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          >
            <option value="">Select a location</option>
            <option value="Student Mall">Student Mall</option>
            <option value="Kolej Tun Fatimah">Kolej Tun Fatimah</option>
            <option value="Kolej Rahman Putra">Kolej Rahman Putra</option>
            <option value="Library">Library</option>
            <option value="Faculty">Faculty</option>
            <option value="Other">Other location</option>
          </select>

          <label>Additional Notes (Optional)</label>
          <textarea
            placeholder="Any additional information for the seller..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="4"
          />

          <button type="submit" className="place-order-button">
            Place Order
          </button>
        </form>

        <div className="checkout-summary">
          <h2>Order Summary</h2>

          {cart.map((item) => (
            <div className="checkout-item" key={item.id}>
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>
                RM {(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}

          <div className="checkout-total">
            <span>Total</span>
            <span>RM {total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderConfirmation() {
  const navigate = useNavigate();

  const order = JSON.parse(localStorage.getItem("latestOrder") || "null");

  if (!order) {
    return (
      <div className="page-container">
        <h1>No order found</h1>
        <Link to="/shop">Back to Shop</Link>
      </div>
    );
  }

  return (
    <div className="confirmation-page">
      <div className="confirmation-card">

        <div className="success-icon">✓</div>

        <h1>Order Placed Successfully!</h1>

        <p className="confirmation-message">
          Thank you for your order. Your order has been recorded.
        </p>

        <div className="confirmation-status">
          <span>Order Status</span>
          <strong>{order.status}</strong>
        </div>

        <div className="confirmation-order-id">
          <span>Order ID</span>
          <strong>#{order.id}</strong>
        </div>

        <div className="confirmation-items">
          <h3>Order Summary</h3>

          {order.items.map((item) => (
            <div className="confirmation-item" key={item.id}>
              <span>
                {item.name} × {item.quantity}
              </span>

              <span>
                RM {(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}

          <div className="confirmation-total">
            <span>Total</span>
            <strong>RM {order.total.toFixed(2)}</strong>
          </div>
        </div>

        <div className="confirmation-delivery">
          <h3>Handover Information</h3>

          <p>
            <strong>Name:</strong> {order.customerName}
          </p>

          <p>
            <strong>Phone:</strong> {order.phone}
          </p>

          <p>
            <strong>Location:</strong> {order.location}
          </p>

          {order.notes && (
            <p>
              <strong>Notes:</strong> {order.notes}
            </p>
          )}

          <p>
            <strong>Order Date:</strong> {order.date}
          </p>
        </div>

        <div className="confirmation-buttons">
          <button
            onClick={() => navigate("/orders")}
            className="view-orders-button"
          >
            View My Orders
          </button>

          <button
            onClick={() => navigate("/shop")}
            className="continue-shopping-button"
          >
            Continue Shopping
          </button>
        </div>

      </div>
    </div>
  );
}

function Orders() {
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h1>My Orders</h1>
        <p>Track and manage your purchases.</p>
      </div>

      {orders.length === 0 ? (
        <div className="empty-orders">
          <h2>No orders yet</h2>
          <p>Your orders will appear here after you place an order.</p>
          <Link to="/shop" className="shop-button">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {[...orders].reverse().map((order) => (
           <Link
               to={`/order/${order.id}`}
               className="order-card"
               key={order.id}
           >
              <div className="order-card-header">
                <div>
                  <h3>Order #{String(order.id).slice(-6)}</h3>
                  <p>{order.date}</p>
                </div>

                <span className="order-status">
                  {order.status}
                </span>
              </div>

              <div className="order-card-items">
                {order.items.map((item) => (
                  <div className="order-item" key={item.id}>
                    <img src={item.image} alt={item.name} />

                    <div className="order-item-info">
                      <p>{item.name}</p>
                      <span>Quantity: {item.quantity}</span>
                    </div>

                    <p className="order-item-price">
                      RM {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="order-card-footer">
                <div>
                  <span>Handover Location</span>
                  <p>{order.location}</p>
                </div>

                <div className="order-total">
                  <span>Total</span>
                  <p>RM {order.total.toFixed(2)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const orders = JSON.parse(localStorage.getItem("orders") || "[]");

  const order = orders.find((item) => String(item.id) === String(id));

  if (!order) {
    return (
      <div className="order-details-page">
        <h2>Order Not Found</h2>
        <p>We couldn't find this order.</p>

        <button onClick={() => navigate("/orders")}>
          Back to My Orders
        </button>
      </div>
    );
  }

  return (
    <div className="order-details-page">
      <button
        className="order-back-button"
        onClick={() => navigate("/orders")}
      >
        ← Back to My Orders
      </button>

      <div className="order-details-header">
        <h1>Order Details</h1>
        <span className="order-status">{order.status}</span>
      </div>

      <div className="order-details-card">
        <h3>Order Information</h3>

        <div className="order-info-row">
          <span>Order ID</span>
          <p>#{String(order.id).slice(-6)}</p>
        </div>

        <div className="order-info-row">
          <span>Order Date</span>
          <p>{order.date}</p>
        </div>

        <div className="order-info-row">
          <span>Customer Name</span>
          <p>{order.customerName}</p>
        </div>

        <div className="order-info-row">
          <span>Phone Number</span>
          <p>{order.phone}</p>
        </div>

        <div className="order-info-row">
          <span>Handover Location</span>
          <p>{order.location}</p>
        </div>

        {order.notes && (
          <div className="order-info-row">
            <span>Additional Notes</span>
            <p>{order.notes}</p>
          </div>
        )}
      </div>

      <div className="order-details-card">
        <h3>Items Ordered</h3>

        {order.items.map((item) => (
          <div className="order-detail-item" key={item.id}>
            <img src={item.image} alt={item.name} />

            <div className="order-detail-item-info">
              <h4>{item.name}</h4>
              <p>Quantity: {item.quantity}</p>
              <p>RM {item.price.toFixed(2)} each</p>
            </div>

            <strong>
              RM {(item.price * item.quantity).toFixed(2)}
            </strong>
          </div>
        ))}

        <div className="order-details-total">
          <span>Total Amount</span>
          <strong>RM {order.total.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  );
}

function SellerDashboard() {
  const listings = JSON.parse(
    localStorage.getItem("sellerListings") || "[]"
  );

  const totalListings = listings.length;

  const availableListings = listings.filter(
    (item) => item.status === "Available"
  ).length;

  const totalStock = listings.reduce(
    (sum, item) => sum + Number(item.quantity),
    0
  );

  const totalValue = listings.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );

  return (
    <div className="seller-dashboard">
      <div className="seller-dashboard-header">
        <h1>Seller Dashboard</h1>
        <p>Overview of your selling activities.</p>
      </div>

      <div className="dashboard-stats">
        <div className="dashboard-stat-card">
          <span>Total Listings</span>
          <h2>{totalListings}</h2>
          <p>Products you have listed</p>
        </div>

        <div className="dashboard-stat-card">
          <span>Available Listings</span>
          <h2>{availableListings}</h2>
          <p>Currently available for sale</p>
        </div>

        <div className="dashboard-stat-card">
          <span>Total Stock</span>
          <h2>{totalStock}</h2>
          <p>Total quantity of items</p>
        </div>

        <div className="dashboard-stat-card">
          <span>Total Value</span>
          <h2>RM {totalValue.toFixed(2)}</h2>
          <p>Estimated value of current stock</p>
        </div>
      </div>

      <div className="dashboard-recent-listings">
        <div className="recent-listings-header">
          <h2>Recent Listings</h2>
          <Link to="/my-listings">View All</Link>
        </div>

        {listings.length === 0 ? (
          <div className="dashboard-empty">
            <p>You haven't listed any products yet.</p>
            <Link to="/sell" className="add-listing-button">
              Create Your First Listing
            </Link>
          </div>
        ) : (
          [...listings].reverse().slice(0, 3).map((item) => (
            <div className="dashboard-listing-item" key={item.id}>
              <img src={item.image} alt={item.name} />

              <div className="dashboard-listing-info">
                <h3>{item.name}</h3>
                <p>{item.category}</p>
              </div>

              <div className="dashboard-listing-price">
                <strong>RM {item.price.toFixed(2)}</strong>
                <span>Stock: {item.quantity}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MyListings() {
  const [listings, setListings] = useState(() =>
    JSON.parse(localStorage.getItem("sellerListings") || "[]")
  );

  function deleteListing(id) {
    const confirmed = window.confirm("Are you sure you want to delete this listing?");

    if (!confirmed) return;

    const updatedListings = listings.filter(
      (item) => item.id !== id
    );

    setListings(updatedListings);
    localStorage.setItem("sellerListings", JSON.stringify(updatedListings));
  }

  return (
    <div className="my-listings-page">
      <div className="my-listings-header">
        <div>
          <h1>My Listings</h1>
          <p>Manage the items you are selling.</p>
        </div>

        <Link to="/sell" className="add-listing-button">
          + Add Listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="empty-listings">
          <h2>No listings yet</h2>
          <p>Start selling by creating your first listing.</p>

          <Link to="/sell" className="add-listing-button">
            Create Listing
          </Link>
        </div>
      ) : (
        <div className="my-listings-grid">
          {listings.map((item) => (
            <div className="my-listing-card" key={item.id}>
              <img src={item.image} alt={item.name} />

              <div className="my-listing-info">
                <span className="my-listing-category">
                  {item.category}
                </span>

                <h3>{item.name}</h3>

                <p className="my-listing-price">
                  RM {item.price.toFixed(2)}
                </p>

                <p className="my-listing-stock">
                  Quantity Available: {item.quantity}
                </p>

                <p className="my-listing-location">
                  📍 {item.location}
                </p>

                <span className="listing-status">
                  {item.status}
                </span>

                <button
                  className="delete-listing-button"
                  onClick={() => deleteListing(item.id)}
                >
                  Delete Listing
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ListItem() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Food & Drinks");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("Student Mall");
  const [image, setImage] = useState("/images/drink.jpg");

  function handleSubmit(e) {
    e.preventDefault();

    const newListing = {
      id: Date.now(),
      name,
      category,
      price: Number(price),
      quantity: Number(quantity),
      description,
      location,
      image,
      status: "Available",
      date: new Date().toLocaleString(),
    };

    const listings = JSON.parse(
      localStorage.getItem("sellerListings") || "[]"
    );

    listings.push(newListing);

    localStorage.setItem("sellerListings", JSON.stringify(listings));

    alert("Your listing has been created successfully!");

    navigate("/my-listings");
  }

  return (
    <div className="list-item-page">
      <div className="list-item-header">
        <h1>Create a Listing</h1>
        <p>Sell your items to the UTM campus community.</p>
      </div>

      <form className="listing-form" onSubmit={handleSubmit}>
        <div className="listing-field">
          <label>Product Name</label>
          <input
            type="text"
            placeholder="Enter product name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="listing-field">
          <label>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>Food & Drinks</option>
            <option>Hostel Essentials</option>
            <option>Books & Notes</option>
            <option>Electronics</option>
            <option>Services</option>
            <option>Others</option>
          </select>
        </div>

        <div className="listing-two-columns">
          <div className="listing-field">
            <label>Price (RM)</label>
            <input
              type="number"
              placeholder="0.00"
              min="0.01"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div className="listing-field">
            <label>Quantity Available</label>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="listing-field">
          <label>Description</label>
          <textarea
            placeholder="Describe your product..."
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="listing-field">
          <label>Handover Location</label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          >
            <option>Student Mall</option>
            <option>Kolej Tun Fatimah</option>
            <option>Kolej Rahman Putra</option>
            <option>Library</option>
            <option>Faculty</option>
            <option>Other</option>
          </select>
        </div>

        <div className="listing-field">
          <label>Product Image</label>
          <select
            value={image}
            onChange={(e) => setImage(e.target.value)}
          >
            <option value="/images/drink.jpg">Drink Image</option>
            <option value="/images/cup.jpg">Cup Image</option>
            <option value="/images/throw.jpg">Throw Image</option>
            <option value="/images/lamp.jpg">Lamp Image</option>
          </select>

          <div className="listing-image-preview">
            <img src={image} alt="Product preview" />
          </div>
        </div>

        <button type="submit" className="create-listing-button">
          Publish Listing
        </button>
      </form>
    </div>
  );
}



function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        setErrorMessage("Please log in to view your profile.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("name, email, user_type")
        .eq("auth_user_id", authData.user.id)
        .single();

      if (error) {
        console.error("Profile loading error:", error);
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      setProfile(data);
      setLoading(false);
    }

    loadProfile();
  }, []);

  async function handleLogout() {
    const confirmLogout = window.confirm(
      "Are you sure you want to log out?"
    );

    if (confirmLogout) {
      const { error } = await supabase.auth.signOut();

      if (error) {
        alert(error.message);
        return;
      }

      navigate("/login");
    }
  }

  if (loading) {
    return <div className="profile-page">Loading profile...</div>;
  }

  if (errorMessage) {
    return (
      <div className="profile-page">
        <h2>Unable to Load Profile</h2>
        <p>{errorMessage}</p>
        <Link to="/login">Go to Login</Link>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          <span>
            {profile?.name?.charAt(0).toUpperCase() || "U"}
          </span>
        </div>

        <div>
          <h1>{profile?.name}</h1>
          <p>{profile?.email}</p>
          <p>{profile?.user_type}</p>
        </div>
      </div>

      <section className="profile-section">
        <h2>Explore CampusTrade</h2>

        <div className="profile-menu-grid">
          <Link to="/shop" className="profile-menu-card">
            <div className="profile-menu-icon">🛍️</div>
            <div>
              <h3>Shop</h3>
              <p>Browse products and services</p>
            </div>
            <span>›</span>
          </Link>

          <Link to="/seller" className="profile-menu-card">
            <div className="profile-menu-icon">🏪</div>
            <div>
              <h3>Seller Dashboard</h3>
              <p>Manage your selling activities</p>
            </div>
            <span>›</span>
          </Link>
        </div>
      </section>

      <section className="profile-section">
        <h2>My Account</h2>

        <div className="profile-account-menu">
          <Link to="/orders" className="profile-account-item">
            <span>📦 My Orders</span>
            <span>›</span>
          </Link>

          <Link to="/my-listings" className="profile-account-item">
            <span>🏷️ My Listings</span>
            <span>›</span>
          </Link>

          <Link to="/conversations" className="profile-account-item">
            <span>💬 Conversations</span>
            <span>›</span>
          </Link>
        </div>
      </section>

      <section className="profile-section profile-logout-section">
        <h2>Account Actions</h2>

        <button
          className="profile-logout-button"
          onClick={handleLogout}
        >
          Log Out
        </button>
      </section>
    </div>
  );
}




function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(e) {
  e.preventDefault();

  setLoading(true);
  setErrorMessage("");

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    setErrorMessage(error.message);
    setLoading(false);
    return;
  }

  console.log("Login successful:", data.user);

  setLoading(false);
  navigate("/");
}

  return (
    <div className="login-page">
      <div className="login-container">

        <div className="login-welcome">
          <p className="login-eyebrow">WELCOME TO CAMPUSTRADE</p>
          <h1>Welcome Back!</h1>
          <p>
            Discover, buy and sell with your campus community.
          </p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <h2>Login to Your Account</h2>
          <p className="login-subtitle">
            Enter your details to continue.
          </p>
          {errorMessage && (
           <p style={{ color: "red" }}>{errorMessage}</p>
          )}

          <div className="login-field">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="login-field">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="login-options">
            <label>
              <input type="checkbox" />
              Remember Me
            </label>

            <Link to="/forgot-password">
              Forgot Password?
            </Link>
          </div>

          <button
          type="submit"
          className="login-button"
          disabled={loading}
          >
          {loading ? "Logging in..." : "Login"}
        </button>

          <p className="register-prompt">
            Don't have an account?{" "}
            <Link to="/register">Register</Link>
          </p>
        </form>

      </div>
    </div>
  );
}


function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState("Student");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleRegister(e) {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
    emailRedirectTo: "https://campus-trade-bqpo.vercel.app",
    data: {
      full_name: fullName,
      user_type: userType,
        },
      },
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage(
      "Registration successful! Please check your email to verify your account."
    );

    console.log("Registered user:", data.user);
  }

  return (
    <div className="register-page">
      <div className="register-container">

        <div className="register-welcome">
          <p className="register-eyebrow">JOIN CAMPUSTRADE</p>
          <h1>Start Your Campus Journey!</h1>
          <p>
            Create your account and discover a better way
            to buy, sell and connect with your campus community.
          </p>
        </div>

        <form className="register-form" onSubmit={handleRegister}>
          <h2>Create Account</h2>
          <p className="register-subtitle">
            Fill in your details to get started.
          </p>

          <div className="register-field">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="register-field">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="register-field">
            <label>Account Type</label>
            <select
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
            required
            >
            <option value="Student">Student</option>
            <option value="Campus Vendor">Campus Vendor</option>
            </select>
          </div>

          <div className="register-field">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="register-field">
            <label>Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {errorMessage && (
            <p className="register-error">{errorMessage}</p>
          )}

          {successMessage && (
            <p className="register-success">{successMessage}</p>
          )}

          <button
            type="submit"
            className="register-button"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <p className="register-prompt">
            Already have an account?{" "}
            <Link to="/login">Login</Link>
          </p>
        </form>

      </div>
    </div>
  );
}


function Conversations() {
  const [selectedId, setSelectedId] = useState(1);
  const [message, setMessage] = useState("");
  const [searchContact, setSearchContact] = useState("");
  
  
  const [conversations, setConversations] = useState([
    {
      id: 1,
      name: "Sarah",
      avatar: "S",
      product: "Sparkling Lemon Drink",
      lastMessage: "Is it still available?",
      time: "10:30 AM",
      messages: [
        { id: 1, sender: "them", text: "Hi! Is the lemon drink still available?", time: "10:25 AM" },
        { id: 2, sender: "me", text: "Yes! It is still available.", time: "10:27 AM" },
        { id: 3, sender: "them", text: "Great! Can we meet at Student Mall?", time: "10:30 AM" }
      ]
    },
    {
      id: 2,
      name: "Daniel",
      avatar: "D",
      product: "Art Table Lamp",
      lastMessage: "Thank you!",
      time: "Yesterday",
      messages: [
        { id: 1, sender: "them", text: "Hello, is the lamp still available?", time: "Yesterday" },
        { id: 2, sender: "me", text: "Yes, it is available!", time: "Yesterday" },
        { id: 3, sender: "them", text: "Thank you!", time: "Yesterday" }
      ]
    },
    {
      id: 3,
      name: "Emily",
      avatar: "E",
      product: "Soft Knit Throw",
      lastMessage: "Where can we meet?",
      time: "Monday",
      messages: [
        { id: 1, sender: "them", text: "Hi! I'm interested in the throw.", time: "Monday" },
        { id: 2, sender: "me", text: "Sure! Would Student Mall be convenient?", time: "Monday" },
        { id: 3, sender: "them", text: "Where can we meet?", time: "Monday" }
      ]
    }
  ]);

   const messagesEndRef = useRef(null);

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({
    behavior: "smooth"
  });
}, [selectedId, conversations]);


  const currentConversation = conversations.find(
    (chat) => chat.id === selectedId
  );

  const filteredConversations = conversations.filter((chat) =>
  chat.name.toLowerCase().includes(searchContact.toLowerCase())
);

  function handleSend(e) {
    e.preventDefault();

    if (!message.trim()) return;

    const newMessage = {
      id: Date.now(),
      sender: "me",
      text: message.trim(),
      time: "Now"
    };

    setConversations((previous) =>
      previous.map((chat) =>
        chat.id === selectedId
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              lastMessage: message.trim(),
              time: "Now"
            }
          : chat
      )
    );

    setMessage("");
  }

  return (
    <div className="conversations-page">
      <div className="conversations-heading">
        <h1>Messages</h1>
        <p>Chat with your campus community.</p>
      </div>

      <div className="chat-container">

        {/* Conversation List */}
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <h2>Conversations</h2>
          </div>
        <div className="chat-search">
          <input
          type="text"
          placeholder="Search contacts..."
          value={searchContact}
          onChange={(e) => setSearchContact(e.target.value)}
          />
        </div>

          {filteredConversations.map((chat) => (
            <button
              key={chat.id}
              className={`chat-contact ${
                selectedId === chat.id ? "active" : ""
              }`}
              onClick={() => setSelectedId(chat.id)}
            >
              <div className="chat-avatar">
                {chat.avatar}
              </div>

              <div className="chat-contact-info">
                <h3>{chat.name}</h3>
                <p>{chat.lastMessage}</p>
              </div>

              <span className="chat-time">{chat.time}</span>
            </button>
          ))}
        </div>
        {filteredConversations.length === 0 && (
  <p className="no-contacts">No contacts found.</p>
)}

        {/* Chat Window */}
        <div className="chat-main">
          <div className="chat-header">
            <div className="chat-avatar">
              {currentConversation.avatar}
            </div>

            <div>
              <h3>{currentConversation.name}</h3>
              <p>CampusTrade Member</p>
            </div>
          </div>

          <div className="chat-product-info">
            <span>Discussing:</span>
            <strong>{currentConversation.product}</strong>
          </div>

          <div className="chat-messages">
            {currentConversation.messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message ${msg.sender}`}
              >
                <div className="message-bubble">
                  <p>{msg.text}</p>
                  <span>{msg.time}</span>
                </div>
                <div ref={messagesEndRef} />
              </div>
            ))}
          </div>

          <form className="chat-input-area" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <button type="submit">
              Send
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}


export {
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
  Conversations
};

export async function testSupabaseConnection() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Supabase connection failed:", error.message);
    return;
  }

  console.log("Supabase connection successful!");
  console.log("Products data:", data);
}