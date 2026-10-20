// Wrapper fetch gọi API backend, tự gắn JWT
export async function api(path, { method = 'GET', body, raw } = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (raw) return res;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Có lỗi xảy ra');
  return data;
}

// Tải file (CSV) có kèm token
export async function download(path, filename) {
  const res = await api(path, { raw: true });
  if (!res.ok) throw new Error('Không tải được file');
  const url = URL.createObjectURL(await res.blob());
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

export const vnd = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';
export const fmtDate = (d) => new Date(d).toLocaleString('vi-VN');

export const ORDER_STATUS = {
  pending: { label: 'Chờ xác nhận', color: 'orange' },
  confirmed: { label: 'Đã xác nhận', color: 'blue' },
  shipping: { label: 'Đang giao', color: 'purple' },
  completed: { label: 'Hoàn thành', color: 'green' },
  cancelled: { label: 'Đã hủy', color: 'red' },
};

export const NEXT_STATUS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipping', 'cancelled'],
  shipping: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};
