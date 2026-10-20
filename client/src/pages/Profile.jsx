import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', address: user.address || '', password: '' });
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      setUser(await api('/auth/me', { method: 'PUT', body: form }));
      setForm((f) => ({ ...f, password: '' }));
      setMsg('Đã cập nhật thông tin');
    } catch (err) { setMsg(err.message); }
  };

  return (
    <form className="card form narrow" onSubmit={submit}>
      <h1>Tài khoản</h1>
      <p className="muted">{user.email}</p>
      <label>Họ tên<input required value={form.name} onChange={set('name')} /></label>
      <label>Số điện thoại<input value={form.phone} onChange={set('phone')} /></label>
      <label>Địa chỉ<input value={form.address} onChange={set('address')} /></label>
      <label>Mật khẩu mới (để trống nếu không đổi)<input type="password" value={form.password} onChange={set('password')} /></label>
      {msg && <p className="muted">{msg}</p>}
      <button className="btn">Lưu</button>
    </form>
  );
}
