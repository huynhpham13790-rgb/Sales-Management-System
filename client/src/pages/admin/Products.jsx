import { useEffect, useState } from 'react';
import { api, vnd } from '../../api';

const EMPTY = { name: '', category_id: '', price: '', stock: 0, low_stock_threshold: 5, image_url: '', description: '', is_active: true };

export default function Products() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const load = () => api(`/products?all=1&limit=100&q=${encodeURIComponent(q)}`).then((d) => setItems(d.items)).catch((e) => setError(e.message));
  useEffect(() => { api('/categories').then(setCategories); }, []);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const save = async (e) => {
    e.preventDefault();
    try {
      if (form.id) await api(`/products/${form.id}`, { method: 'PUT', body: form });
      else await api('/products', { method: 'POST', body: form });
      setForm(null);
      load();
    } catch (err) { setError(err.message); }
  };

  const del = async (p) => {
    if (!window.confirm(`Xóa "${p.name}"?`)) return;
    const res = await api(`/products/${p.id}`, { method: 'DELETE' });
    if (res.hidden) alert('Sản phẩm đã có đơn hàng nên được chuyển sang trạng thái ẩn.');
    load();
  };

  // Dùng AI sinh mô tả sản phẩm
  const genDescription = async () => {
    setAiLoading(true);
    try {
      const cat = categories.find((c) => String(c.id) === String(form.category_id))?.name;
      const res = await api('/ai/describe', { method: 'POST', body: { name: form.name, category: cat, keywords: form.description } });
      setForm((f) => ({ ...f, description: res.description }));
    } catch (err) { setError(err.message); }
    finally { setAiLoading(false); }
  };

  return (
    <>
      <div className="page-head">
        <h1>Sản phẩm</h1>
        <input placeholder="Tìm kiếm..." value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn" onClick={() => setForm(EMPTY)}>+ Thêm sản phẩm</button>
      </div>
      {error && <p className="error">{error}</p>}

      {form && (
        <form className="card form grid-form" onSubmit={save}>
          <h2>{form.id ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h2>
          <label>Tên<input required value={form.name} onChange={set('name')} /></label>
          <label>Danh mục
            <select value={form.category_id || ''} onChange={set('category_id')}>
              <option value="">-- Chọn --</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>Giá (đ)<input type="number" required min="0" value={form.price} onChange={set('price')} /></label>
          {!form.id && <label>Tồn kho ban đầu<input type="number" min="0" value={form.stock} onChange={set('stock')} /></label>}
          <label>Ngưỡng cảnh báo hết hàng<input type="number" min="0" value={form.low_stock_threshold} onChange={set('low_stock_threshold')} /></label>
          <label>Ảnh (URL)<input value={form.image_url || ''} onChange={set('image_url')} /></label>
          <label className="full">Mô tả
            <textarea rows={4} value={form.description || ''} onChange={set('description')} placeholder="Nhập vài từ khóa rồi bấm 'Viết bằng AI'" />
          </label>
          <button type="button" className="btn btn-outline" disabled={!form.name || aiLoading} onClick={genDescription}>
            {aiLoading ? 'AI đang viết...' : '🤖 Viết mô tả bằng AI'}
          </button>
          <label className="check"><input type="checkbox" checked={!!form.is_active} onChange={set('is_active')} /> Đang bán</label>
          <div className="full row">
            <button className="btn">Lưu</button>
            <button type="button" className="btn btn-outline" onClick={() => setForm(null)}>Hủy</button>
          </div>
        </form>
      )}

      <div className="card">
        <table className="table">
          <thead><tr><th></th><th>Tên</th><th>Danh mục</th><th>Giá</th><th>Tồn</th><th>Đã bán</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td><img src={p.image_url} alt="" className="thumb" /></td>
                <td>{p.name}</td>
                <td>{p.category_name}</td>
                <td>{vnd(p.price)}</td>
                <td className={p.stock <= p.low_stock_threshold ? 'error' : ''}>{p.stock}</td>
                <td>{p.sold}</td>
                <td>{p.is_active ? 'Đang bán' : <span className="muted">Ẩn</span>}</td>
                <td className="nowrap">
                  <button className="btn-link" onClick={() => setForm({ ...p, is_active: !!p.is_active })}>Sửa</button>
                  <button className="btn-link danger" onClick={() => del(p)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
