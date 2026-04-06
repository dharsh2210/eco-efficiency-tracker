import React, { useState } from 'react';
import { Leaf, ShieldCheck, Zap, Droplets, Trash2, Eye, EyeOff, AlertCircle, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const QUICK = [
  { group: 'Admin',  email: 'john@campus.edu',      pw: 'john@campus.edu',      label: 'Sustainability Officer', icon: <ShieldCheck size={16} /> },
  { group: 'Energy', email: 'mike@energy.edu',       pw: 'mike@energy.edu',       label: 'Energy Technician',     icon: <Zap size={16} /> },
  { group: 'Energy', email: 'alex@energy.edu',       pw: 'alex@energy.edu',       label: 'NMC Member',            icon: <Zap size={16} /> },
  { group: 'Water',  email: 'tom@water.edu',         pw: 'tom@water.edu',         label: 'Plumbing Specialist',   icon: <Droplets size={16} /> },
  { group: 'Water',  email: 'irr@water.edu',         pw: 'irr@water.edu',         label: 'Irrigation Manager',    icon: <Droplets size={16} /> },
  { group: 'Waste',  email: 'manager@waste.edu',     pw: 'manager@waste.edu',     label: 'Waste Manager',         icon: <Trash2 size={16} /> },
  { group: 'Waste',  email: 'sanitation@waste.edu',  pw: 'sanitation@waste.edu',  label: 'Sanitation Officer',    icon: <Trash2 size={16} /> },
];

const GROUPS = [...new Set(QUICK.map(q => q.group))];

const ADMIN_PORTAL_PASSWORD = '1234';

const Login = () => {
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);

  // Admin states
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPw, setAdminPw] = useState('');
  const [showAdminPw, setShowAdminPw] = useState(false);
  const [adminPwError, setAdminPwError] = useState('');

  const doLogin = async (em, pw) => {
    setLoading(true);
    try { await login(em, pw); }
    finally { setLoading(false); }
  };

  const unlockAdmin = () => {
    if (adminPw === ADMIN_PORTAL_PASSWORD) {
      setAdminUnlocked(true);
      setAdminPwError('');
    } else {
      setAdminPwError('Incorrect admin portal password');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-emerald-950 flex items-center justify-center p-4">

      {/* Centered panel */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-6 space-y-5">

        {/* Header */}
        <div className="text-center text-white mb-2">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Leaf size={28} />
          </div>
          <h1 className="text-xl font-bold">Eco-Efficiency Tracker</h1>
          <p className="text-white/50 text-xs">Smart Campus Resource Management</p>
        </div>

        {/* Admin */}
        <div>
          <p className="text-white/50 text-xs font-bold uppercase mb-2">Admin</p>

          {!adminUnlocked ? (
            <div className="bg-white/10 border border-white/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-white/70 text-sm font-semibold">
                <Lock size={14} className="text-amber-400" />
                Admin Portal — Enter Access Password
              </div>

              {adminPwError && (
                <p className="text-red-400 text-xs">{adminPwError}</p>
              )}

              <div className="relative">
                <input
                  type={showAdminPw ? 'text' : 'password'}
                  value={adminPw}
                  onChange={e => setAdminPw(e.target.value)}
                  placeholder="Admin password"
                  className="w-full px-4 py-2.5 pr-9 bg-white/10 border border-white/20 rounded-xl text-white text-sm outline-none"
                />
                <button
                  onClick={() => setShowAdminPw(!showAdminPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40"
                >
                  {showAdminPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <button
                onClick={unlockAdmin}
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm rounded-xl"
              >
                Unlock Admin Access
              </button>
            </div>
          ) : (
            <button
              onClick={() => doLogin('john@campus.edu', 'john@campus.edu')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-amber-500/20 border border-amber-400/40 rounded-2xl"
            >
              <ShieldCheck size={16} className="text-amber-400" />
              <div>
                <p className="text-white text-sm font-semibold">Sustainability Officer</p>
                <p className="text-white/40 text-xs">john@campus.edu</p>
              </div>
            </button>
          )}
        </div>

        {/* Roles */}
        {GROUPS.filter(g => g !== 'Admin').map(g => (
          <div key={g}>
            <p className="text-white/50 text-xs font-bold uppercase mb-2">{g}</p>

            <div className="space-y-1.5">
              {QUICK.filter(q => q.group === g).map(q => (
                <button
                  key={q.email}
                  onClick={() => doLogin(q.email, q.pw)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl"
                >
                  <span className="text-white/60">{q.icon}</span>
                  <div>
                    <p className="text-white text-sm font-semibold">{q.label}</p>
                    <p className="text-white/40 text-xs">{q.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
};

export default Login;