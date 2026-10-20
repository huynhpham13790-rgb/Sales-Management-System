import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(form.email, form.password);
      nav(['admin', 'staff'].includes(user.role) ? '/admin' : '/');
    } catch (err) { setError(err.message); }
  };

  return (
    <form className="card form narrow" onSubmit={submit}>
      <h1>Đăng nhập</h1>
      <label>Email</label><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <label>Mật khẩu</label><input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      {error && <p className="error">{error}</p>}
      <button className="btn">Đăng nhập</button>
      <p className="muted">Chưa có tài khoản? <Link to="/register">Đăng ký</Link></p>
      <p className="muted small">Demo: admin@salesflow.vn / admin123 · an@gmail.com / 123456</p>
    </form>
  );
}
