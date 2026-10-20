import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('token')) return setReady(true);
    api('/auth/me').then(setUser).catch(() => localStorage.removeItem('token')).finally(() => setReady(true));
  }, []);

  const handleAuth = ({ token, user }) => {
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  };

  const value = {
    user,
    ready,
    isStaff: ['admin', 'staff'].includes(user?.role),
    login: (email, password) => api('/auth/login', { method: 'POST', body: { email, password } }).then(handleAuth),
    register: (data) => api('/auth/register', { method: 'POST', body: data }).then(handleAuth),
    logout: () => { localStorage.removeItem('token'); setUser(null); },
    setUser,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
