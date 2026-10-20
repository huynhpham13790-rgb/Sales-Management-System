import { useEffect, useState } from 'react';
import { api, vnd } from '../../api';

export default function AISegments() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('');
  const [insight, setInsight] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api('/ai/segments').then(setData).catch((e) => setError(e.message)); }, []);

  const askAI = async () => {
    setLoadingAI(true);
    try {
      const res = await api('/ai/segments?insight=1');
      setInsight(res.insight || 'Chưa cấu hình GROQ_API_KEY. Xem gợi ý chăm sóc mặc định trên từng nhóm.');
    } catch (e) { setError(e.message); }
    finally { setLoadingAI(false); }
  };

  if (!data) return <p>{error || 'Đang tải...'}</p>;
  const customers = filter ? data.customers.filter((c) => c.segment === filter) : data.customers;
  return (
    <>
      <div className="page-head">
        <h1>🤖 Phân khúc khách hàng (RFM)</h1>
        <button className="btn" onClick={askAI} disabled={loadingAI}>{loadingAI ? 'AI đang phân tích...' : 'Đề xuất chiến dịch bằng AI'}</button>
      </div>
      <p className="muted">R = mức độ gần đây, F = tần suất mua, M = giá trị chi tiêu (thang điểm 1-5).</p>
      {insight && <div className="card ai-note pre">{insight}</div>}
      <div className="segments">
        {data.summary.map((s) => (
          <button key={s.key} className={`card seg ${filter === s.key ? 'active' : ''}`} onClick={() => setFilter(filter === s.key ? '' : s.key)}>
            <b>{s.label}</b>
            <span className="big">{s.count}</span>
            <span className="small">{vnd(s.revenue)}</span>
            <span className="muted small">{s.tip}</span>
          </button>
        ))}
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Khách hàng</th><th>Lần mua cuối</th><th>Số đơn</th><th>Chi tiêu</th><th>R-F-M</th><th>Phân khúc</th></tr></thead>
          <tbody>{customers.map((c) => (
            <tr key={c.id}>
              <td>{c.name}<div className="muted small">{c.email}</div></td>
              <td>{c.recency} ngày trước</td><td>{c.frequency}</td><td>{vnd(c.monetary)}</td>
              <td>{c.r}-{c.f}-{c.m}</td><td><span className="status blue">{c.segment_label}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </>
  );
}
