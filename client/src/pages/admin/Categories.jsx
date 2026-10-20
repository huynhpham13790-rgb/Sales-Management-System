import { useEffect, useState } from 'react';
import { api } from '../../api';

export default function Categories() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const load = () => api('/categories').then(setItems).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const run = (fn) => fn().then(load).catch((e) => setError(e.message));
  const add = (e) => { e.preventDefault(); run(() => api('/categories', { method: 'POST', body: { name } })); setName(''); };
  const rename = (c) => {
    const n = window.prompt('Tên mới', c.name);
    if (n) run(() => api(`/categories/${c.id}`, { method: 'PUT', body: { name: n } }));
  };
  const del = (c) => window.confirm(`Xóa danh mục "${c.name}"? Sản phẩm sẽ không còn danh mục.`) && run(() => api(`/categories/${c.id}`, { method: 'DELETE' }));

  return (
    <>
      <h1>Danh mục</h1>
      <form className="card row" onSubmit={add}>
        <input required placeholder="Tên danh mục mới" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn">Thêm</button>
      </form>
      {error && <p className="error">{error}</p>}
      <div className="card">
        <table className="table">
          <thead><tr><th>Tên</th><th>Slug</th><th>Số sản phẩm</th><th></th></tr></thead>
          <tbody>{items.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td><td className="muted">{c.slug}</td><td>{c.product_count}</td>
              <td className="nowrap"><button className="btn-link" onClick={() => rename(c)}>Sửa</button><button className="btn-link danger" onClick={() => del(c)}>Xóa</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </>
  );
}
