import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Header() {
  const { user, isStaff, logout } = useAuth();
  const { count } = useCart();
  const nav = useNavigate();
  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="logo">SalesFlow<span>AI</span></Link>
        <nav className="nav">
          <NavLink to="/" end>Sản phẩm</NavLink>
          <NavLink to="/track">Tra cứu đơn</NavLink>
          {user && <NavLink to="/orders">Đơn của tôi</NavLink>}
          {isStaff && <NavLink to="/admin">Quản trị</NavLink>}
          <NavLink to="/cart" className="cart-link">Giỏ hàng {count > 0 && <b className="badge">{count}</b>}</NavLink>
          {user ? (
            <>
              <NavLink to="/profile">{user.name}</NavLink>
              <button className="btn-link" onClick={() => { logout(); nav('/'); }}>Đăng xuất</button>
            </>
          ) : (
            <NavLink to="/login">Đăng nhập</NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
