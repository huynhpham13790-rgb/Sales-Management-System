import { useEffect, useState } from 'react';
import { api, vnd } from '../../api';

const EMPTY = { code: '', type: 'percent', value: '', min_order: 0, max_uses: 0, expires_at: '', is_active: true };

export default function Coupons() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const load = () => api('/coupons').then(setItems).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const save = async (e) => {
    e.preventDefault();
    try {
      const body = { ...form, expires_at: form.expires_at || null };
      if (form.id) await api(`/coupons/${form.id}`, { method: 'PUT', body });
      else await api('/coupons', { method: 'POST', body });
      setForm(null);
      setError('');
      load();
    } catch (err) { setError(err.message); }
  };
  const del = async (c) => { if (window.confirm(`Xóa mã ${c.code}?`)) { await api(`/coupons/${c.id}`, { method: 'DELETE' }); load(); } };
  const edit = (c) => setForm({ ...c, is_active: !!c.is_active, expires_at: c.expires_at ? c.expires_at.slice(0, 10) : '' });

  return (
    <>
      <div className="page-head"><h1>Mã giảm giá</h1><button className="btn" onClick={() => setForm(EMPTY)}>+ Tạo mã</button></div>
      {error && <p className="error">{error}</p>}
      {form && (
        <form className="card form grid-form" onSubmit={save}>
          <label>Mã<input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></label>
          <label>Loại
            <select value={form.type} onChange={set('type')}><option value="percent">Phần trăm (%)</option><option value="fixed">Số tiền cố định (đ)</option></select>
          </label>
          <label>Giá trị<input type="number" required min="1" value={form.value} onChange={set('value')} /></label>
          <label>Đơn tối thiểu (đ)<input type="number" min="0" value={form.min_order} onChange={set('min_order')} /></label>
          <label>Số lượt tối đa (0 = không giới hạn)<input type="number" min="0" value={form.max_uses} onChange={set('max_uses')} /></label>
          <label>Hết hạn<input type="date" value={form.expires_at} onChange={set('expires_at')} /></label>
          <label className="check"><input type="checkbox" checked={form.is_active} onChange={set('is_active')} /> Kích hoạt</label>
          <div className="full row"><button className="btn">Lưu</button><button type="button" className="btn btn-outline" onClick={() => setForm(null)}>Hủy</button></div>
        </form>
      )}
      <div className="card">
        <table className="table">
          <thead><tr><th>Mã</th><th>Giảm</th><th>Đơn tối thiểu</th><th>Đã dùng</th><th>Hết hạn</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>{items.map((c) => (
            <tr key={c.id}>
              <td><b>{c.code}</b></td>
              <td>{c.type === 'percent' ? `${c.value}%` : vnd(c.value)}</td>
              <td>{vnd(c.min_order)}</td>
              <td>{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ''}</td>
              <td>{c.expires_at ? new Date(c.expires_at).toLocaleDateString('vi-VN') : 'Không'}</td>
              <td>{c.is_active ? 'Đang chạy' : <span className="muted">Tắt</span>}</td>
              <td className="nowrap"><button className="btn-link" onClick={() => edit(c)}>Sửa</button><button className="btn-link danger" onClick={() => del(c)}>Xóa</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </>
  );
}
