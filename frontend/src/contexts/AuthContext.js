import React, { createContext, useContext, useState, useEffect } from 'react';

const Ctx = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000"; // fallback for local dev

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('eco_token');
    if (!token) { 
      setLoading(false); 
      return; 
    }

    fetch(`${API_URL}/auth/me`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => setUser(data.user))
    .catch(() => localStorage.removeItem('eco_token'))
    .finally(() => setLoading(false));
  }, [API_URL]);

  // Login function
  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Login failed");

    // Save token to localStorage for future requests
    if (data.token) localStorage.setItem('eco_token', data.token);

    setUser(data.user);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('eco_token');
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, login, logout }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
