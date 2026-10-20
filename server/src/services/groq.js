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
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages,
        temperature,
        max_tokens: maxTokens,
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      console.error('Groq error', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.error('Groq request failed:', e.message);
    return null;
  }
}
