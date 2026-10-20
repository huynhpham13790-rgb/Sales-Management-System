import { useEffect, useState } from 'react';
import { api } from '../api';
import OrderCard from '../components/OrderCard';

export default function MyOrders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const load = () => api('/orders/mine').then(setOrders).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn hủy đơn này?')) return;
    try { await api(`/orders/${id}/cancel`, { method: 'POST' }); load(); } catch (e) { setError(e.message); }
  };

  if (!orders) return <p className="center">{error || 'Đang tải...'}</p>;
  return (
    <>
      <h1>Đơn hàng của tôi</h1>
      {error && <p className="error">{error}</p>}
      {!orders.length && <p className="muted">Bạn chưa có đơn hàng nào.</p>}
      {orders.map((o) => (
        <OrderCard key={o.id} order={o} actions={o.status === 'pending' && (
          <button className="btn btn-outline danger" onClick={() => cancel(o.id)}>Hủy đơn</button>
        )} />
      ))}
    </>
  );
}
