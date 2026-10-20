import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, vnd, fmtDate } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import QtyInput from '../components/QtyInput';

export default function ProductDetail() {
  const { id } = useParams();
  const { add } = useCart();
  const { user } = useAuth();
  const [p, setP] = useState(null);
  const [qty, setQty] = useState(1);
  const [summary, setSummary] = useState(null);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [msg, setMsg] = useState('');

  const load = () => {
    api(`/products/${id}`).then(setP).catch((e) => setMsg(e.message));
    api(`/ai/review-summary/${id}`).then((r) => setSummary(r.summary)).catch(() => {});
  };
  useEffect(() => { setQty(1); load(); }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await api(`/products/${id}/reviews`, { method: 'POST', body: review });
      setMsg('Cảm ơn bạn đã đánh giá!');
      setReview({ rating: 5, comment: '' });
      load();
    } catch (err) { setMsg(err.message); }
  };

  if (!p) return <p className="center">{msg || 'Đang tải...'}</p>;
  return (
    <>
      <div className="card detail">
        <img src={p.image_url || 'https://placehold.co/400x300?text=No+Image'} alt={p.name} />
        <div>
          <p className="muted">{p.category_name}</p>
          <h1>{p.name}</h1>
          <p className="muted">{p.avg_rating ? `★ ${p.avg_rating}/5 (${p.review_count} đánh giá)` : 'Chưa có đánh giá'} · Đã bán {p.sold}</p>
          <div className="price big">{vnd(p.price)}</div>
          <p>{p.description}</p>
          <p className={p.stock > 0 ? 'ok' : 'error'}>{p.stock > 0 ? `Còn ${p.stock} sản phẩm` : 'Hết hàng'}</p>
          {p.stock > 0 && (
            <div className="row">
              <QtyInput value={qty} max={p.stock} onChange={setQty} style={{ width: 80 }} aria-label="Số lượng" />
              <button className="btn" onClick={() => add(p, qty)}>Thêm vào giỏ</button>
            </div>
          )}
        </div>
      </div>

      {p.related?.length > 0 && (
        <section className="card">
          <h2>Thường được mua cùng</h2>
          <div className="related">
            {p.related.map((r) => (
              <Link key={r.id} to={`/product/${r.id}`} className="related-item">
                <img src={r.image_url} alt={r.name} /><span>{r.name}</span><b>{vnd(r.price)}</b>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <h2>Đánh giá sản phẩm</h2>
        {summary && <p className="ai-note">🤖 Tóm tắt AI: {summary}</p>}
        {p.reviews.map((r) => (
          <div key={r.id} className="review">
            <b>{r.user_name}</b> <span className="stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
            <span className="muted small"> · {fmtDate(r.created_at)}</span>
            <p>{r.comment}</p>
          </div>
        ))}
        {user ? (
          <form onSubmit={submitReview} className="review-form">
            <select value={review.rating} onChange={(e) => setReview({ ...review, rating: Number(e.target.value) })}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} sao</option>)}
            </select>
            <input placeholder="Nhận xét của bạn" value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })} />
            <button className="btn">Gửi đánh giá</button>
          </form>
        ) : <p className="muted"><Link to="/login">Đăng nhập</Link> để đánh giá sản phẩm đã mua.</p>}
        {msg && <p className="muted">{msg}</p>}
      </section>
    </>
  );
}
