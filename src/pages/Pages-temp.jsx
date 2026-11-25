
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
  .select(`
  *,
  shops:shops!products_shop_id_fkey (
    shop_id,
    shop_name,
    shop_photo
  )
`)
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
          console.error(
            "Error fetching related products:",
            relatedError.message
          );
        }

        setRelatedProducts(relatedData || []);
      }

      setLoading(false);
    }

    fetchProduct();
  }, [id]);

  async function addToCart() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    alert("Please log in before adding products to your cart.");
    navigate("/login");
    return;
  }

  if (!product.seller_id) {
    alert("Seller information is missing from this product.");
    return;
  }

  const existingCart =
    JSON.parse(localStorage.getItem("cart") || "[]");

  const existingItem = existingCart.find(
    (item) => item.id === product.product_id
  );

  if (existingItem) {
    if (existingItem.quantity + quantity > product.quantity) {
      alert("Not enough stock available.");
      return;
    }

    existingItem.quantity += quantity;
    existingItem.seller_id = product.seller_id;
    existingItem.shop_id = product.shop_id || null;
  } else {
    if (quantity > product.quantity) {
      alert("Not enough stock available.");
      return;
    }

    existingCart.push({
      id: product.product_id,
      name: product.name,
      price: Number(product.price),
      image: product.product_photo,
      quantity: quantity,
      stock: product.quantity,
      seller_id: product.seller_id,
      shop_id: product.shop_id || null,
    });
  }

  localStorage.setItem("cart", JSON.stringify(existingCart));
  console.log("Saved cart:", existingCart);
  alert("Product added to cart!");
}

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

  return (
    <div className="product-details-page">
      <Link to="/shop" className="back-link">
        ← Back to Shop
      </Link>

      <div className="product-details-container">
        <div className="product-details-image">
          <img
            src={product.product_photo}
            alt={product.name}
          />
        </div>

        <div className="product-details-info">
          <p className="product-details-category">
            {product.category}
          </p>

          <h1>{product.name}</h1>

          {product.shops && (
  <p className="product-shop-name">
    Sold by:{" "}
    <Link to={`/shop/${product.shops.shop_id}`}>
      {product.shops.shop_name}
    </Link>
  </p>
)}

          <p className="product-details-price">
            RM {Number(product.price).toFixed(2)}
          </p>

          <p className="product-description">
            {product.description || "No description available."}
          </p>

          <p className="product-stock">
            {product.quantity} available
          </p>

          <div className="quantity-control">
            <button
              onClick={() =>
                setQuantity((previous) => Math.max(1, previous - 1))
              }
            >
              -
            </button>

            <span>{quantity}</span>

            <button
              onClick={() =>
                setQuantity((previous) =>
                  Math.min(product.quantity, previous + 1)
                )
              }
            >
              +
            </button>
          </div>

          <button
            className="add-cart-button"
            onClick={addToCart}
          >
            Add to Cart
          </button>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="related-products-section">
          <h2>You May Also Like</h2>

          <div className="shop-grid">
            {relatedProducts.map((item) => (
              <Link
                to={`/product/${item.product_id}`}
                className="shop-card"
                key={item.product_id}
              >
                <img
                  src={item.product_photo}
                  alt={item.name}
                />

                <div className="shop-card-info">
                  <p className="shop-category">
                    {item.category}
                  </p>

                  <h3>{item.name}</h3>

                  <p className="shop-price">
                    RM {Number(item.price).toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

  
async function addToCart() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    alert("Please log in before adding products to your cart.");
    navigate("/login");
    return;
  }

  if (!product.seller_id) {
    alert("Seller information is missing from this product.");
    return;
  }

  const existingCart =
    JSON.parse(localStorage.getItem("cart") || "[]");

  const existingItem = existingCart.find(
    (item) => item.id === product.product_id
  );

  if (existingItem) {
    if (existingItem.quantity + quantity > product.quantity) {
      alert("Not enough stock available.");
      return;
    }

    existingItem.quantity += quantity;
    existingItem.seller_id = product.seller_id;
    existingItem.shop_id = product.shop_id || null;
  } else {
    if (quantity > product.quantity) {
      alert("Not enough stock available.");
      return;
    }

    existingCart.push({
      id: product.product_id,
      name: product.name,
      price: Number(product.price),
      image: product.product_photo,
      quantity: quantity,
      stock: product.quantity,
      seller_id: product.seller_id,
      shop_id: product.shop_id || null,
    });
  }

  localStorage.setItem("cart", JSON.stringify(existingCart));
  console.log("Saved cart:", existingCart);
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
  const [fulfillmentMethod, setFulfillmentMethod] = useState("Pickup");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function placeOrder(e) {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Your cart is empty!");
      navigate("/shop");
      return;
    }

    // Check whether every cart item has seller information
    if (cart.some((item) => !item.seller_id)) {
      alert(
        "Some cart items are missing seller information. Please remove them and add the products again."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Get the currently logged-in buyer
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        alert("Please log in before placing an order.");
        navigate("/login");
        return;
      }

      // 2. Get the buyer's user_id from the users table
      const { data: buyer, error: buyerError } = await supabase
        .from("users")
        .select("user_id")
        .eq("auth_user_id", authData.user.id)
        .eq("account_status", "Active")
        .maybeSingle();

      if (buyerError || !buyer) {
        alert("Unable to find your active user profile.");
        return;
      }

      // 3. Group cart items by seller
      const sellerGroups = Object.values(
        cart.reduce((groups, item) => {
          if (!groups[item.seller_id]) {
            groups[item.seller_id] = {
              seller_id: item.seller_id,
              shop_id: item.shop_id || null,
              items: [],
            };
          }

          groups[item.seller_id].items.push(item);

          return groups;
        }, {})
      );


      // 暂时加入这两行
console.log("Buyer ID:", buyer.user_id);
console.log("Seller Groups:", sellerGroups);

      // 4. Create one order for each seller
      const createdOrders = [];

      for (const group of sellerGroups) {
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            buyer_id: buyer.user_id,
            seller_id: group.seller_id,
            shop_id: group.shop_id,
            buyer_name: name,
            buyer_phone: phone,
            fulfillment_method: fulfillmentMethod,
            handover_location: location,
            notes: notes,
            status: "Pending",
          })
          .select("order_id")
          .single();

        if (orderError) {
          console.error("Order creation error:", orderError.message);
          throw new Error(orderError.message);
        }

        // 5. Save the products in order_items
        const orderItems = group.items.map((item) => ({
          order_id: order.order_id,
          product_id: item.id,
          product_name: item.name,
          product_photo_at_purchase: item.image,
          quantity: item.quantity,
          price_at_purchase: item.price,
          seller_id: group.seller_id,
        }));

        const { error: itemsError } = await supabase
        .from("order_items")
         .insert(orderItems);

        if (itemsError) {
          console.error("Order items full error:", itemsError);
          console.error("Order items data:", orderItems);
          throw new Error(itemsError.message);
        }
        
        // 6. Calculate payment amount for this seller
const paymentAmount = group.items.reduce(
  (sum, item) => sum + Number(item.price) * item.quantity,
  0
);

// 7. Create payment record
const { error: paymentError } = await supabase
  .from("payments")
  .insert({
    order_id: order.order_id,
    amount: paymentAmount,
    payment_method: "DuitNow",
    payment_status: "Awaiting Payment",
  });

if (paymentError) {
  console.error("Payment creation error:", paymentError);
  throw new Error(paymentError.message);
}

        createdOrders.push(order);
      }

      // 6. Save a summary for the existing confirmation page
      const confirmation = {
        id: createdOrders[0].order_id,
        customerName: name,
        phone: phone,
        location: location,
        fulfillmentMethod: fulfillmentMethod,
        notes: notes,
        items: cart,
        total: total,
        date: new Date().toLocaleString(),
        status: "Pending",
        orderCount: createdOrders.length,
      };

      localStorage.setItem(
        "latestOrder",
        JSON.stringify(confirmation)
      );

      // 7. Clear the cart
      localStorage.removeItem("cart");

      alert("Your order has been placed successfully!");

      navigate("/order-confirmation");
    } catch (error) {
      console.error("Checkout error:", error);
      alert(
        "Unable to complete your order: " + error.message
      );
    } finally {
      setIsSubmitting(false);
    }
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

          <label>Fulfillment Method</label>
          <select
            value={fulfillmentMethod}
            onChange={(e) => setFulfillmentMethod(e.target.value)}
            required
          >
            <option value="Pickup">Pickup</option>
            <option value="Delivery">Delivery</option>
          </select>

          <label>
            {fulfillmentMethod === "Pickup"
              ? "Pickup Location"
              : "Delivery Location"}
          </label>

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

          <button
            type="submit"
            className="place-order-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Placing Order..." : "Place Order"}
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
  onClick={() => navigate(`/order/${order.id}`)}
  className="view-orders-button"
>
  Proceed to Payment
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
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        // 1. Get the logged-in user
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError || !authData.user) {
          navigate("/login");
          return;
        }

        // 2. Get the buyer's user_id
        const { data: buyer, error: buyerError } = await supabase
          .from("users")
          .select("user_id")
          .eq("auth_user_id", authData.user.id)
          .eq("account_status", "Active")
          .maybeSingle();

        if (buyerError || !buyer) {
          throw new Error("Unable to find your user profile.");
        }

        // 3. Fetch orders and their order items
        
const { data, error } = await supabase
  .from("orders")
  .select(`
    *,
    order_items!order_items_order_id_fkey(*),
    payments (
      payment_id,
      amount,
      payment_status,
      refunds (
        refund_id,
        refund_amount,
        refund_status,
        reason,
        requested_at,
        completed_at,
        proof_url
      )
    )
  `)
  .eq("buyer_id", buyer.user_id)
  .order("created_at", { ascending: false });


        if (error) {
          throw error;
        }

       
const ordersWithRefundUrls = await Promise.all(
  (data || []).map(async (order) => {
    const payment = order.payments?.[0];
    const refund = payment?.refunds?.[0];

    if (!refund?.proof_url) {
      return order;
    }

    const { data: signedData, error: signedError } =
      await supabase.storage
        .from("refund-receipts")
        .createSignedUrl(refund.proof_url, 60 * 60);

    if (signedError) {
      console.error(
        "Refund receipt URL error:",
        signedError
      );
      return order;
    }

    return {
      ...order,
      payments: [
        {
          ...payment,
          refunds: [
            {
              ...refund,
              proofSignedUrl: signedData.signedUrl,
            },
          ],
        },
      ],
    };
  })
);

setOrders(ordersWithRefundUrls);

      } catch (error) {
        console.error("Fetch orders error:", error);
        alert("Unable to load your orders: " + error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [navigate]);

  if (loading) {
    return <div className="orders-page">Loading your orders...</div>;
  }

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
          {orders.map((order) => {
            const orderItems = order.order_items || [];

            const orderTotal = orderItems.reduce(
              (sum, item) =>
                sum + Number(item.price_at_purchase) * item.quantity,
              0
            );

            return (
              <Link
                to={`/order/${order.order_id}`}
                className="order-card"
                key={order.order_id}
              >
                <div className="order-card-header">
                  <div>
                    <h3>
                      Order #{String(order.order_id).slice(-6)}
                    </h3>
                    <p>
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>

                  <span className="order-status">
                    {order.status}
                  </span>


{order.status === "Cancelled" &&
  order.payments?.[0]?.refunds?.[0] && (
    <div className="buyer-refund-info">
      <h4>Refund Information</h4>

      <p>
        <strong>Refund Amount:</strong>{" "}
        RM{" "}
        {Number(
          order.payments[0].refunds[0].refund_amount
        ).toFixed(2)}
      </p>

      <p>
        <strong>Reason:</strong>{" "}
        {order.payments[0].refunds[0].reason}
      </p>

      <p>
        <strong>Refund Status:</strong>{" "}
        {order.payments[0].refunds[0].refund_status}
      </p>


{order.payments[0].refunds[0].proofSignedUrl && (
  <p>
    <strong>Refund Receipt:</strong>{" "}
    <a
      href={order.payments[0].refunds[0].proofSignedUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
    >
      View Refund Receipt
    </a>
  </p>
)}


      {order.payments[0].refunds[0].completed_at && (
        <p>
          <strong>Completed At:</strong>{" "}
          {new Date(
            order.payments[0].refunds[0].completed_at
          ).toLocaleString()}
        </p>
      )}
    </div>
  )}


                </div>

                <div className="order-card-items">
                  {orderItems.map((item) => (
                    <div
                      className="order-item"
                      key={item.order_item_id}
                    >
                      <img
                        src={item.product_photo_at_purchase}
                        alt={item.product_name}
                      />

                      <div className="order-item-info">
                        <p>{item.product_name}</p>
                        <span>Quantity: {item.quantity}</span>
                      </div>

                      <p className="order-item-price">
                        RM{" "}
                        {(
                          Number(item.price_at_purchase) *
                          item.quantity
                        ).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="order-card-footer">
                  <div>
                    <span>Handover Location</span>
                    <p>{order.handover_location}</p>
                  </div>

                  <div className="order-total">
                    <span>Total</span>
                    <p>RM {orderTotal.toFixed(2)}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}



function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [updating, setUpdating] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function fetchOrderDetails() {
      try {
        setLoading(true);
        setErrorMessage("");

        // 1. Get logged-in user
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError) throw authError;

        if (!authData.user) {
          navigate("/login");
          return;
        }

        // 2. Find buyer's user_id
        const { data: buyer, error: buyerError } = await supabase
          .from("users")
          .select("user_id")
          .eq("auth_user_id", authData.user.id)
          .eq("account_status", "Active")
          .single();

        if (buyerError) throw buyerError;

        
// 3. Get this buyer's order from Supabase
const { data, error } = await supabase
  .from("orders")
  .select(`
    *,
    order_items!order_items_order_id_fkey(*),
    shops!orders_shop_id_fkey (
      shop_name,
      duitnow_qr_url
    ),
    payments (
      payment_id,
      amount,
      payment_method,
      payment_status,
      receipt_url,
      submitted_at,
      verified_at
    )
  `)
  .eq("order_id", id)
  .eq("buyer_id", buyer.user_id)
  .single();

if (error) throw error;

setOrder(data);

      } catch (error) {
        console.error("Fetch order details error:", error);
        setErrorMessage(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchOrderDetails();
  }, [id, navigate]);

  async function confirmReceived() {
  const confirmed = window.confirm(
    "Have you received your order? Please confirm only after receiving all items."
  );

  if (!confirmed) return;

  try {
    setUpdating(true);

    const { error } = await supabase
      .from("orders")
      .update({ status: "Completed" })
      .eq("order_id", id);

    if (error) throw error;

    setOrder((currentOrder) => ({
      ...currentOrder,
      status: "Completed",
    }));

  } catch (error) {
    console.error("Confirm received error:", error);
    alert("Unable to confirm order: " + error.message);
  } finally {
    setUpdating(false);
  }
}


async function uploadReceipt() {
  if (!selectedFile) {
    alert("Please select a receipt image first.");
    return;
  }

  if (!payment) {
    alert("Payment record not found.");
    return;
  }

  // Only allow image files
  if (!selectedFile.type.startsWith("image/")) {
    alert("Please select an image file.");
    return;
  }

  // Limit image size to 5MB
  if (selectedFile.size > 5 * 1024 * 1024) {
    alert("Image size must be less than 5MB.");
    return;
  }

  try {
    setUploading(true);

    // 1. Get logged-in user
    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError) throw authError;
    if (!authData.user) throw new Error("Please log in again.");

    // 2. Create a unique file path
    const fileExt = selectedFile.name.split(".").pop();
    const filePath =
      `${authData.user.id}/${id}/receipt-${Date.now()}.${fileExt}`;

    // 3. Upload image to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("payment-receipts")
      .upload(filePath, selectedFile, {
        upsert: false,
        contentType: selectedFile.type,
      });

    if (uploadError) throw uploadError;

    // 4. Update payment record
    const { data: updatedPayment, error: paymentError } = await supabase
      .from("payments")
      .update({
        receipt_url: filePath,
        submitted_at: new Date().toISOString(),
        payment_status: "Verification Pending",
        verified_at: null,
      })
      .eq("payment_id", payment.payment_id)
      .select()
      .single();

    if (paymentError) {
      // Remove uploaded image if database update fails
      await supabase.storage
        .from("payment-receipts")
        .remove([filePath]);

      throw paymentError;
    }

    // 5. Update local page state
    setOrder((currentOrder) => ({
      ...currentOrder,
      payments: [updatedPayment],
    }));

    setSelectedFile(null);

    alert("Receipt uploaded successfully!");
  } catch (error) {
    console.error("Upload receipt error:", error);
    alert("Unable to upload receipt: " + error.message);
  } finally {
    setUploading(false);
  }
}


  if (loading) {
    return (
      <div className="order-details-page">
        Loading order details...
      </div>
    );
  }

  if (errorMessage || !order) {
    return (
      <div className="order-details-page">
        <h2>Order Not Found</h2>
        <p>{errorMessage || "We couldn't find this order."}</p>

        <button onClick={() => navigate("/orders")}>
          Back to My Orders
        </button>
      </div>
    );
  }

  const orderItems = order.order_items || [];
  const payment = order.payments?.[0] || null;
  const shop = order.shops || null;

  const total = orderItems.reduce(
    (sum, item) =>
      sum + Number(item.price_at_purchase) * item.quantity,
    0
  );

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

      {["Ready for Pickup", "Out for Delivery"].includes(order.status) && (
  <div className="confirm-received-section">
    <p>
      Have you received your order? Confirm once you have received all items.
    </p>

    <button
      onClick={confirmReceived}
      disabled={updating}
    >
      {updating ? "Confirming..." : "Confirm Received"}
    </button>
  </div>
)}

      <div className="order-details-card">
        <h3>Order Information</h3>

        <div className="order-info-row">
          <span>Order ID</span>
          <p>#{order.order_id.slice(-6)}</p>
        </div>

        <div className="order-info-row">
          <span>Order Date</span>
          <p>{new Date(order.created_at).toLocaleString()}</p>
        </div>

        <div className="order-info-row">
          <span>Customer Name</span>
          <p>{order.buyer_name || "Not provided"}</p>
        </div>

        <div className="order-info-row">
          <span>Phone Number</span>
          <p>{order.buyer_phone || "Not provided"}</p>
        </div>

        <div className="order-info-row">
          <span>Fulfillment Method</span>
          <p>{order.fulfillment_method}</p>
        </div>

        <div className="order-info-row">
          <span>Handover Location</span>
          <p>{order.handover_location || "Not provided"}</p>
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

        {orderItems.map((item) => (
          <div
            className="order-detail-item"
            key={item.order_item_id}
          >
            {item.product_photo_at_purchase && (
              <img
                src={item.product_photo_at_purchase}
                alt={item.product_name}
              />
            )}

            <div className="order-detail-item-info">
              <h4>{item.product_name}</h4>
              <p>Quantity: {item.quantity}</p>
              <p>
                RM {Number(item.price_at_purchase).toFixed(2)} each
              </p>
            </div>

            <strong>
              RM{" "}
              {(
                Number(item.price_at_purchase) * item.quantity
              ).toFixed(2)}
            </strong>
          </div>
        ))}

        <div className="order-details-total">
          <span>Total Amount</span>
          <strong>RM {total.toFixed(2)}</strong>
        </div>
      </div>


{/* Payment Information */}
<div className="order-details-card payment-information">
  <h3>Payment Information</h3>

  {payment ? (
    <>
      <div className="order-info-row">
        <span>Payment Method</span>
        <p>{payment.payment_method}</p>
      </div>

      <div className="order-info-row">
        <span>Payment Amount</span>
        <p>RM {Number(payment.amount).toFixed(2)}</p>
      </div>

      <div className="order-info-row">
        <span>Payment Status</span>
        <p className="payment-status">
          {payment.payment_status}
        </p>
      </div>


{/* Receipt Upload Section */}
{["Awaiting Payment", "Rejected"].includes(payment.payment_status) && (
  <div className="receipt-upload-section">
    <h4>
      {payment.payment_status === "Rejected"
        ? "Upload a New Receipt"
        : "Upload Payment Receipt"}
    </h4>

    <p>
      After completing your DuitNow transfer, upload your payment receipt
      for the seller to verify.
    </p>

    <input
      type="file"
      accept="image/*"
      onChange={(e) => setSelectedFile(e.target.files[0] || null)}
    />

    {selectedFile && (
      <div className="receipt-file-preview">
        <p>Selected file: {selectedFile.name}</p>
        <img
          src={URL.createObjectURL(selectedFile)}
          alt="Receipt preview"
        />
      </div>
    )}

    <button
      onClick={uploadReceipt}
      disabled={!selectedFile || uploading}
    >
      {uploading ? "Uploading..." : "Submit Receipt"}
    </button>
  </div>
)}

{payment.payment_status === "Verification Pending" && (
  <div className="receipt-pending-message">
    <p>Your receipt has been submitted.</p>
    <strong>Waiting for seller verification.</strong>
  </div>
)}

{payment.payment_status === "Verified" && (
  <div className="receipt-verified-message">
    <p>Your payment has been verified successfully!</p>
  </div>
)}


      {shop?.duitnow_qr_url && (
        <div className="payment-qr-section">
          <h4>Seller's DuitNow QR Code</h4>
          <img
            src={shop.duitnow_qr_url}
            alt="Seller's DuitNow QR Code"
          />
          <p>Scan this QR code to make your payment.</p>
        </div>
      )}
    </>
  ) : (
    <p>Payment information is not available.</p>
  )}
</div>

    </div>
  );
}


function SellerDashboard() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchListings() {
      try {
        setLoading(true);
        setErrorMessage("");

        // 1. Get the logged-in user
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError) throw authError;

        if (!authData.user) {
          setErrorMessage("Please log in to view your dashboard.");
          return;
        }

        // 2. Get the seller's user_id
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("user_id")
          .eq("auth_user_id", authData.user.id)
          .single();

        if (userError) throw userError;

        // 3. Get the seller's listings from Supabase
        const { data, error } = await supabase
          .from("products")
          .select(`
            product_id,
            name,
            category,
            price,
            quantity,
            status,
            product_photo,
            created_at
          `)
          .eq("seller_id", userData.user_id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setListings(data || []);
      } catch (error) {
        console.error("Error loading dashboard:", error);
        setErrorMessage(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, []);

  // Calculate dashboard statistics
  const totalListings = listings.length;

  const availableListings = listings.filter(
    (item) => item.status === "Available" && Number(item.quantity) > 0
  ).length;

  const totalStock = listings.reduce(
    (sum, item) => sum + Number(item.quantity),
    0
  );

  const totalValue = listings.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );

  if (loading) {
    return (
      <div className="seller-dashboard">
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div className="seller-dashboard">
      <div className="seller-dashboard-header">
        <h1>Seller Dashboard</h1>
        <p>Overview of your selling activities.</p>
      </div>

      {errorMessage && (
        <div className="dashboard-empty">
          <p>{errorMessage}</p>
        </div>
      )}

      {!errorMessage && (
        <>
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

          <div className="dashboard-order-management">
              <div>
              <h2>Order Management</h2>
              <p>View and manage orders from your customers.</p>
            </div>

            <Link to="/seller-orders" className="add-listing-button">
              Manage Orders →
            </Link>
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
              listings.slice(0, 3).map((item) => (
                <div
                  className="dashboard-listing-item"
                  key={item.product_id}
                >
                  <img
                    src={item.product_photo}
                    alt={item.name}
                  />

                  <div className="dashboard-listing-info">
                    <h3>{item.name}</h3>
                    <p>{item.category}</p>
                  </div>

                  <div className="dashboard-listing-price">
                    <strong>
                      RM {Number(item.price).toFixed(2)}
                    </strong>
                    <span>Stock: {item.quantity}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}


function SellerOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [receiptUrls, setReceiptUrls] = useState({});
  const [refundReason, setRefundReason] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refundFiles, setRefundFiles] = useState({});
  const [refundUploading, setRefundUploading] = useState({});

  
  async function fetchSellerOrders() {
      try {
        setLoading(true);
        setErrorMessage("");

        // 1. Get logged-in user
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError) throw authError;

        if (!authData.user) {
          navigate("/login");
          return;
        }

        // 2. Find seller's user_id
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("user_id")
          .eq("auth_user_id", authData.user.id)
          .eq("account_status", "Active")
          .single();

        if (userError) throw userError;

        // 3. Get orders belonging to this seller
        
const { data, error } = await supabase
  .from("orders")
  .select(`
    *,
    order_items!order_items_order_id_fkey(*),
    payments (
      payment_id,
      amount,
      payment_method,
      payment_status,
      receipt_url,
      submitted_at,
      verified_at,
      refunds (
        refund_id,
        refund_amount,
        refund_status,
        reason,
        requested_at,
        completed_at,
        proof_url
      )
    )
  `)
  .eq("seller_id", userData.user_id)
  .order("created_at", { ascending: false });

        if (error) throw error;

        const ordersWithReceiptUrls = await Promise.all(
  (data || []).map(async (order) => {
    const payment = order.payments?.[0];

    let receiptSignedUrl = null;
    let updatedRefunds = payment?.refunds || [];

    // 1. Generate Buyer Payment Receipt URL
    if (payment?.receipt_url) {
      const { data: signedData, error: signedError } =
        await supabase.storage
          .from("payment-receipts")
          .createSignedUrl(payment.receipt_url, 60 * 60);

      if (signedError) {
        console.error("Payment receipt URL error:", signedError);
      } else {
        receiptSignedUrl = signedData.signedUrl;
      }
    }

    // 2. Generate Seller Refund Receipt URL
    updatedRefunds = await Promise.all(
      updatedRefunds.map(async (refund) => {
        if (!refund.proof_url) return refund;

        const { data: refundSignedData, error: refundSignedError } =
          await supabase.storage
            .from("refund-receipts")
            .createSignedUrl(refund.proof_url, 60 * 60);

        if (refundSignedError) {
          console.error(
            "Refund receipt URL error:",
            refundSignedError
          );
          return refund;
        }

        return {
          ...refund,
          proofSignedUrl: refundSignedData.signedUrl,
        };
      })
    );

    return {
      ...order,
      receiptSignedUrl,
      payments: payment
        ? [
            {
              ...payment,
              refunds: updatedRefunds,
            },
          ]
        : [],
    };
  })
);

setOrders(ordersWithReceiptUrls);
      } catch (error) {
        console.error("Fetch seller orders error:", error);
        setErrorMessage(error.message);
      } finally {
        setLoading(false);
      }
    }
    
    async function uploadAndCompleteRefund(order) {
  const payment = order.payments?.[0];
  const refund = payment?.refunds?.[0];
  const file = refundFiles[order.order_id];

  // 1. Check refund record
  if (!refund || refund.refund_status !== "Pending") {
    alert("Pending refund record not found.");
    return;
  }

  // 2. Check selected file
  if (!file) {
    alert("Please select a refund receipt first.");
    return;
  }

  try {
    setRefundUploading((current) => ({
      ...current,
      [order.order_id]: true,
    }));

    // 3. Get logged-in seller
    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError) throw authError;
    if (!authData.user) {
      throw new Error("Please log in again.");
    }

    // 4. Create a safe file path
    const safeFileName = file.name.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );

    const filePath =
      `${authData.user.id}/${order.order_id}/` +
      `${Date.now()}-${safeFileName}`;

    // 5. Upload receipt to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("refund-receipts")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // 6. Complete refund through secure database function
    const { error: refundError } = await supabase.rpc(
      "complete_seller_refund",
      {
        target_refund_id: refund.refund_id,
        refund_proof_path: filePath,
      }
    );

    if (refundError) throw refundError;

    // 7. Clear selected file
    setRefundFiles((current) => ({
      ...current,
      [order.order_id]: null,
    }));

    // 8. Refresh order information
    await fetchSellerOrders();

    alert("Refund completed successfully!");
  } catch (error) {
    console.error("Complete refund error:", error);
    alert("Unable to complete refund: " + error.message);
  } finally {
    setRefundUploading((current) => ({
      ...current,
      [order.order_id]: false,
    }));
  }
}

    useEffect(() => {
    fetchSellerOrders();
  }, [navigate]);

  async function updateOrderStatus(orderId, newStatus) {
  try {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("order_id", orderId);

    if (error) throw error;

    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.order_id === orderId
          ? { ...order, status: newStatus }
          : order
      )
    );
  } catch (error) {
    console.error("Update order status error:", error);
    alert("Unable to update order: " + error.message);
  }
}

async function rejectOrder(order, reason) {
  const payment = order.payments?.[0];

  // Case 1: Payment has been verified
  if (payment?.payment_status === "Verified") {
    if (!reason || reason.trim() === "") {
      alert("Please provide a rejection reason.");
      return;
    }

    try {
      const { data, error } = await supabase.rpc(
        "seller_reject_order_with_refund",
        {
          target_order_id: order.order_id,
          refund_reason: reason.trim(),
        }
      );

      if (error) throw error;

      setSelectedOrder(null);
      setRefundReason("");

      await fetchSellerOrders();

      alert("Order rejected. Refund is now pending.");

    } catch (error) {
      console.error("Reject paid order error:", error);
      alert("Unable to reject order: " + error.message);
    }

    return;
  }

  // Case 2: Payment has not been verified
  const confirmed = window.confirm(
    "Are you sure you want to reject this order? The product stock will be restored."
  );

  if (confirmed) {
    updateOrderStatus(order.order_id, "Rejected");
  }
}

async function updatePaymentStatus(orderId, newStatus) {
  try {
    const order = orders.find(
      (item) => item.order_id === orderId
    );

    const payment = order?.payments?.[0];

    if (!payment) {
      throw new Error("Payment record not found.");
    }

    const { data, error } = await supabase
      .from("payments")
      .update({
        payment_status: newStatus,
        verified_at: new Date().toISOString(),
      })
      .eq("payment_id", payment.payment_id)
      .select()
      .single();

    if (error) throw error;

    setOrders((currentOrders) =>
      currentOrders.map((item) =>
        item.order_id === orderId
          ? {
              ...item,
              payments: [data],
            }
          : item
      )
    );

    alert(
      newStatus === "Verified"
        ? "Payment verified successfully!"
        : "Payment rejected. Buyer can upload a new receipt."
    );

  } catch (error) {
    console.error("Update payment status error:", error);
    alert("Unable to update payment: " + error.message);
  }
}


  if (loading) {
    return <div className="seller-orders-page">Loading orders...</div>;
  }

  return (
    <div className="seller-orders-page">
      <h1>Manage Orders</h1>
      <p>View orders placed by your customers.</p>

      {errorMessage && (
        <p className="error-message">{errorMessage}</p>
      )}

      {!errorMessage && orders.length === 0 && (
        <p>You don't have any orders yet.</p>
      )}

      {!errorMessage && orders.map((order) => {
        const orderItems = order.order_items || [];

        const total = orderItems.reduce(
          (sum, item) =>
            sum + Number(item.price_at_purchase) * item.quantity,
          0
        );

        return (
          <div className="seller-order-card" key={order.order_id}>
            <h3>Order #{order.order_id.slice(-6)}</h3>

            <p>Status: {order.status}</p>
            <p>Date: {new Date(order.created_at).toLocaleString()}</p>
            <p>Buyer: {order.buyer_name || "Not provided"}</p>
            <p>Contact: {order.buyer_phone || "Not provided"}</p>
            <p>Fulfillment: {order.fulfillment_method}</p>


            {["Refund Pending", "Cancelled"].includes(order.status) && (
  <div className="refund-upload-section">
    <h4>Refund Information</h4>

    {(() => {
      const refund = order.payments?.[0]?.refunds?.[0];

      if (!refund) {
        return <p>Refund information not found.</p>;
      }

      return (
        <>
          <p>
            <strong>Refund Amount:</strong> RM{" "}
            {Number(refund.refund_amount).toFixed(2)}
          </p>

          <p>
            <strong>Reason:</strong> {refund.reason}
          </p>

          <p>
            <strong>Refund Status:</strong>{" "}
            {refund.refund_status}
          </p>

          {refund.refund_status === "Pending" && (
            <>
              <label>Upload Refund Receipt:</label>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;

                  setRefundFiles((current) => ({
                    ...current,
                    [order.order_id]: file,
                  }));
                }}
              />

              {refundFiles[order.order_id] && (
                <p>
                  Selected file:{" "}
                  {refundFiles[order.order_id].name}
                </p>
              )}

              <button
                onClick={() => uploadAndCompleteRefund(order)}
                disabled={refundUploading[order.order_id]}
              >
                {refundUploading[order.order_id]
                  ? "Uploading..."
                  : "Upload Receipt & Complete Refund"}
              </button>
            </>
          )}
        </>
      );
    })()}
  </div>
)}

           
{order.status === "Pending" &&
  order.payments?.[0]?.payment_status === "Verified" && (
    <button
      onClick={() =>
        updateOrderStatus(order.order_id, "Confirmed")
      }
    >
      Confirm Order
    </button>
)}

{order.status === "Pending" &&
  order.payments?.[0]?.payment_status !== "Verified" && (
    <p className="payment-not-verified-message">
      Please verify the buyer's payment before confirming this order.
    </p>
)}

           {order.status === "Pending" && (
  <button
    className="reject-order-button"
    onClick={() => {
      if (order.payments?.[0]?.payment_status === "Verified") {
        setSelectedOrder(order);
        setRefundReason("");
      } else {
        rejectOrder(order, "");
      }
    }}
  >
    Reject Order
  </button>
)}

{selectedOrder?.order_id === order.order_id && (
  <div className="refund-reason-form">
    <h4>Reject Paid Order</h4>

    <p>
      This order has already been paid.
      A refund record will be created.
    </p>

    <label>Reason for rejection:</label>

    <textarea
      value={refundReason}
      onChange={(e) => setRefundReason(e.target.value)}
      placeholder="Please explain why you cannot fulfill this order..."
      rows={3}
    />

    <button
      onClick={() => rejectOrder(selectedOrder, refundReason)}
    >
      Confirm Rejection & Create Refund
    </button>

    <button
      onClick={() => {
        setSelectedOrder(null);
        setRefundReason("");
      }}
    >
      Cancel
    </button>
  </div>
)}

          {order.status === "Confirmed" && (
  <button
    onClick={() => updateOrderStatus(order.order_id, "Preparing")}
  >
    Start Preparing
  </button>
)}

{order.status === "Preparing" && (
  <button
    onClick={() =>
      updateOrderStatus(
        order.order_id,
        order.fulfillment_method === "Pickup"
          ? "Ready for Pickup"
          : "Out for Delivery"
      )
    }
  >
    {order.fulfillment_method === "Pickup"
      ? "Ready for Pickup"
      : "Out for Delivery"}
  </button>
)}


            {order.handover_location && (
              <p>Handover location: {order.handover_location}</p>
            )}

            
{order.notes && <p>Buyer notes: {order.notes}</p>}

{/* Payment Information */}
<h4>Payment Information</h4>

{(() => {
  const payment = order.payments?.[0];

  if (!payment) {
    return <p>Payment information is not available.</p>;
  }

  return (
    <div className="seller-payment-info">
      <p>
        Payment Method: {payment.payment_method}
      </p>

      <p>
        Payment Amount: RM {Number(payment.amount).toFixed(2)}
      </p>

      <p>
        Payment Status: {payment.payment_status}
      </p>

      {payment.submitted_at && (
        <p>
          Submitted At: {new Date(payment.submitted_at).toLocaleString()}
        </p>
      )}


{payment.payment_status === "Verification Pending" && (
  <div className="payment-verification-actions">
    <button
      onClick={() => {
        const confirmed = window.confirm(
          "Have you confirmed that the payment was received?"
        );

        if (confirmed) {
          updatePaymentStatus(order.order_id, "Verified");
        }
      }}
    >
      Verify Payment
    </button>

    <button
      className="reject-order-button"
      onClick={() => {
        const confirmed = window.confirm(
          "Are you sure you want to reject this payment receipt?"
        );

        if (confirmed) {
          updatePaymentStatus(order.order_id, "Rejected");
        }
      }}
    >
      Reject Payment
    </button>
  </div>
)}


      {order.receiptSignedUrl && (
        <div className="seller-receipt-preview">
          <p>Buyer's Payment Receipt:</p>

          <img
            src={order.receiptSignedUrl}
            alt="Buyer's payment receipt"
          />
        </div>
      )}

      {payment.payment_status === "Verification Pending" &&
        !order.receiptSignedUrl && (
          <p>Receipt image is currently unavailable.</p>
        )}
    </div>
  );
})()}

<h4>Items</h4>


            {orderItems.map((item) => (
  <div className="seller-order-item" key={item.order_item_id}>
    {item.product_photo_at_purchase && (
      <img
        src={item.product_photo_at_purchase}
        alt={item.product_name}
      />
    )}

    <div className="seller-order-item-info">
      <h5>{item.product_name}</h5>
      <p>Quantity: {item.quantity}</p>
    </div>

    <strong>
      RM {(Number(item.price_at_purchase) * item.quantity).toFixed(2)}
    </strong>
  </div>
))}

<div className="seller-order-total">
  <span>Total Amount</span>
  <strong>RM {total.toFixed(2)}</strong>
</div>

</div>
         );
      })}
     </div>
  );
}

function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchListings() {
      try {
        setLoading(true);
        setErrorMessage("");

        // 1. Get the currently logged-in user
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError) throw authError;

        if (!authData.user) {
          setErrorMessage("Please log in to view your listings.");
          return;
        }

        // 2. Get the seller's user_id
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("user_id")
          .eq("auth_user_id", authData.user.id)
          .single();

        if (userError) throw userError;

        // 3. Get this seller's products from Supabase
        const { data, error } = await supabase
          .from("products")
          .select(`
            product_id,
            name,
            category,
            price,
            quantity,
            handover_location,
            status,
            product_photo
          `)
          .eq("seller_id", userData.user_id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setListings(data || []);
      } catch (error) {
        console.error("Error loading listings:", error);
        setErrorMessage(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, []);

  // Delete listing from Supabase
  async function deleteListing(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this listing?"
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("products")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq("product_id", id);

      if (error) throw error;

      // Remove the deleted listing from the page
      setListings((currentListings) =>
        currentListings.filter((item) => item.product_id !== id)
      );

    } catch (error) {
      console.error("Error deleting listing:", error);
      alert("Unable to delete listing: " + error.message);
    }
  }

  if (loading) {
    return <div className="my-listings-page">Loading your listings...</div>;
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

      {errorMessage ? (
        <div className="empty-listings">
          <p>{errorMessage}</p>
        </div>
      ) : listings.length === 0 ? (
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
            <div className="my-listing-card" key={item.product_id}>
              <img
                src={item.product_photo}
                alt={item.name}
              />

              <div className="my-listing-info">
                <span className="my-listing-category">
                  {item.category}
                </span>

                <h3>{item.name}</h3>

                <p className="my-listing-price">
                  RM {Number(item.price).toFixed(2)}
                </p>

                <p className="my-listing-stock">
                  Quantity Available: {item.quantity}
                </p>

                <p className="my-listing-location">
                  📍 {item.handover_location || "Not specified"}
                </p>

                <span className="listing-status">
                  {item.status}
                </span>

                <button
                  className="delete-listing-button"
                  onClick={() => deleteListing(item.product_id)}
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
  const [category, setCategory] = useState("Food");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("Student Mall");

  const [sellerId, setSellerId] = useState("");
  const [shops, setShops] = useState([]);
  const [shopId, setShopId] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSellerData() {
      try {
        const { data: { user }, error: authError } =
          await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          navigate("/login");
          return;
        }

        const { data: seller, error: sellerError } =
          await supabase
            .from("users")
            .select("user_id")
            .eq("auth_user_id", user.id)
            .eq("account_status", "Active")
            .maybeSingle();

        if (sellerError) throw sellerError;

        if (!seller) {
          setError("Seller profile not found or inactive.");
          return;
        }

        setSellerId(seller.user_id);

        const { data: shopData, error: shopError } =
          await supabase
            .from("shops")
            .select("shop_id, shop_name")
            .eq("owner_id", seller.user_id)
            .eq("shop_status", "Active");

        if (shopError) throw shopError;

        setShops(shopData || []);

      } catch (err) {
        console.error("Error loading seller data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSellerData();
  }, [navigate]);

  function handleImageChange(e) {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      return;
    }

    setError("");
    setImageFile(file);

    const reader = new FileReader();

    reader.onloadend = () => {
      setImagePreview(reader.result);
    };

    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!imageFile) {
      setError("Please upload a product image.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const { data: { user }, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user || !sellerId) {
        throw new Error("Please log in with an active seller account.");
      }

      // Upload image to Supabase Storage
      const safeFileName = imageFile.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

      const filePath =
        `${user.id}/${Date.now()}-${safeFileName}`;

      const { error: uploadError } = await supabase
        .storage
        .from("product-images")
        .upload(filePath, imageFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: imageFile.type,
        });

      if (uploadError) throw uploadError;

      // Get public image URL
      const { data: publicUrlData } = supabase
        .storage
        .from("product-images")
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;

      // Save product to Supabase
      const { error: insertError } = await supabase
        .from("products")
        .insert({
          seller_id: sellerId,
          shop_id: shopId || null,
          name: name,
          category: category,
          price: Number(price),
          quantity: Number(quantity),
          description: description,
          handover_location: location,
          product_photo: imageUrl,
          status: "Available",
          is_deleted: false,
        });

      if (insertError) throw insertError;

      alert("Your listing has been created successfully!");

      navigate("/my-listings");

    } catch (err) {
      console.error("Error creating listing:", err);
      setError(err.message || "Unable to create listing.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <h2>Loading seller information...</h2>
      </div>
    );
  }

  if (!sellerId) {
    return (
      <div className="page-container">
        <h2>Unable to create listing</h2>
        <p>{error}</p>
      </div>
    );
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
            <option value="Study Item">Study Item</option>
            <option value="Food">Food</option>
            <option value="Hostel Item">Hostel Item</option>
            <option value="Student Services">Student Services</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="listing-two-columns">
          <div className="listing-field">
            <label>Price (RM)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
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
          <label>Shop</label>
          <select
            value={shopId}
            onChange={(e) => setShopId(e.target.value)}
          >
            <option value="">Personal Listing (No Shop)</option>

            {shops.map((shop) => (
              <option key={shop.shop_id} value={shop.shop_id}>
                {shop.shop_name}
              </option>
            ))}
          </select>
        </div>

        <div className="listing-field">
          <label>Product Image</label>

          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            required
          />

          {imagePreview && (
            <div className="listing-image-preview">
              <img src={imagePreview} alt="Product preview" />
            </div>
          )}
        </div>

        {error && (
          <p style={{ color: "red" }}>{error}</p>
        )}

        <button
          type="submit"
          className="create-listing-button"
          disabled={submitting}
        >
          {submitting ? "Publishing..." : "Publish Listing"}
        </button>
      </form>
    </div>
  );
}


function CreateShop() {
  const navigate = useNavigate();

  const [shopName, setShopName] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopPhoto, setShopPhoto] = useState(null);
  const [qrCode, setQrCode] = useState(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [userId, setUserId] = useState(null);
  const [authUserId, setAuthUserId] = useState(null);

  // Check login and existing shop
  useEffect(() => {
    async function checkUser() {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        navigate("/login");
        return;
      }

      setAuthUserId(authData.user.id);

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("user_id, user_type")
        .eq("auth_user_id", authData.user.id)
        .single();

      if (userError) {
        setErrorMessage(userError.message);
        return;
      }

      if (userData.user_type !== "Campus Vendor") {
        setErrorMessage("Only Campus Vendors can create a shop.");
        return;
      }

      setUserId(userData.user_id);

      // Check whether this vendor already has a shop
      const { data: existingShop, error: shopError } = await supabase
        .from("shops")
        .select("shop_id")
        .eq("owner_id", userData.user_id)
        .maybeSingle();

      if (shopError) {
        setErrorMessage(shopError.message);
        return;
      }

      if (existingShop) {
        navigate("/my-shop");
      }
    }

    checkUser();
  }, [navigate]);

  function handleImageChange(e, setImage) {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB.");
      return;
    }

    setImage(file);
  }

  async function handleCreateShop(e) {
    e.preventDefault();

    if (!userId || !authUserId) {
      setErrorMessage("User information is not ready. Please try again.");
      return;
    }

    if (!shopName.trim()) {
      setErrorMessage("Please enter your shop name.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      let shopPhotoUrl = null;
      let qrCodeUrl = null;

      // Upload shop photo
      if (shopPhoto) {
        const safeName = shopPhoto.name.replace(/[^a-zA-Z0-9.-]/g, "-");
        const filePath = `${authUserId}/${Date.now()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("shop-images")
          .upload(filePath, shopPhoto);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("shop-images")
          .getPublicUrl(filePath);

        shopPhotoUrl = data.publicUrl;
      }

      // Upload DuitNow QR Code
      if (qrCode) {
        const safeName = qrCode.name.replace(/[^a-zA-Z0-9.-]/g, "-");
        const filePath = `${authUserId}/${Date.now()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("shop-images")
          .upload(filePath, qrCode);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("shop-images")
          .getPublicUrl(filePath);

        qrCodeUrl = data.publicUrl;
      }

      // Save shop information to Supabase
      const { error: insertError } = await supabase
        .from("shops")
        .insert({
          owner_id: userId,
          shop_name: shopName.trim(),
          shop_description: shopDescription.trim(),
          shop_address: shopAddress.trim(),
          shop_photo: shopPhotoUrl,
          duitnow_qr_url: qrCodeUrl,
          verification_status: "Pending",
          shop_status: "Active",
        });

      if (insertError) throw insertError;

      alert("Shop created successfully!");
      navigate("/my-shop");

    } catch (error) {
      console.error("Create shop error:", error);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="create-shop-page">
      <div className="create-shop-header">
        <h1>Create Your Shop</h1>
        <p>Set up your own campus shop on CampusTrade.</p>
      </div>

      <form className="create-shop-form" onSubmit={handleCreateShop}>
        <div className="create-shop-field">
          <label>Shop Name *</label>
          <input
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="Enter your shop name"
            required
          />
        </div>

        <div className="create-shop-field">
          <label>Shop Description</label>
          <textarea
            value={shopDescription}
            onChange={(e) => setShopDescription(e.target.value)}
            placeholder="Tell buyers about your shop"
            rows="4"
          />
        </div>

        <div className="create-shop-field">
          <label>Shop Address</label>
          <input
            type="text"
            value={shopAddress}
            onChange={(e) => setShopAddress(e.target.value)}
            placeholder="Enter your shop address"
          />
        </div>

        <div className="create-shop-field">
          <label>Shop Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageChange(e, setShopPhoto)}
          />
          {shopPhoto && <p>Selected: {shopPhoto.name}</p>}
        </div>

        <div className="create-shop-field">
          <label>DuitNow QR Code</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageChange(e, setQrCode)}
          />
          {qrCode && <p>Selected: {qrCode.name}</p>}
        </div>

        {errorMessage && (
          <p className="create-shop-error">{errorMessage}</p>
        )}

        <button type="submit" disabled={loading || !userId}>
          {loading ? "Creating Shop..." : "Create Shop"}
        </button>
      </form>
    </div>
  );
}

function PublicShop() {
  const { id } = useParams();

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPublicShop() {
      setLoading(true);
      setError("");

      // 1. Get shop information
      const { data: shopData, error: shopError } = await supabase
        .from("shops")
        .select("*")
        .eq("shop_id", id)
        .eq("shop_status", "Active")
        .maybeSingle();

      if (shopError) {
        console.error("Error fetching shop:", shopError.message);
        setError("Unable to load this shop.");
        setLoading(false);
        return;
      }

      if (!shopData) {
        setShop(null);
        setProducts([]);
        setLoading(false);
        return;
      }

      setShop(shopData);

      // 2. Get this shop's available products
      const { data: productData, error: productError } =
        await supabase
          .from("products")
          .select("*")
          .eq("shop_id", id)
          .eq("is_deleted", false)
          .eq("status", "Available")
          .gt("quantity", 0)
          .order("created_at", { ascending: false });

      if (productError) {
        console.error(
          "Error fetching shop products:",
          productError.message
        );
        setError("Unable to load shop products.");
      } else {
        setProducts(productData || []);
      }

      setLoading(false);
    }

    fetchPublicShop();
  }, [id]);

  if (loading) {
    return (
      <div className="page-container">
        <h2>Loading shop...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <h2>{error}</h2>
        <Link to="/shop">Back to Shop</Link>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="page-container">
        <h1>Shop not found</h1>
        <Link to="/shop">Back to Shop</Link>
      </div>
    );
  }

  return (
    <div className="shop-page">
      <Link to="/shop" className="back-link">
        ← Back to Shop
      </Link>

      <div className="public-shop-header">
        {shop.shop_photo && (
          <img
            src={shop.shop_photo}
            alt={shop.shop_name}
          />
        )}

        <h1>{shop.shop_name}</h1>

        <p>
          {shop.shop_description || "No shop description available."}
        </p>

        {shop.shop_address && (
          <p>
            <strong>Address:</strong> {shop.shop_address}
          </p>
        )}
      </div>

      <div className="shop-results">
        <h2>Products from this Shop</h2>

        <p>{products.length} products found</p>

        <div className="shop-grid">
          {products.length > 0 ? (
            products.map((product) => (
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
                  <p className="shop-category">
                    {product.category}
                  </p>

                  <h3>{product.name}</h3>

                  <p className="shop-price">
                    RM {Number(product.price).toFixed(2)}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="no-products">
              <h3>No products available</h3>
              <p>This shop has no available products at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function MyShop() {
  const navigate = useNavigate();

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadMyShop() {
      try {
        // Check login
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError || !authData.user) {
          navigate("/login");
          return;
        }

        // Get current user's database ID
        const { data: userData, error: userError } =
          await supabase
            .from("users")
            .select("user_id")
            .eq("auth_user_id", authData.user.id)
            .single();

        if (userError) throw userError;

        // Get this user's shop
        const { data: shopData, error: shopError } =
          await supabase
            .from("shops")
            .select("*")
            .eq("owner_id", userData.user_id)
            .maybeSingle();

        if (shopError) throw shopError;

        if (!shopData) {
          setShop(null);
          return;
        }

        setShop(shopData);

        // Get products belonging to this shop
        const { data: productData, error: productError } =
          await supabase
            .from("products")
            .select("*")
            .eq("shop_id", shopData.shop_id)
            .eq("is_deleted", false)
            .order("created_at", { ascending: false });

        if (productError) throw productError;

        setProducts(productData || []);

      } catch (error) {
        console.error("Load My Shop error:", error);
        setErrorMessage(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadMyShop();
  }, [navigate]);

  if (loading) {
    return <div className="my-shop-page">Loading your shop...</div>;
  }

  if (errorMessage) {
    return (
      <div className="my-shop-page">
        <p>{errorMessage}</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="my-shop-page">
        <div className="my-shop-empty">
          <h2>You haven't created a shop yet</h2>
          <p>Create your own campus shop to start selling!</p>
          <button onClick={() => navigate("/create-shop")}>
            Create My Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-shop-page">
      <div className="my-shop-header">
        {shop.shop_photo && (
          <img
            src={shop.shop_photo}
            alt={shop.shop_name}
            className="my-shop-photo"
          />
        )}

        <div className="my-shop-info">
          <h1>{shop.shop_name}</h1>

          <p>
            {shop.shop_description || "No shop description yet."}
          </p>

          {shop.shop_address && (
            <p>📍 {shop.shop_address}</p>
          )}

          <span className="my-shop-status">
            Verification: {shop.verification_status}
          </span>
        </div>
      </div>

      {shop.duitnow_qr_url && (
        <div className="my-shop-qr">
          <h3>My DuitNow QR Code</h3>
          <img
            src={shop.duitnow_qr_url}
            alt="DuitNow QR Code"
          />
        </div>
      )}

      <div className="my-shop-products">
        <h2>My Shop Products</h2>

        {products.length === 0 ? (
          <p>You haven't added any products to your shop yet.</p>
        ) : (
          <div className="my-shop-product-grid">
            {products.map((product) => (
              <div
                className="my-shop-product-card"
                key={product.product_id}
              >
                {product.product_photo && (
                  <img
                    src={product.product_photo}
                    alt={product.name}
                  />
                )}

                <div className="my-shop-product-info">
                  <h3>{product.name}</h3>
                  <p>RM {Number(product.price).toFixed(2)}</p>
                  <p>Quantity: {product.quantity}</p>
                  <span>{product.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    contact_number: "",
    whatsapp: "",
    telegram: "",
  });

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
        .select("name, email, user_type, contact_number, whatsapp, telegram, profile_photo")
        .eq("auth_user_id", authData.user.id)
        .single();

      if (error) {
        console.error("Profile loading error:", error);
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      setProfile(data);

      setFormData({
        name: data.name || "",
        contact_number: data.contact_number || "",
        whatsapp: data.whatsapp || "",
        telegram: data.telegram || "",
      });

      setLoading(false);
    }

    loadProfile();
  }, []);

  function handleInputChange(e) {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  function handlePhotoChange(e) {
  const file = e.target.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please select an image file.");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert("Image size must be less than 5MB.");
    return;
  }

  setPhotoFile(file);
  setPhotoPreview(URL.createObjectURL(file));
}

async function handlePhotoUpload() {
  if (!photoFile) return;

  setUploadingPhoto(true);
  setErrorMessage("");

  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  if (authError || !authData.user) {
    setErrorMessage("Please log in again.");
    setUploadingPhoto(false);
    return;
  }

  const safeFileName = photoFile.name.replace(/[^a-zA-Z0-9.-]/g, "-");

  const filePath = `${authData.user.id}/${Date.now()}-${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-photos")
    .upload(filePath, photoFile);

  if (uploadError) {
    setErrorMessage(uploadError.message);
    setUploadingPhoto(false);
    return;
  }

  const { data: urlData } = supabase.storage
    .from("profile-photos")
    .getPublicUrl(filePath);

  const imageUrl = urlData.publicUrl;

  const { data, error } = await supabase
    .from("users")
    .update({ profile_photo: imageUrl })
    .eq("auth_user_id", authData.user.id)
    .select("name, email, user_type, contact_number, whatsapp, telegram, profile_photo")
    .single();

  if (error) {
    setErrorMessage(error.message);
    setUploadingPhoto(false);
    return;
  }

  setProfile(data);
  setPhotoFile(null);
  setPhotoPreview("");
  setUploadingPhoto(false);

  alert("Profile photo updated successfully!");
}

  function handleCancel() {
    setFormData({
      name: profile.name || "",
      contact_number: profile.contact_number || "",
      whatsapp: profile.whatsapp || "",
      telegram: profile.telegram || "",
    });

    setEditMode(false);
    setErrorMessage("");
  }

  async function handleSave(e) {
    e.preventDefault();

    setSaving(true);
    setErrorMessage("");

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setErrorMessage("Please log in again.");
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .update({
        name: formData.name,
        contact_number: formData.contact_number,
        whatsapp: formData.whatsapp,
        telegram: formData.telegram,
      })
      .eq("auth_user_id", authData.user.id)
      .select("name, email, user_type, contact_number, whatsapp, telegram")
      .single();

    if (error) {
      console.error("Profile update error:", error);
      setErrorMessage(error.message);
      setSaving(false);
      return;
    }

    setProfile(data);
    setEditMode(false);
    setSaving(false);

    alert("Profile updated successfully!");
  }

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

  if (errorMessage && !profile) {
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
      {photoPreview || profile?.profile_photo ? (
        <img
        src={photoPreview || profile.profile_photo}
        alt="Profile"
        />
      ) : (
        <span>
        {profile?.name?.charAt(0).toUpperCase() || "U"}
        </span>
      )}
      </div>

      <div className="profile-photo-controls">
      <label htmlFor="profile-photo-input">
      Change Photo
      </label>

      <input
        id="profile-photo-input"
        type="file"
        accept="image/*"
        onChange={handlePhotoChange}
      />

      {photoFile && (
        <button
        type="button"
        onClick={handlePhotoUpload}
        disabled={uploadingPhoto}
      >
      {uploadingPhoto ? "Uploading..." : "Save Photo"}
      </button>
      )}
      </div>

        <div>
          <h1>{profile?.name}</h1>
          <p>{profile?.email}</p>
          <p>{profile?.user_type}</p>
        </div>
      </div>

      <section className="profile-section">
        <h2>My Profile</h2>

        {!editMode ? (
          <div className="profile-edit-section">
            <p><strong>Name:</strong> {profile?.name}</p>
            <p><strong>Contact Number:</strong> {profile?.contact_number || "Not provided"}</p>
            <p><strong>WhatsApp:</strong> {profile?.whatsapp || "Not provided"}</p>
            <p><strong>Telegram:</strong> {profile?.telegram || "Not provided"}</p>

            <button
              className="profile-edit-button"
              onClick={() => setEditMode(true)}
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <form className="profile-edit-form" onSubmit={handleSave}>
            <div className="profile-edit-field">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="profile-edit-field">
              <label>Email Address</label>
              <input
                type="email"
                value={profile?.email || ""}
                disabled
              />
            </div>

            <div className="profile-edit-field">
              <label>Contact Number</label>
              <input
                type="tel"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleInputChange}
              />
            </div>

            <div className="profile-edit-field">
              <label>WhatsApp</label>
              <input
                type="text"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleInputChange}
              />
            </div>

            <div className="profile-edit-field">
              <label>Telegram</label>
              <input
                type="text"
                name="telegram"
                value={formData.telegram}
                onChange={handleInputChange}
              />
            </div>

            {errorMessage && (
              <p style={{ color: "red" }}>{errorMessage}</p>
            )}

            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button type="button" onClick={handleCancel}>
              Cancel
            </button>
          </form>
        )}
      </section>

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

      <Link to="/my-shop" className="profile-menu-card">
        <div className="profile-menu-icon">🏪</div>
        <div>
        <h3>My Shop</h3>
        <p>View your shop and products</p>
        </div>
        <span>›</span>
      </Link>

  <Link to="/create-shop" className="profile-menu-card">
    <div className="profile-menu-icon">➕</div>
    <div>
      <h3>Create Shop</h3>
      <p>Set up your own campus shop</p>
    </div>
    <span>›</span>
  </Link>

  <Link to="/seller" className="profile-menu-card">
    <div className="profile-menu-icon">📊</div>
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
  const navigate = useNavigate();
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
  PublicShop,
  ProductDetails,
  Cart,
  Checkout,
  OrderConfirmation,
  Orders,
  OrderDetails,
  SellerDashboard,
  SellerOrders,
  MyListings,
  ListItem,
  Profile,
  Login,
  Register,
  Conversations,
  CreateShop,
  MyShop,
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