import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api, vnd } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const [form, setForm] = useState({
    customer_name: user?.name || '', phone: user?.phone || '', address: user?.address || '', note: '', payment_method: 'cod',
  });
  const [coupon, setCoupon] = useState('');
  const [applied, setApplied] = useState(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (done) {
    return (
      <div className="card center">
        <h1>🎉 Đặt hàng thành công!</h1>
        <p>Mã đơn hàng: <b>{done.code}</b> – Tổng tiền: <b>{vnd(done.total)}</b></p>
        <p className="muted">Lưu lại mã đơn và số điện thoại để tra cứu.</p>
        <Link to={`/track?code=${done.code}&phone=${form.phone}`} className="btn">Theo dõi đơn hàng</Link>
      </div>
    );
  }
  if (!items.length) return <Navigate to="/cart" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const discount = applied?.discount || 0;

  const applyCoupon = async () => {
    setError('');
    try { setApplied(await api('/coupons/validate', { method: 'POST', body: { code: coupon, subtotal } })); }
    catch (e) { setApplied(null); setError(e.message); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api('/orders', {
        method: 'POST',
        body: { ...form, coupon_code: applied?.code, items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })) },
      });
      clear();
      setDone(res);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="layout-2col">
      <form className="card form" onSubmit={submit}>
        <h1>Thông tin giao hàng</h1>
        <label>Họ tên<input required value={form.customer_name} onChange={set('customer_name')} /></label>
        <label>Số điện thoại<input required pattern="0\d{9}" title="10 số, bắt đầu bằng 0" value={form.phone} onChange={set('phone')} /></label>
        <label>Địa chỉ<input required value={form.address} onChange={set('address')} /></label>
        <label>Ghi chú<textarea value={form.note} onChange={set('note')} /></label>
        <label>Phương thức thanh toán
          <select value={form.payment_method} onChange={set('payment_method')}>
            <option value="cod">Thanh toán khi nhận hàng (COD)</option>
            <option value="bank">Chuyển khoản ngân hàng</option>
          </select>
        </label>
        {form.payment_method === 'bank' && <p className="ai-note">Chuyển khoản tới STK 0123456789 – Ngân hàng ABC, nội dung: mã đơn hàng.</p>}
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={submitting}>{submitting ? 'Đang xử lý...' : 'Đặt hàng'}</button>
      </form>
      <div className="card">
        <h2>Đơn hàng</h2>
        {items.map((i) => <div key={i.id} className="line"><span>{i.name} × {i.quantity}</span><span>{vnd(i.price * i.quantity)}</span></div>)}
        <div className="row" style={{ marginTop: 12 }}>
          <input placeholder="Mã giảm giá" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} />
          <button type="button" className="btn btn-outline" onClick={applyCoupon}>Áp dụng</button>
        </div>
        <div className="line"><span>Tạm tính</span><span>{vnd(subtotal)}</span></div>
        {applied && <div className="line ok"><span>Giảm ({applied.code})</span><span>-{vnd(discount)}</span></div>}
        <div className="line total"><span>Tổng cộng</span><span className="price">{vnd(subtotal - discount)}</span></div>
      </div>
    </div>
  );
}
