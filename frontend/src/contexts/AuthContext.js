import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const Ctx = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('eco_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me').then(r => setUser(r.data)).catch(() => localStorage.removeItem('eco_token')).finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const r = await api.post('/auth/login', { email, password });
    localStorage.setItem('eco_token', r.data.token);
    setUser(r.data.user);
    return r.data.user;
  }, []);

  const logout = useCallback(() => { localStorage.removeItem('eco_token'); setUser(null); }, []);

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
