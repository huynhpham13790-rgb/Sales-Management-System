import { Link } from 'react-router-dom';
import { vnd } from '../api';
import { useCart } from '../context/CartContext';

export default function ProductCard({ p }) {
  const { add } = useCart();
  return (
    <div className="card product-card">
      <Link to={`/product/${p.id}`}>
        <img src={p.image_url || 'https://placehold.co/400x300?text=No+Image'} alt={p.name} loading="lazy" />
        <h3>{p.name}</h3>
      </Link>
      <div className="muted small">
        {p.avg_rating ? `★ ${p.avg_rating} (${p.review_count})` : 'Chưa có đánh giá'} · Đã bán {p.sold}
      </div>
      <div className="price">{vnd(p.price)}</div>
      <button className="btn" disabled={p.stock <= 0} onClick={() => add(p)}>
        {p.stock > 0 ? 'Thêm vào giỏ' : 'Hết hàng'}
      </button>
    </div>
  );
}
