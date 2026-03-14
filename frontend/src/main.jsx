import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CampaignsPage from './pages/CampaignsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import OptimizerPage from './pages/OptimizerPage';
import ABTestPage from './pages/ABTestPage';
import FraudPage from './pages/FraudPage';
import KeywordPage from './pages/KeywordPage';
import SettingsPage from './pages/SettingsPage';
import './index.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"  element={<DashboardPage />} />
            <Route path="campaigns"  element={<CampaignsPage />} />
            <Route path="analytics"  element={<AnalyticsPage />} />
            <Route path="optimizer"  element={<OptimizerPage />} />
            <Route path="abtest"     element={<ABTestPage />} />
            <Route path="fraud"      element={<FraudPage />} />
            <Route path="keywords"   element={<KeywordPage />} />
            <Route path="settings"   element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
