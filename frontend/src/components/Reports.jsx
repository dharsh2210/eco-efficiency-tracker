
import React, { useState, useEffect, useCallback } from 'react';
import { ResourceType, UserRole } from '../types';
import { RESOURCE_CONFIG } from '../constants';
import { Calendar, Filter, Download, Search, Building2, User2, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Reports = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [statsData, setStatsData] = useState({ byLocation: [] });
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [entriesRes, statsRes] = await Promise.all([
        api.get('/entries', { params: { limit: 200 } }),
        api.get('/entries/stats'),
      ]);
      setEntries(entriesRes.data);
      setStatsData(statsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isOfficer = user.role === UserRole.OFFICER;

  const filteredEntries = entries.filter(e => {
    const cfg = RESOURCE_CONFIG[e.type];
    const isRelevant = isOfficer || cfg.roles?.includes(user.role);
    if (!isRelevant) return false;
    const matchesType = filterType === 'ALL' || e.type === filterType;
    const matchesSearch =
      e.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.enteredBy.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  // Build location chart data from real stats
  const locationChartData = (() => {
    const map = {};
    (statsData.byLocation || []).forEach(r => {
      const loc = r._id.location;
      if (!map[loc]) map[loc] = { name: loc };
      map[loc][r._id.type] = (map[loc][r._id.type] || 0) + r.value;
    });
    return Object.values(map).slice(0, 8);
  })();

  const availableResourceTypes = Object.values(ResourceType).filter(type =>
    isOfficer || RESOURCE_CONFIG[type].roles?.includes(user.role)
  );

  const handleExport = () => {
    const csv = [
      ['Date', 'Type', 'Value', 'Unit', 'Location', 'Entered By'],
      ...filteredEntries.map(e => [e.date, e.type, e.value, e.unit, e.location, e.enteredBy])
    ].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'eco-tracker-report.csv'; a.click();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3 text-slate-500">
        <RefreshCw size={24} className="animate-spin" />
        <span className="font-medium">Loading reports...</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Resource Consumption Reports</h2>
          <p className="text-slate-500">Detailed logs and distribution analysis of campus resources.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors shadow-sm">
            <RefreshCw size={16} />Refresh
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors shadow-sm">
            <Download size={18} />Export CSV
          </button>
        </div>
      </header>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search by location or faculty member..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="text-slate-400" size={18} />
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="flex-1 md:flex-none px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-600 font-medium">
            <option value="ALL">All Resource Types</option>
            {availableResourceTypes.map(t => (
              <option key={t} value={t}>{RESOURCE_CONFIG[t].label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Building2 size={20} className="text-blue-500" />Consumption by Facility
          </h3>
          {locationChartData.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-slate-400">No data available</div>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationChartData} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} width={90} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  {availableResourceTypes.map(type => (
                    <Bar key={type} dataKey={type} name={RESOURCE_CONFIG[type].label} fill={RESOURCE_CONFIG[type].color} radius={[0, 4, 4, 0]} barSize={12} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <h3 className="p-6 font-bold text-slate-800 border-b border-slate-100 flex items-center gap-2">
            <Calendar size={20} className="text-emerald-600" />Recent Log Details
            <span className="ml-auto text-xs font-normal text-slate-400">{filteredEntries.length} records</span>
          </h3>
          <div className="overflow-auto flex-1 max-h-80">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-widest font-bold sticky top-0">
                <tr>
                  <th className="px-6 py-4">Resource</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4 text-right">Value</th>
                  <th className="px-6 py-4">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No entries found</td></tr>
                ) : filteredEntries.map(entry => (
                  <tr key={entry._id} className="hover:bg-slate-50 transition-colors text-sm">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {RESOURCE_CONFIG[entry.type].icon}
                        <span className="font-semibold text-slate-700">{RESOURCE_CONFIG[entry.type].label}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">{entry.date}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{entry.location}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">
                      {entry.value.toLocaleString()} <span className="text-xs font-normal text-slate-400">{entry.unit}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <User2 size={14} />{entry.enteredBy}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Reports;
