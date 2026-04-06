import React, { useState, useEffect, useCallback } from 'react';
import { ROLE_GROUPS, ROLE_LAYERS } from '../constants';
import { Users, Plus, Edit2, UserX, UserCheck, RefreshCw, X, Save, AlertCircle } from 'lucide-react';
import api from '../services/api';

// Only 7 roles — Powerplant Op, Recycling Coord, Water Treatment removed
const ROLES = [
  { value: 'OFFICER',             label: 'Sustainability Officer', group: 'Admin'  },
  { value: 'ENERGY_TECHNICIAN',   label: 'Energy Technician',     group: 'Energy' },
  { value: 'NMC_MEMBER',          label: 'NMC Member',            group: 'Energy' },
  { value: 'PLUMBING_SPECIALIST', label: 'Plumbing Specialist',   group: 'Water'  },
  { value: 'IRRIGATION_MANAGER',  label: 'Irrigation Manager',    group: 'Water'  },
  { value: 'WASTE_MANAGER',       label: 'Waste Manager',         group: 'Waste'  },
  { value: 'SANITATION_OFFICER',  label: 'Sanitation Officer',    group: 'Waste'  },
];

const LAYER_COLORS = {
  STRATEGIC: 'bg-purple-50 text-purple-700',
  FIELD:     'bg-amber-50 text-amber-700',
};

const blank = { name: '', email: '', password: '', role: 'ENERGY_TECHNICIAN' };

const UserManagement = () => {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(blank);
  const [formErr, setFormErr] = useState('');
  const [saving, setSaving]   = useState(false);
  const [tab, setTab]         = useState('ALL');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/users'); setUsers(r.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openCreate = () => { setEditing(null); setForm(blank); setFormErr(''); setModal(true); };
  const openEdit   = u  => { setEditing(u); setForm({ name: u.name, email: u.email, password: '', role: u.role }); setFormErr(''); setModal(true); };

  const save = async (e) => {
    e.preventDefault(); setFormErr(''); setSaving(true);
    try {
      if (editing) await api.put(`/users/${editing._id}`, { name: form.name, email: form.email, role: form.role });
      else         await api.post('/users', form);
      setModal(false); fetchUsers();
    } catch (e) { setFormErr(e.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const deactivate = async id => { if (!window.confirm('Deactivate this user?')) return; await api.delete(`/users/${id}`); fetchUsers(); };
  const reactivate = async id => { await api.put(`/users/${id}`, { isActive: true }); fetchUsers(); };

  const tabs  = ['ALL', 'Admin', 'Energy', 'Water', 'Waste'];
  const shown = users.filter(u => { if (tab === 'ALL') return true; return ROLES.find(r => r.value === u.role)?.group === tab; });

  const stats = {
    total:  users.length,
    active: users.filter(u => u.isActive).length,
    energy: users.filter(u => ROLE_GROUPS.ENERGY.roles.includes(u.role)).length,
    water:  users.filter(u => ROLE_GROUPS.WATER.roles.includes(u.role)).length,
    waste:  users.filter(u => ROLE_GROUPS.WASTE.roles.includes(u.role)).length,
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
          <p className="text-slate-500 text-sm">Manage campus staff accounts and role assignments.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchUsers} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-50 flex items-center gap-1.5 shadow-sm">
            <RefreshCw size={13} />Refresh
          </button>
          <button onClick={openCreate} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all">
            <Plus size={15} />Add User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[['Total', stats.total, 'bg-slate-50 text-slate-700'], ['Active', stats.active, 'bg-emerald-50 text-emerald-700'],
          ['Energy', stats.energy, 'bg-yellow-50 text-yellow-700'], ['Water', stats.water, 'bg-blue-50 text-blue-700'],
          ['Waste', stats.waste, 'bg-emerald-50 text-emerald-600']
        ].map(([l, v, c]) => (
          <div key={l} className={`${c} p-4 rounded-2xl`}>
            <p className="text-2xl font-bold">{v}</p>
            <p className="text-xs font-bold uppercase tracking-wide opacity-70 mt-0.5">{l}</p>
          </div>
        ))}
      </div>

      {/* Tab filter */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-slate-400">
            <RefreshCw size={20} className="animate-spin mr-2" />Loading...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                <tr>
                  <th className="px-5 py-4">User</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Layer</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {shown.map(u => {
                  const layer = ROLE_LAYERS[u.role] || 'FIELD';
                  const roleLabel = ROLES.find(r => r.value === u.role)?.label || u.role;
                  return (
                    <tr key={u._id} className={`hover:bg-slate-50 ${!u.isActive ? 'opacity-50' : ''}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{u.name}</p>
                            <p className="text-slate-400 text-xs">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 text-sm">{roleLabel}</td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase ${LAYER_COLORS[layer] || 'bg-slate-50 text-slate-500'}`}>{layer}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase ${u.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => openEdit(u)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-all"><Edit2 size={14} /></button>
                          {u.isActive
                            ? <button onClick={() => deactivate(u._id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all"><UserX size={14} /></button>
                            : <button onClick={() => reactivate(u._id)} className="p-1.5 hover:bg-emerald-50 rounded-lg text-slate-400 hover:text-emerald-500 transition-all"><UserCheck size={14} /></button>
                          }
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Users size={18} className="text-emerald-600" />{editing ? 'Edit User' : 'Add User'}
              </h3>
              <button onClick={() => setModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
            </div>
            {formErr && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
                <AlertCircle size={15} />{formErr}
              </div>
            )}
            <form onSubmit={save} className="space-y-4">
              {[['Full Name', 'text', 'name', 'John Smith'], ['Email', 'email', 'email', 'user@campus.edu']].map(([label, type, key, ph]) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">{label}</label>
                  <input type={type} required value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={ph}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              ))}
              {!editing && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Password</label>
                  <input type="password" required minLength={4} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 4 characters"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                  {ROLES.map(r => <option key={r.value} value={r.value}>[{r.group}] {r.label}</option>)}
                </select>
              </div>
              <button type="submit" disabled={saving} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all">
                <Save size={16} />{saving ? 'Saving...' : editing ? 'Update User' : 'Create User'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default UserManagement;
