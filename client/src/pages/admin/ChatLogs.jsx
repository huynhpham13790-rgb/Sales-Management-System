import { useEffect, useState } from 'react';
import { api, fmtDate } from '../../api';

export default function ChatLogs() {
  const [logs, setLogs] = useState([]);
  useEffect(() => { api('/ai/chat-logs').then(setLogs).catch(() => {}); }, []);
  return (
    <>
      <h1>🤖 Lịch sử chatbot</h1>
      <p className="muted">Theo dõi câu hỏi khách hàng để hiểu nhu cầu và cải thiện chatbot.</p>
      <div className="card">
        {logs.map((l) => (
          <div key={l.id} className="review">
            <div className="muted small">{fmtDate(l.created_at)} · {l.user_name || 'Khách vãng lai'}</div>
            <p><b>Hỏi:</b> {l.question}</p>
            <p className="pre"><b>Đáp:</b> {l.answer}</p>
          </div>
        ))}
        {!logs.length && <p className="muted">Chưa có hội thoại nào.</p>}
      </div>
    </>
  );
}
