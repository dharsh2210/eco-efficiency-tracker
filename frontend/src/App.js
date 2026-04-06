import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DataEntry from './components/DataEntry';
import Reports from './components/Reports';
import UserManagement from './components/UserManagement';
import { UserRole } from './types';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState('dashboard');

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 font-medium">Loading...</p>
      </div>
    </div>
  );

  if (!user) return <Login />;

  const isOfficer = user.role === UserRole.OFFICER;
  const renderPage = () => {
    switch(tab) {
      case 'data-entry': return isOfficer ? <DataEntry/>    : <Dashboard/>;
      case 'reports':    return <Reports/>;
      case 'management': return isOfficer ? <UserManagement/> : <Dashboard/>;
      default:           return <Dashboard/>;
    }
  };

  return <Layout activeTab={tab} setActiveTab={setTab}>{renderPage()}</Layout>;
};

const App = () => <AuthProvider><AppContent/></AuthProvider>;
export default App;
