// Gọi Groq Chat Completions API (tương thích OpenAI) với mô hình Llama.
// Không có GROQ_API_KEY thì trả về null để các tính năng dùng thuật toán dự phòng.
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const groqEnabled = () => Boolean(process.env.GROQ_API_KEY);

export async function chat(messages, { temperature = 0.4, maxTokens = 700, json = false } = {}) {
  if (!groqEnabled()) return null;
  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
        messages,
        temperature,
        max_tokens: maxTokens,
        // gpt-oss là mô hình suy luận: giảm mức suy luận để trả lời nhanh, không tốn token
        ...(/gpt-oss/.test(process.env.GROQ_MODEL || 'gpt-oss') ? { reasoning_effort: 'low' } : {}),
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      console.error('Groq error', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    // Giao diện hiển thị text thường nên bỏ ký hiệu markdown (**đậm**, *nghiêng*, ## tiêu đề)
    const text = data.choices?.[0]?.message?.content
      ?.replace(/\*\*|__|^#+\s*/gm, '')
      .replace(/(^|[^\w*])\*([^*\n]+)\*(?=[^\w*]|$)/gm, '$1$2')
      // Đổi gạch nối/khoảng trắng đặc biệt (U+2010–2011, U+202F, U+00A0) về ký tự thường để so khớp tên sản phẩm
      .replace(/[‐‑]/g, '-').replace(/[  ]/g, ' ')
      .trim();
    return text || null;
  } catch (e) {
    console.error('Groq request failed:', e.message);
    return null;
  }
}
