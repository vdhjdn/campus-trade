import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        University Teknologi Malaysia
      </Link>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/shop">Categories</Link>
        <Link to="/my-listings">My Listings</Link>
        <Link to="/orders">My Orders</Link>
        <Link to="/cart">Cart</Link>
        <Link to="/sell">+ Sell</Link>
      </div>

      <Link to="/profile" className="profile-button">
        ◯
      </Link>
    </nav>
  );
}

export default Navbar;