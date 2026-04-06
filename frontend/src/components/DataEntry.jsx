import React, { useState } from 'react';
import { ResourceType } from '../types';
import { RESOURCE_CONFIG } from '../constants';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const DataEntry = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ type:ResourceType.ELECTRICITY, value:'', location:'', date:new Date().toISOString().split('T')[0] });
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async(e)=>{
    e.preventDefault();
    if(!form.value||!form.location) return;
    setError(''); setLoading(true);
    try {
      await api.post('/entries',{ type:form.type, value:parseFloat(form.value), unit:RESOURCE_CONFIG[form.type].unit, date:form.date, location:form.location });
      setForm(f=>({...f,value:'',location:''}));
      setSuccess(true); setTimeout(()=>setSuccess(false),3500);
      // Notify Dashboard to re-fetch alerts after trend check completes
      window.dispatchEvent(new Event('eco:newEntry'));
    } catch(e){ setError(e.response?.data?.message||'Failed to save. Try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Resource Data Entry</h2>
        <p className="text-slate-500 text-sm mt-1">Record manual meter readings for campus resources.</p>
      </div>

      <form onSubmit={submit} className="bg-white p-7 rounded-2xl shadow-sm border border-slate-100 space-y-5">
        {success&&(
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-sm">
            <CheckCircle2 size={18}/>Entry saved! System is checking for consumption spikes automatically.
          </div>
        )}
        {error&&(
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
            <AlertCircle size={18}/>{error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Resource Type</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(ResourceType).map(type=>{
              const cfg=RESOURCE_CONFIG[type];
              return (
                <button key={type} type="button" onClick={()=>setForm({...form,type})}
                  className={`py-4 px-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${form.type===type?`border-emerald-500 ${cfg.bgClass}`:'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
                  {cfg.icon}
                  <span className={`text-[11px] font-bold uppercase ${form.type===type?cfg.textClass:'text-slate-400'}`}>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Value ({RESOURCE_CONFIG[form.type].unit})</label>
            <input type="number" required min="0" step="0.01" value={form.value} onChange={e=>setForm({...form,value:e.target.value})}
              placeholder={`Enter ${RESOURCE_CONFIG[form.type].label.toLowerCase()}...`}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"/>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Reading Date</label>
            <input type="date" required value={form.date} onChange={e=>setForm({...form,date:e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"/>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Location / Facility</label>
            <input type="text" required value={form.location} onChange={e=>setForm({...form,location:e.target.value})}
              placeholder="e.g. Science Lab A, Hostel B..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"/>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-start gap-2 text-blue-700 bg-blue-50 border border-blue-100 p-3 rounded-xl flex-1 mr-4">
            <AlertCircle size={16} className="mt-0.5 shrink-0"/>
            <p className="text-xs">After saving, the system auto-checks for consumption spikes (≥10% vs last week) and creates alerts + tickets if needed.</p>
          </div>
          <button type="submit" disabled={loading}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm shrink-0">
            <Save size={18}/>{loading?'Saving...':'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
};
export default DataEntry;
