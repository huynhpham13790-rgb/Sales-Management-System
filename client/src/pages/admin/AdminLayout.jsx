import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const MENU = [
  ['/admin', 'Tổng quan', true],
  ['/admin/orders', 'Đơn hàng'],
  ['/admin/products', 'Sản phẩm'],
  ['/admin/categories', 'Danh mục'],
  ['/admin/inventory', 'Kho hàng'],
  ['/admin/coupons', 'Mã giảm giá'],
  ['/admin/customers', 'Người dùng'],
  ['/admin/ai/forecast', '🤖 Dự báo nhu cầu'],
  ['/admin/ai/segments', '🤖 Phân khúc khách hàng'],
  ['/admin/ai/chat-logs', '🤖 Lịch sử chatbot'],
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="admin">
      <aside className="admin-side">
        <Link to="/admin" className="logo">SalesFlow<span>AI</span></Link>
        <nav>{MENU.map(([to, label, end]) => <NavLink key={to} to={to} end={end}>{label}</NavLink>)}</nav>
        <div className="admin-user">
          <div>{user.name}</div>
          <div className="muted small">{user.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</div>
          <Link to="/">← Về cửa hàng</Link> · <button className="btn-link" onClick={logout}>Đăng xuất</button>
        </div>
      </aside>
      <main className="admin-main"><Outlet /></main>
    </div>
  );
}
