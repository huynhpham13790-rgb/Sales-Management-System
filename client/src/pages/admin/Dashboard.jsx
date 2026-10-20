import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, vnd } from '../../api';
import BarChart from '../../components/BarChart';

export default function Dashboard() {
  const [days, setDays] = useState(30);
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api(`/dashboard/summary?days=${days}`).then(setD).catch((e) => setError(e.message)); }, [days]);

  if (!d) return <p>{error || 'Đang tải...'}</p>;
  const maxCat = Math.max(...d.byCategory.map((c) => c.revenue), 1);
  return (
    <>
      <div className="page-head">
        <h1>Tổng quan</h1>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={7}>7 ngày</option><option value={30}>30 ngày</option><option value={90}>90 ngày</option>
        </select>
      </div>
      <div className="stats">
        <div className="stat"><span>Doanh thu (đơn hoàn thành)</span><b>{vnd(d.revenue)}</b></div>
        <div className="stat"><span>Số đơn hàng</span><b>{d.orders}</b></div>
        <div className="stat"><span>Đơn chờ xác nhận</span><b><Link to="/admin/orders?status=pending">{d.pending || 0}</Link></b></div>
        <div className="stat"><span>Đơn đã hủy</span><b>{d.cancelled || 0}</b></div>
        <div className="stat"><span>Khách mua hàng</span><b>{d.customers}</b></div>
        <div className={`stat ${d.low_stock ? 'warn' : ''}`}><span>Sắp hết hàng</span><b><Link to="/admin/inventory">{d.low_stock}</Link></b></div>
      </div>
      <div className="card">
        <h2>Doanh thu theo ngày</h2>
        <BarChart data={d.daily} valueKey="revenue" labelKey="day" format={vnd} />
      </div>
      <div className="layout-2col">
        <div className="card">
          <h2>Top sản phẩm bán chạy</h2>
          <table className="table">
            <thead><tr><th>Sản phẩm</th><th>SL</th><th>Doanh thu</th></tr></thead>
            <tbody>{d.topProducts.map((p) => <tr key={p.product_id}><td>{p.product_name}</td><td>{p.qty}</td><td>{vnd(p.revenue)}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="card">
          <h2>Doanh thu theo danh mục</h2>
          {d.byCategory.map((c) => (
            <div key={c.category} className="hbar">
              <span>{c.category}</span>
              <div><i style={{ width: `${(c.revenue / maxCat) * 100}%` }} /></div>
              <b>{vnd(c.revenue)}</b>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
