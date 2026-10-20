import { useEffect, useState } from 'react';
import { api, fmtDate } from '../../api';

export default function Inventory() {
  const [low, setLow] = useState([]);
  const [logs, setLogs] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ product_id: '', change_qty: '', reason: '' });
  const [msg, setMsg] = useState('');

  const load = () => {
    api('/inventory/low-stock').then(setLow);
    api('/inventory/logs').then(setLogs);
  };
  useEffect(() => {
    load();
    api('/products?all=1&limit=100').then((d) => setProducts(d.items));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await api('/inventory/adjust', { method: 'POST', body: form });
      setMsg(`Đã cập nhật. Tồn kho mới: ${res.stock}`);
      setForm({ product_id: form.product_id, change_qty: '', reason: '' });
      load();
    } catch (err) { setMsg(err.message); }
  };

  return (
    <>
      <h1>Kho hàng</h1>
      <div className="layout-2col">
        <form className="card form" onSubmit={submit}>
          <h2>Nhập / xuất kho</h2>
          <label>Sản phẩm</label>
          <select required value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
            <option value="">-- Chọn sản phẩm --</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name} (tồn {p.stock})</option>)}
          </select>
          <label>Số lượng (dương = nhập, âm = xuất)</label>
          <input type="number" required value={form.change_qty} onChange={(e) => setForm({ ...form, change_qty: e.target.value })} />
          <label>Lý do</label>
          <input value={form.reason} placeholder="VD: Nhập hàng từ NCC, hàng lỗi..." onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          {msg && <p className="muted">{msg}</p>}
          <button className="btn">Cập nhật</button>
        </form>
        <div className="card">
          <h2>⚠ Sắp hết hàng ({low.length})</h2>
          <table className="table">
            <thead><tr><th>Sản phẩm</th><th>Tồn</th><th>Ngưỡng</th></tr></thead>
            <tbody>{low.map((p) => <tr key={p.id}><td>{p.name}</td><td className="error">{p.stock}</td><td>{p.low_stock_threshold}</td></tr>)}</tbody>
          </table>
          {!low.length && <p className="muted">Tất cả sản phẩm đủ hàng.</p>}
        </div>
      </div>
      <div className="card">
        <h2>Lịch sử kho</h2>
        <table className="table">
          <thead><tr><th>Thời gian</th><th>Sản phẩm</th><th>Thay đổi</th><th>Lý do</th><th>Người thực hiện</th></tr></thead>
          <tbody>{logs.map((l) => (
            <tr key={l.id}>
              <td className="small">{fmtDate(l.created_at)}</td><td>{l.product_name}</td>
              <td className={l.change_qty > 0 ? 'ok' : 'error'}>{l.change_qty > 0 ? '+' : ''}{l.change_qty}</td>
              <td>{l.reason}</td><td>{l.user_name || 'Hệ thống'}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </>
  );
}
