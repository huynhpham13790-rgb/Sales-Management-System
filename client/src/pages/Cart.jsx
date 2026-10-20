import { Link } from 'react-router-dom';
import { vnd } from '../api';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { items, update, remove, subtotal } = useCart();
  if (!items.length) return <div className="card center"><p>Giỏ hàng trống.</p><Link to="/" className="btn">Tiếp tục mua sắm</Link></div>;
  return (
    <div className="card">
      <h1>Giỏ hàng</h1>
      <table className="table">
        <thead><tr><th>Sản phẩm</th><th>Đơn giá</th><th>Số lượng</th><th>Thành tiền</th><th></th></tr></thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td><Link to={`/product/${i.id}`}>{i.name}</Link></td>
              <td>{vnd(i.price)}</td>
              <td><input type="number" min="1" max={i.stock} value={i.quantity} onChange={(e) => update(i.id, Number(e.target.value))} style={{ width: 70 }} /></td>
              <td>{vnd(i.price * i.quantity)}</td>
              <td><button className="btn-link danger" onClick={() => remove(i.id)}>Xóa</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="cart-footer">
        <span>Tạm tính: <b className="price">{vnd(subtotal)}</b></span>
        <Link to="/checkout" className="btn">Thanh toán</Link>
      </div>
    </div>
  );
}
