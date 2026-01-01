
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import CaseInputPage from './pages/CaseInputPage';
import CaseSummaryPage from './pages/CaseSummaryPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import { UserRole } from './types';

const PrivateRoute: React.FC<{ children: React.ReactNode; isAdminOnly?: boolean }> = ({ children, isAdminOnly }) => {
  const { currentUser } = useStore();
  if (!currentUser) return <Navigate to="/login" />;
  
  // 硬编码校验：仅 qinghoohoo 可以进入管理中心
  if (isAdminOnly && currentUser.username !== 'qinghoohoo') {
    return <Navigate to="/dashboard/summary" />;
  }
  
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route 
        path="/dashboard/cases" 
        element={
          <PrivateRoute>
            <Layout><CaseInputPage /></Layout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/dashboard/summary" 
        element={
          <PrivateRoute>
            <Layout><CaseSummaryPage /></Layout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/dashboard/admin" 
        element={
          <PrivateRoute isAdminOnly={true}>
            <Layout><AdminSettingsPage /></Layout>
          </PrivateRoute>
        } 
      />
      <Route path="/cases" element={<Navigate to="/dashboard/cases" />} />
      <Route path="/summary" element={<Navigate to="/dashboard/summary" />} />
      <Route path="/admin" element={<Navigate to="/dashboard/admin" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </StoreProvider>
  );
};

export default App;
