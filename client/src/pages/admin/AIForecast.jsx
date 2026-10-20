import { useEffect, useState } from 'react';
import { api } from '../../api';

const TREND = { up: '📈 Tăng', down: '📉 Giảm', flat: '➖ Ổn định' };

// Sparkline nhỏ thể hiện doanh số theo tuần
function Spark({ values }) {
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => `${(i / (values.length - 1 || 1)) * 100},${30 - (v / max) * 28}`).join(' ');
  return <svg viewBox="0 0 100 30" className="spark"><polyline points={pts} fill="none" strokeWidth="2" /></svg>;
}

export default function AIForecast() {
  const [horizon, setHorizon] = useState(14);
  const [data, setData] = useState(null);
  const [insight, setInsight] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api(`/ai/forecast?horizon=${horizon}`).then(setData).catch((e) => setError(e.message)); }, [horizon]);

  const askAI = async () => {
    setLoadingAI(true);
    try {
      const res = await api(`/ai/forecast?horizon=${horizon}&insight=1`);
      setInsight(res.insight || 'Chưa cấu hình GROQ_API_KEY nên không có nhận định AI. Bảng dự báo bên dưới vẫn được tính bằng thuật toán.');
    } catch (e) { setError(e.message); }
    finally { setLoadingAI(false); }
  };

  return (
    <>
      <div className="page-head">
        <h1>🤖 Dự báo nhu cầu</h1>
        <select value={horizon} onChange={(e) => setHorizon(Number(e.target.value))}>
          <option value={7}>7 ngày tới</option><option value={14}>14 ngày tới</option><option value={30}>30 ngày tới</option>
        </select>
        <button className="btn" onClick={askAI} disabled={loadingAI}>{loadingAI ? 'AI đang phân tích...' : 'Nhận định từ AI (Llama)'}</button>
      </div>
      <p className="muted">Dự báo dựa trên doanh số 60 ngày gần nhất (trung bình động có trọng số + xu hướng tuyến tính).</p>
      {error && <p className="error">{error}</p>}
      {insight && <div className="card ai-note pre">{insight}</div>}
      {data && (
        <div className="card">
          <table className="table">
            <thead><tr><th>Sản phẩm</th><th>Doanh số 9 tuần</th><th>Đã bán</th><th>Xu hướng</th><th>Dự báo {horizon} ngày</th><th>Tồn kho</th><th>Đủ bán (ngày)</th><th>Đề xuất nhập</th></tr></thead>
            <tbody>{data.items.map((i) => (
              <tr key={i.product_id}>
                <td>{i.name}</td>
                <td><Spark values={i.weekly} /></td>
                <td>{i.sold_history}</td>
                <td>{TREND[i.trend]}</td>
                <td>{i.forecast}</td>
                <td>{i.stock}</td>
                <td className={i.days_left !== null && i.days_left < horizon ? 'error' : ''}>{i.days_left ?? '∞'}</td>
                <td>{i.reorder > 0 ? <b className="error">+{i.reorder}</b> : '—'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </>
  );
}
