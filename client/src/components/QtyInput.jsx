import { useEffect, useState } from 'react';

// Ô số lượng cho phép xóa trắng tạm thời khi gõ; giá trị được giới hạn trong [1, max] khi rời ô
export default function QtyInput({ value, max, onChange, ...props }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const clamp = (n) => Math.max(1, Math.min(max, Math.floor(n) || 1));
  const handleChange = (e) => {
    const raw = e.target.value;
    // Vượt tồn kho thì hiện ngay số tối đa
    setDraft(raw !== '' && Number(raw) > max ? String(max) : raw);
    if (raw !== '' && Number(raw) >= 1) onChange(clamp(Number(raw)));
  };
  const handleBlur = () => {
    const n = clamp(Number(draft));
    setDraft(String(n));
    onChange(n);
  };

  return <input type="number" min="1" max={max} value={draft} onChange={handleChange} onBlur={handleBlur} {...props} />;
}
