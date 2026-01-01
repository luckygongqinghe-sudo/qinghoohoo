
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

const PrivateRoute: React.FC<{ children: React.ReactNode; roles?: UserRole[] }> = ({ children, roles }) => {
  const { currentUser } = useStore();
  if (!currentUser) return <Navigate to="/login" />;
  if (roles && !roles.includes(currentUser.role)) return <Navigate to="/dashboard/cases" />;
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
          <PrivateRoute roles={[UserRole.ADMIN]}>
            <Layout><AdminSettingsPage /></Layout>
          </PrivateRoute>
        } 
      />
      {/* 重定向旧路径 */}
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
