import { Fragment, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, download, vnd, fmtDate, ORDER_STATUS, NEXT_STATUS } from '../../api';
import { StatusBadge } from '../../components/OrderCard';

export default function Orders() {
  const [params] = useSearchParams();
  const [filters, setFilters] = useState({ status: params.get('status') || '', q: '', from: '', to: '' });
  const [orders, setOrders] = useState([]);
  const [open, setOpen] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
    api(`/orders?${qs}`).then(setOrders).catch((e) => setError(e.message));
  };
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [filters]);

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });
  const changeStatus = async (o, status) => {
    if (status === 'cancelled' && !window.confirm(`Hủy đơn #${o.code}? Hàng sẽ được hoàn về kho.`)) return;
    try { await api(`/orders/${o.id}/status`, { method: 'PATCH', body: { status } }); setError(''); load(); }
    catch (e) { setError(e.message); }
  };

  return (
    <>
      <div className="page-head">
        <h1>Đơn hàng</h1>
        <button className="btn btn-outline" onClick={() => download('/orders/export/csv', 'don-hang.csv').catch((e) => setError(e.message))}>⬇ Xuất Excel (CSV)</button>
      </div>
      <div className="card row wrap">
        <input placeholder="Mã đơn, tên, SĐT..." value={filters.q} onChange={set('q')} />
        <select value={filters.status} onChange={set('status')}>
          <option value="">Mọi trạng thái</option>
          {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <label className="row">Từ <input type="date" value={filters.from} onChange={set('from')} /></label>
        <label className="row">Đến <input type="date" value={filters.to} onChange={set('to')} /></label>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="card">
        <table className="table">
          <thead><tr><th>Mã</th><th>Ngày</th><th>Khách hàng</th><th>Tổng</th><th>TT</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <Fragment key={o.id}>
                <tr onClick={() => setOpen(open === o.id ? null : o.id)} className="clickable">
                  <td>#{o.code}</td>
                  <td className="small">{fmtDate(o.created_at)}</td>
                  <td>{o.customer_name}<div className="muted small">{o.phone}</div></td>
                  <td>{vnd(o.total)}</td>
                  <td>{o.payment_method.toUpperCase()}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="nowrap" onClick={(e) => e.stopPropagation()}>
                    {NEXT_STATUS[o.status].map((s) => (
                      <button key={s} className={`btn-small ${s === 'cancelled' ? 'danger' : ''}`} onClick={() => changeStatus(o, s)}>
                        {ORDER_STATUS[s].label}
                      </button>
                    ))}
                  </td>
                </tr>
                {open === o.id && (
                  <tr className="detail-row">
                    <td colSpan={7}>
                      <div>Địa chỉ: {o.address}{o.note && ` · Ghi chú: ${o.note}`}</div>
                      {o.items.map((i) => <div key={i.id} className="line"><span>{i.product_name} × {i.quantity}</span><span>{vnd(i.price * i.quantity)}</span></div>)}
                      {o.discount > 0 && <div className="line ok"><span>Giảm giá {o.coupon_code}</span><span>-{vnd(o.discount)}</span></div>}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {!orders.length && <p className="muted center">Không có đơn hàng</p>}
      </div>
    </>
  );
}
