import React, { useState } from 'react';
import { NAV_ITEMS } from '../constants';
import { LogOut, Menu, X, Leaf } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ activeTab, setActiveTab, children }) => {
  const { user, logout } = useAuth();
  const [open,setOpen]   = useState(false);
  const nav = NAV_ITEMS.filter(n=>n.roles.includes(user.role));

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 ${open?'translate-x-0':'-translate-x-full'}`}>
        <div className="p-5 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <Leaf size={22} className="text-white"/>
          </div>
          <div>
            <p className="text-white font-bold text-sm">Eco-Efficiency</p>
            <p className="text-emerald-400 text-xs font-semibold">Tracker</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {nav.map(item=>(
            <button key={item.id} onClick={()=>{setActiveTab(item.id);setOpen(false);}}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab===item.id?'bg-emerald-600 text-white':'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              {item.icon}{item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user.name}</p>
              <p className="text-slate-500 text-[10px] uppercase tracking-wide truncate">{user.role.replace(/_/g,' ')}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all text-sm">
            <LogOut size={16}/>Sign Out
          </button>
        </div>
      </aside>
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2"><Leaf size={18} className="text-emerald-400"/><span className="text-white font-bold text-sm">Eco-Tracker</span></div>
        <button onClick={()=>setOpen(!open)} className="text-white">{open?<X size={22}/>:<Menu size={22}/>}</button>
      </div>
      {open&&<div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={()=>setOpen(false)}/>}
      <main className="flex-1 overflow-y-auto h-screen pt-14 md:pt-0 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};
export default Layout;
