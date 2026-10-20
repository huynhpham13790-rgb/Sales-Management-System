import { useEffect, useState } from 'react';
import { api } from '../api';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ q: '', category: '', min: '', max: '', sort: 'newest', page: 1 });
  const [data, setData] = useState({ items: [], pages: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { api('/categories').then(setCategories).catch(() => {}); }, []);

  useEffect(() => {
    const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v !== '')).toString();
    setLoading(true);
    const t = setTimeout(() => {
      api(`/products?${qs}`).then((d) => { setData(d); setError(''); }).catch((e) => setError(e.message)).finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [filters]);

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value, page: k === 'page' ? Number(e.target.value) : 1 }));

  return (
    <>
      <section className="hero">
        <h1>Mua sắm thông minh cùng SalesFlow AI</h1>
        <p>Hỏi trợ lý AI ở góc phải màn hình để được tư vấn sản phẩm phù hợp.</p>
      </section>

      <div className="layout-sidebar">
        <aside className="card filters">
          <input placeholder="Tìm sản phẩm..." value={filters.q} onChange={set('q')} />
          <label>Danh mục</label>
          <select value={filters.category} onChange={set('category')}>
            <option value="">Tất cả</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label>Khoảng giá (đ)</label>
          <div className="row">
            <input type="number" placeholder="Từ" value={filters.min} onChange={set('min')} />
            <input type="number" placeholder="Đến" value={filters.max} onChange={set('max')} />
          </div>
          <label>Sắp xếp</label>
          <select value={filters.sort} onChange={set('sort')}>
            <option value="newest">Mới nhất</option>
            <option value="best_selling">Bán chạy</option>
            <option value="rating">Đánh giá cao</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
          </select>
        </aside>

        <section>
          {error && <p className="error">{error}</p>}
          <p className="muted">{loading ? 'Đang tải...' : `${data.total} sản phẩm`}</p>
          <div className="grid">{data.items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          {data.pages > 1 && (
            <div className="pagination">
              {Array.from({ length: data.pages }, (_, i) => (
                <button key={i} className={filters.page === i + 1 ? 'active' : ''} onClick={() => { setFilters((f) => ({ ...f, page: i + 1 })); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{i + 1}</button>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
