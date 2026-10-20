import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try { await register(form); nav('/'); } catch (err) { setError(err.message); }
  };

  return (
    <form className="card form narrow" onSubmit={submit}>
      <h1>Đăng ký</h1>
      <label>Họ tên</label><input required value={form.name} onChange={set('name')} />
      <label>Email</label><input type="email" required value={form.email} onChange={set('email')} />
      <label>Mật khẩu</label><input type="password" required minLength={6} value={form.password} onChange={set('password')} />
      <label>Số điện thoại</label><input value={form.phone} onChange={set('phone')} />
      <label>Địa chỉ</label><input value={form.address} onChange={set('address')} />
      {error && <p className="error">{error}</p>}
      <button className="btn">Tạo tài khoản</button>
      <p className="muted">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
    </form>
  );
}
