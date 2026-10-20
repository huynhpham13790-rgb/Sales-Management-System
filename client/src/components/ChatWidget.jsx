import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, vnd } from '../api';

// Chatbot AI tư vấn bán hàng (Groq/Llama, có chế độ dự phòng khi không có API key)
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Xin chào! Mình là trợ lý AI của SalesFlow. Bạn đang tìm sản phẩm gì?' },
  ]);
  const endRef = useRef(null);
  // Bọc trong {} để effect không trả về giá trị: Chrome mới cho scrollIntoView trả về Promise, React coi đó là hàm cleanup và làm sập trang
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    try {
      const res = await api('/ai/chat', { method: 'POST', body: { message: text, history } });
      setMessages((m) => [...m, { role: 'assistant', content: res.answer, products: res.products }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: 'Xin lỗi, có lỗi xảy ra: ' + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-box">
          <div className="chat-head">Trợ lý AI <button onClick={() => setOpen(false)}>✕</button></div>
          <div className="chat-body">
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                <div className="bubble">{m.content}</div>
                {m.products?.length > 0 && (
                  <div className="chat-products">
                    {m.products.map((p) => <Link key={p.id} to={`/product/${p.id}`}>{p.name} · {vnd(p.price)}</Link>)}
                  </div>
                )}
              </div>
            ))}
            {loading && <div className="msg assistant"><div className="bubble">Đang trả lời...</div></div>}
            <div ref={endRef} />
          </div>
          <form className="chat-input" onSubmit={send}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Hỏi về sản phẩm, giá, giao hàng..." />
            <button className="btn" disabled={loading}>Gửi</button>
          </form>
        </div>
      )}
      <button className="chat-fab" onClick={() => setOpen((o) => !o)} aria-label="Mở chatbot">💬</button>
    </div>
  );
}
