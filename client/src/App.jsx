import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import ChatWidget from './components/ChatWidget';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import MyOrders from './pages/MyOrders';
import TrackOrder from './pages/TrackOrder';
import Profile from './pages/Profile';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import Categories from './pages/admin/Categories';
import Orders from './pages/admin/Orders';
import Customers from './pages/admin/Customers';
import Coupons from './pages/admin/Coupons';
import Inventory from './pages/admin/Inventory';
import AIForecast from './pages/admin/AIForecast';
import AISegments from './pages/admin/AISegments';
import ChatLogs from './pages/admin/ChatLogs';

function ClientLayout() {
  return (
    <>
      <Header />
      <main className="container"><Outlet /></main>
      <footer className="footer">© {new Date().getFullYear()} SalesFlow AI – Hệ thống quản lý bán hàng tích hợp AI</footer>
      <ChatWidget />
    </>
  );
}

function RequireAuth({ staff, children }) {
  const { user, ready, isStaff } = useAuth();
  if (!ready) return <p className="center">Đang tải...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (staff && !isStaff) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<ClientLayout />}>
        <Route index element={<Home />} />
        <Route path="product/:id" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="track" element={<TrackOrder />} />
        <Route path="orders" element={<RequireAuth><MyOrders /></RequireAuth>} />
        <Route path="profile" element={<RequireAuth><Profile /></RequireAuth>} />
      </Route>
      <Route path="admin" element={<RequireAuth staff><AdminLayout /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="categories" element={<Categories />} />
        <Route path="orders" element={<Orders />} />
        <Route path="customers" element={<Customers />} />
        <Route path="coupons" element={<Coupons />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="ai/forecast" element={<AIForecast />} />
        <Route path="ai/segments" element={<AISegments />} />
        <Route path="ai/chat-logs" element={<ChatLogs />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
