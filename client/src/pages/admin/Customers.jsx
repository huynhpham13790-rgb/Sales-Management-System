import { useEffect, useState } from 'react';
import { api, vnd, fmtDate } from '../../api';
import { useAuth } from '../../context/AuthContext';

const ROLES = { admin: 'Quản trị', staff: 'Nhân viên', customer: 'Khách hàng' };

export default function Customers() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';
  const [role, setRole] = useState('customer');
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');

  const load = () => api(`/users${role ? `?role=${role}` : ''}`).then(setItems).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [role]);

  const run = (fn) => fn().then(() => { setError(''); load(); }).catch((e) => setError(e.message));
  const toggle = (u) => run(() => api(`/users/${u.id}`, { method: 'PATCH', body: { is_active: !u.is_active } }));
  const changeRole = (u, r) => run(() => api(`/users/${u.id}`, { method: 'PATCH', body: { role: r } }));
  const create = (e) => { e.preventDefault(); run(() => api('/users', { method: 'POST', body: form })).then(() => setForm(null)); };

  return (
    <>
      <div className="page-head">
        <h1>Người dùng</h1>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Tất cả</option>
          {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {isAdmin && <button className="btn" onClick={() => setForm({ name: '', email: '', password: '', role: 'staff' })}>+ Tạo tài khoản nhân viên</button>}
      </div>
      {error && <p className="error">{error}</p>}
      {form && (
        <form className="card row wrap" onSubmit={create}>
          <input required placeholder="Họ tên" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input required minLength={6} type="password" placeholder="Mật khẩu" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="staff">Nhân viên</option><option value="admin">Quản trị</option>
          </select>
          <button className="btn">Tạo</button>
          <button type="button" className="btn btn-outline" onClick={() => setForm(null)}>Hủy</button>
        </form>
      )}
      <div className="card">
        <table className="table">
          <thead><tr><th>Tên</th><th>Liên hệ</th><th>Vai trò</th><th>Số đơn</th><th>Tổng chi tiêu</th><th>Đơn gần nhất</th><th>Trạng thái</th></tr></thead>
          <tbody>{items.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td className="small">{u.email}<div className="muted">{u.phone}</div></td>
              <td>
                {isAdmin && u.id !== user.id ? (
                  <select value={u.role} onChange={(e) => changeRole(u, e.target.value)}>
                    {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                ) : ROLES[u.role]}
              </td>
              <td>{u.order_count}</td>
              <td>{vnd(u.total_spent)}</td>
              <td className="small">{u.last_order ? fmtDate(u.last_order) : '-'}</td>
              <td>
                {isAdmin && u.id !== user.id
                  ? <button className={`btn-small ${u.is_active ? '' : 'danger'}`} onClick={() => toggle(u)}>{u.is_active ? 'Hoạt động' : 'Đã khóa'}</button>
                  : (u.is_active ? 'Hoạt động' : 'Đã khóa')}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </>
  );
}
