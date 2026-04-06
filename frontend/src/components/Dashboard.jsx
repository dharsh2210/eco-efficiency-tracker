import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ResourceType, UserRole } from '../types';
import { RESOURCE_CONFIG, ROLE_LAYERS, ROLE_GROUPS, ROLE_TO_DOMAIN, FIELD_ROLES } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
  TrendingUp, TrendingDown, AlertTriangle, AlertCircle, RefreshCw,
  Zap, Droplets, Trash2, Activity, Wrench, ClipboardList,
  CheckCircle2, Gauge, Calendar, BarChart3, PieChart as PieIcon,
  LayoutDashboard, X, Sparkles
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const fmt = (n) => Number(n || 0).toLocaleString();

function dailyBuckets(raw, days = 7) {
  const now = new Date();
  const buckets = Array.from({ length: days }, (_, i) => {
    const d = new Date(now); d.setDate(now.getDate() - (days - 1 - i));
    return { date: d.toISOString().split('T')[0], label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }), value: 0 };
  });
  (raw || []).forEach(r => { const b = buckets.find(b => b.date === r._id.date); if (b) b.value += r.value; });
  return buckets;
}

function weeklyBuckets(raw) {
  const now = new Date();
  const weeks = Array.from({ length: 4 }, (_, i) => {
    const end = new Date(now); end.setDate(now.getDate() - i * 7);
    const start = new Date(end); start.setDate(end.getDate() - 6);
    return { label: `Week ${4 - i}`, s: start.toISOString().split('T')[0], e: end.toISOString().split('T')[0], value: 0 };
  }).reverse();
  (raw || []).forEach(r => { const w = weeks.find(w => r._id.date >= w.s && r._id.date <= w.e); if (w) w.value += r.value; });
  return weeks;
}

// ── Strategic View (Officer, NMC Member, Irrigation Manager, Waste Manager) ──
const StrategicView = ({ stats, weekly, monthly, user, view, setView }) => {
  const visibleTypes = useMemo(() => {
    if (user.role === UserRole.OFFICER) return Object.values(ResourceType);
    const d = ROLE_TO_DOMAIN[user.role];
    return d ? [d] : Object.values(ResourceType);
  }, [user.role]);

  const byType = useMemo(() => { const m = {}; (stats || []).forEach(s => { m[s._id] = s; }); return m; }, [stats]);
  const chartData = view === 'weekly' ? dailyBuckets(weekly) : weeklyBuckets(monthly);

  const elecTotal  = byType['ELECTRICITY'] ? Math.round(byType['ELECTRICITY'].total) : 0;
  const waterTotal = byType['WATER']       ? Math.round(byType['WATER'].total)       : 0;
  const wasteTotal = byType['WASTE']       ? Math.round(byType['WASTE'].total)       : 0;

  return (
    <div className="space-y-6">
      {/* Resource totals row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: <Zap size={20} />,
            iconBg: 'bg-yellow-50 text-yellow-600',
            label: 'Total Electricity',
            value: fmt(elecTotal),
            unit: 'kWh',
          },
          {
            icon: <Droplets size={20} />,
            iconBg: 'bg-blue-50 text-blue-600',
            label: 'Total Water',
            value: fmt(waterTotal),
            unit: 'Liters',
          },
          {
            icon: <Trash2 size={20} />,
            iconBg: 'bg-emerald-50 text-emerald-600',
            label: 'Total Waste',
            value: fmt(wasteTotal),
            unit: 'Kg',
          },
        ].map((c, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${c.iconBg}`}>{c.icon}</div>
            </div>
            <p className="text-slate-500 text-xs font-medium">{c.label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{c.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{c.unit}</p>
          </div>
        ))}
      </div>

      {/* Chart with weekly/monthly toggle */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-600" />Consumption Trend
          </h3>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {['weekly', 'monthly'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all capitalize ${view === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#areaGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-type summary — only types this role can see */}
      <div className={`grid gap-4 ${visibleTypes.length === 1 ? 'grid-cols-1 max-w-sm' : visibleTypes.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
        {visibleTypes.map(type => {
          const cfg = RESOURCE_CONFIG[type];
          const s = byType[type];
          return (
            <div key={type} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className={`p-3 ${cfg.bgClass} rounded-xl`}>{cfg.icon}</div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{cfg.label}</p>
                <p className="text-xl font-bold text-slate-800">
                  {s ? fmt(Math.round(s.total)) : '—'} <span className="text-sm font-normal text-slate-400">{cfg.unit}</span>
                </p>
                <p className="text-xs text-slate-400">
                  {s ? `${s.count} entries · avg ${fmt(Math.round(s.avg))} ${cfg.unit}` : 'No data yet'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Field View (Energy Technician, Plumbing Specialist, Sanitation Officer) ──
// Shows ONLY tickets assigned to this exact role + ONLY this role's system
const FieldView = ({ user, tickets, onUpdate }) => {
  const domainType = ROLE_TO_DOMAIN[user.role] || ResourceType.WASTE;
  const cfg = RESOURCE_CONFIG[domainType] || RESOURCE_CONFIG[ResourceType.WASTE];
  const systemLabel = domainType === 'ELECTRICITY' ? 'Energy Grid' : domainType === 'WATER' ? 'Water Network' : 'Waste Systems';

  const open = (tickets || []).filter(t => t.status !== 'COMPLETED');
  const hasCrit = open.some(t => t.priority === 'CRITICAL');
  const sysStatus = open.length === 0 ? 'HEALTHY' : hasCrit ? 'CRITICAL' : 'WARNING';

  const statusStyles = {
    HEALTHY:  { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-600', width: '100%' },
    CRITICAL: { bar: 'bg-red-500',     badge: 'bg-red-50 text-red-600',         width: '25%'  },
    WARNING:  { bar: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-600',     width: '60%'  },
  };
  const ss = statusStyles[sysStatus];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Ticket list — 2 cols */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList size={18} className="text-emerald-600" />
            My Tickets — {cfg.label}
          </h3>
          <span className="text-xs font-bold text-slate-400">{(tickets || []).length} assigned</span>
        </div>

        {(tickets || []).length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center">
            <CheckCircle2 size={40} className="mx-auto text-emerald-200 mb-3" />
            <p className="text-slate-500 font-semibold">All clear — no tickets assigned</p>
          </div>
        ) : (tickets || []).map(task => (
          <div key={task._id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-200 transition-all">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl shrink-0 ${task.priority === 'CRITICAL' ? 'bg-red-50 text-red-600' : task.priority === 'HIGH' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'}`}>
                  {task.priority === 'CRITICAL' || task.priority === 'HIGH' ? <AlertTriangle size={18} /> : <Wrench size={18} />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-slate-800 text-sm">{task.title}</h4>
                    {task.escalationLevel > 0 && (
                      <span className="text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-black uppercase">L{task.escalationLevel}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                </div>
              </div>
              <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${
                task.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600' :
                task.status === 'COMPLETED'   ? 'bg-emerald-50 text-emerald-600' :
                task.status === 'OVERDUE'     ? 'bg-red-50 text-red-600' :
                                                'bg-slate-50 text-slate-500'}`}>
                {task.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Calendar size={12} />Due {new Date(task.deadline).toLocaleDateString()}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  task.priority === 'CRITICAL' ? 'bg-red-50 text-red-600' :
                  task.priority === 'HIGH'     ? 'bg-amber-50 text-amber-600' :
                                                  'bg-slate-50 text-slate-500'}`}>
                  {task.priority}
                </span>
              </div>
              {task.status !== 'COMPLETED' && (
                <button onClick={() => onUpdate(task._id, 'COMPLETED', 'Issue resolved in field.')}
                  className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-all flex items-center gap-1">
                  <CheckCircle2 size={12} />Resolve
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* System status — 1 col — ONLY this role's system */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Gauge size={18} className="text-blue-600" />My System Status
        </h3>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${cfg.bgClass} rounded-lg`}>{cfg.icon}</div>
              <span className="font-bold text-slate-800 text-sm">{systemLabel}</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${ss.badge}`}>{sysStatus}</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-1000 ${ss.bar}`} style={{ width: ss.width }}></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Pending',     val: (tickets || []).filter(t => t.status === 'PENDING').length,     c: 'text-slate-700' },
              { label: 'In Progress', val: (tickets || []).filter(t => t.status === 'IN_PROGRESS').length, c: 'text-blue-600'  },
              { label: 'Overdue',     val: (tickets || []).filter(t => t.status === 'OVERDUE').length,     c: 'text-red-500'   },
            ].map(s => (
              <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
                <p className={`text-xl font-bold ${s.c}`}>{s.val}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          {open.length > 0 && (
            <p className="text-xs text-slate-400 text-center">{open.length} open ticket{open.length > 1 ? 's' : ''} need attention</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ── AI Insights ────────────────────────────────────────────────────────────
const AIInsights = ({ stats }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const generate = async () => {
    setLoading(true); setError('');
    try {
      const summary = (stats || []).map(s => `${s._id}: total=${Math.round(s.total)}, avg=${Math.round(s.avg)}, entries=${s.count}`).join('; ');
      const prompt = `You are an eco-efficiency analyst for a university campus. Campus resource data: ${summary || 'no data yet'}. Generate exactly 3 short actionable sustainability tips as a JSON array of strings. Output only the JSON array.`;
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 400, messages: [{ role: 'user', content: prompt }] })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || '[]';
      setInsights(JSON.parse(text.replace(/```json|```/g, '').trim()));
    } catch (e) { setError('Could not generate insights.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Sparkles size={18} className="text-emerald-600" />AI Eco-Efficiency Insights
        </h3>
        <button onClick={generate} disabled={loading}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Analyzing...' : 'Generate'}
        </button>
      </div>
      {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
      {!loading && insights.length === 0 && (
        <p className="text-slate-500 text-sm">Click "Generate" for AI-powered recommendations based on your campus data.</p>
      )}
      {loading && <p className="text-slate-500 text-sm flex items-center gap-2"><RefreshCw size={14} className="animate-spin" />Analyzing campus data...</p>}
      <div className="space-y-2 mt-2">
        {insights.map((tip, i) => (
          <div key={i} className="flex items-start gap-3 bg-white/70 rounded-xl p-3">
            <div className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">{i + 1}</div>
            <p className="text-sm text-slate-700">{tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main Dashboard ─────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const [statsData, setStatsData] = useState({ stats: [], weekly: [], monthly: [], byLocation: [] });
  const [alerts, setAlerts]       = useState([]);
  const [tickets, setTickets]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView]           = useState('weekly');

  const userDomain = ROLE_TO_DOMAIN[user.role] || null;
  const [report, setReport] = useState({ domain: userDomain || ResourceType.ELECTRICITY, location: '', description: '' });

  // STRATEGIC for officer + NMC + Irrigation + Waste Manager; FIELD for technicians
  const userLayer = ROLE_LAYERS[user.role] || (FIELD_ROLES.includes(user.role) ? 'FIELD' : 'STRATEGIC');
  const userGroupLabel = user.role === UserRole.OFFICER ? 'Sustainability Officer'
    : Object.values(ROLE_GROUPS).find(g => g.roles.includes(user.role))?.label || user.role.replace(/_/g, ' ');

  const fetchAlerts = useCallback(async () => {
    try {
      const [aRes, tRes] = await Promise.all([api.get('/alerts'), api.get('/tickets')]);
      setAlerts(aRes.data);
      setTickets(tRes.data);
    } catch (e) { console.error(e); }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, aRes, tRes] = await Promise.all([
        api.get('/entries/stats'),
        api.get('/alerts'),
        api.get('/tickets'),
      ]);
      setStatsData(sRes.data);
      setAlerts(aRes.data);
      setTickets(tRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  // Re-fetch alerts 2s after a new entry is saved (trend check needs time)
  useEffect(() => {
    const handler = () => setTimeout(fetchAlerts, 2000);
    window.addEventListener('eco:newEntry', handler);
    return () => window.removeEventListener('eco:newEntry', handler);
  }, [fetchAlerts]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleReport = async () => {
    if (!report.location || !report.description) return;
    setSubmitting(true);
    try {
      await api.post('/alerts', report);
      setShowModal(false);
      setReport({ domain: userDomain || ResourceType.ELECTRICITY, location: '', description: '' });
      fetchAll();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleUpdateTicket = async (id, status, logMessage) => {
    try {
      await api.patch(`/tickets/${id}/status`, { status, logMessage });
      setTickets(prev => prev.map(t => t._id === id ? { ...t, status } : t));
    } catch (e) { console.error(e); }
  };

  const renderView = () => {
    if (loading) return (
      <div className="flex items-center justify-center h-52">
        <RefreshCw size={24} className="animate-spin text-emerald-500 mr-3" />
        <span className="text-slate-500 font-medium">Loading dashboard...</span>
      </div>
    );
    switch (userLayer) {
      case 'FIELD':     return <FieldView user={user} tickets={tickets} onUpdate={handleUpdateTicket} />;
      default:          return <StrategicView stats={statsData.stats} weekly={statsData.weekly} monthly={statsData.monthly} user={user} view={view} setView={setView} />;
    }
  };

  return (
    <div className="space-y-6 pb-10">

      {/* Hero */}
      <div className="bg-slate-900 text-white p-7 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-[0.04]"><LayoutDashboard size={160} /></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-emerald-500 text-[10px] font-black rounded-full uppercase tracking-widest">{userLayer} LAYER</span>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">/ {userGroupLabel}</span>
          </div>
          <h2 className="text-3xl font-bold mb-3">Welcome, {user.name}</h2>
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl max-w-xl">
            <p className="text-xs text-emerald-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1">
              <Activity size={12} />Your Role
            </p>
            <p className="text-slate-300 text-sm leading-relaxed">
              {user.role === UserRole.OFFICER && 'Oversee all campus resources. Enter consumption data, monitor trends and manage incidents.'}
              {userLayer === 'FIELD'           && 'Check your assigned tickets below and mark them resolved after completing physical repairs.'}
              {userLayer === 'STRATEGIC' && user.role !== UserRole.OFFICER && `Analyze ${userGroupLabel} consumption trends and support long-term planning.`}
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg"><LayoutDashboard size={18} /></div>
          Campus Resource Monitor
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowModal(true)}
            className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
            <AlertTriangle size={16} className="text-amber-500" />Report Issue
          </button>
          <button onClick={fetchAll}
            className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-all flex items-center gap-2">
            <RefreshCw size={14} />Refresh
          </button>
        </div>
      </div>

      {/* Role-scoped view */}
      {renderView()}

      

      {/* Incidents — backend already scoped to user's domain */}
      <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-500" />
            {user.role === UserRole.OFFICER ? 'System-Wide Incidents' : 'My Domain Incidents'}
          </h3>
          <span className="text-xs text-slate-400 font-medium">{alerts.length} active</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {alerts.length === 0 ? (
            <div className="col-span-full py-10 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No active incidents
            </div>
          ) : alerts.slice(0, 6).map(alert => (
            <div key={alert._id} className={`p-4 border rounded-xl flex items-start gap-3 ${
              alert.severity === 'CRITICAL' ? 'bg-red-50 border-red-100' :
              alert.severity === 'HIGH'     ? 'bg-amber-50 border-amber-100' :
                                              'bg-blue-50 border-blue-100'}`}>
              <div className={`p-2 rounded-lg shrink-0 ${
                alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                alert.severity === 'HIGH'     ? 'bg-amber-100 text-amber-600' :
                                                'bg-blue-100 text-blue-600'}`}>
                {alert.domain === 'ELECTRICITY' ? <Zap size={16} /> : alert.domain === 'WATER' ? <Droplets size={16} /> : <Trash2 size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-xs ${
                  alert.severity === 'CRITICAL' ? 'text-red-800' :
                  alert.severity === 'HIGH'     ? 'text-amber-800' : 'text-blue-800'}`}>
                  {alert.title}
                </p>
                <p className={`text-xs mt-0.5 line-clamp-2 ${
                  alert.severity === 'CRITICAL' ? 'text-red-600/70' :
                  alert.severity === 'HIGH'     ? 'text-amber-600/70' : 'text-blue-600/70'}`}>
                  {alert.message}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-slate-400 truncate">{alert.location}</span>
                  <span className={`text-[8px] px-1 rounded font-black uppercase ml-2 shrink-0 ${
                    alert.source === 'SYSTEM' ? 'bg-emerald-200 text-emerald-700' : 'bg-blue-200 text-blue-700'}`}>
                    {alert.source}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Report modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800">Report Issue</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Domain</label>
                {user.role === UserRole.OFFICER ? (
                  <select value={report.domain} onChange={e => setReport({ ...report, domain: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="ELECTRICITY">⚡ Energy / Electricity</option>
                    <option value="WATER">💧 Water / Plumbing</option>
                    <option value="WASTE">♻️ Waste / Sanitation</option>
                  </select>
                ) : (
                  <div className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium flex items-center justify-between">
                    <span>{userDomain === 'ELECTRICITY' ? '⚡ Energy / Electricity' : userDomain === 'WATER' ? '💧 Water / Plumbing' : '♻️ Waste / Sanitation'}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-200 px-2 py-0.5 rounded-lg">locked</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Location</label>
                <input type="text" placeholder="e.g. Hostel B, Room 204" value={report.location}
                  onChange={e => setReport({ ...report, location: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Description</label>
                <textarea rows={3} placeholder="Describe the issue..." value={report.description}
                  onChange={e => setReport({ ...report, description: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <button onClick={handleReport} disabled={submitting}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-60">
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;