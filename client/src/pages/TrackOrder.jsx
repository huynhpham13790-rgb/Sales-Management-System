import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import OrderCard from '../components/OrderCard';

export default function TrackOrder() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({ code: params.get('code') || '', phone: params.get('phone') || '' });
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  const search = async (e) => {
    e?.preventDefault();
    setError('');
    try { setOrder(await api(`/orders/track?${new URLSearchParams(form)}`)); }
    catch (err) { setOrder(null); setError(err.message); }
  };
  useEffect(() => { if (form.code && form.phone) search(); }, []);

  return (
    <>
      <form className="card form narrow" onSubmit={search}>
        <h1>Tra cứu đơn hàng</h1>
        <label>Mã đơn hàng<input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.trim() })} /></label>
        <label>Số điện thoại đặt hàng<input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.trim() })} /></label>
        {error && <p className="error">{error}</p>}
        <button className="btn">Tra cứu</button>
      </form>
      {order && <OrderCard order={order} />}
    </>
  );
}
