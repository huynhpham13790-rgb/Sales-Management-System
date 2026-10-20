import { vnd, fmtDate, ORDER_STATUS } from '../api';

const STEPS = ['pending', 'confirmed', 'shipping', 'completed'];

export function StatusBadge({ status }) {
  const s = ORDER_STATUS[status];
  return <span className={`status ${s.color}`}>{s.label}</span>;
}

// Thẻ hiển thị đơn hàng kèm thanh tiến trình trạng thái
export default function OrderCard({ order, actions }) {
  const step = STEPS.indexOf(order.status);
  return (
    <div className="card order">
      <div className="order-head">
        <b>#{order.code}</b> <StatusBadge status={order.status} />
        <span className="muted small">{fmtDate(order.created_at)}</span>
      </div>
      {order.status !== 'cancelled' && (
        <div className="progress">
          {STEPS.map((s, i) => <div key={s} className={i <= step ? 'done' : ''}>{ORDER_STATUS[s].label}</div>)}
        </div>
      )}
      {order.items.map((i) => (
        <div key={i.id} className="line"><span>{i.product_name} × {i.quantity}</span><span>{vnd(i.price * i.quantity)}</span></div>
      ))}
      {order.discount > 0 && <div className="line ok"><span>Giảm giá ({order.coupon_code})</span><span>-{vnd(order.discount)}</span></div>}
      <div className="line total"><span>{order.customer_name} · {order.phone} · {order.address}</span><span className="price">{vnd(order.total)}</span></div>
      {actions}
    </div>
  );
}
