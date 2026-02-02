import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './components/UI/Toast';
import MainLayout from './components/Layout/MainLayout';
import ProtectedRoute from './components/Layout/ProtectedRoute';

// Lazy Load Pages for Performance
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Appointments = lazy(() => import('./pages/Appointments'));
const Doctors = lazy(() => import('./pages/Doctors'));
const Patients = lazy(() => import('./pages/Patients'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

// Loading Fallback
const LoadingSpinner = () => (
  <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', color: 'hsl(var(--primary))' }}>
    <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid hsl(var(--primary))', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/*" element={<MainLayout />}>
                <Route path="dashboard" element={
                  <ProtectedRoute allowedRoles={['admin', 'patient', 'staff']}>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="appointments" element={
                  <ProtectedRoute allowedRoles={['admin', 'patient', 'staff']}>
                    <Appointments />
                  </ProtectedRoute>
                } />
                <Route path="doctors" element={
                  <ProtectedRoute allowedRoles={['admin', 'patient', 'staff']}>
                    <Doctors />
                  </ProtectedRoute>
                } />
                <Route path="patients" element={
                  <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <Patients />
                  </ProtectedRoute>
                } />
                <Route path="admin" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminPanel />
                  </ProtectedRoute>
                } />
              </Route>
            </Routes>
          </Suspense>
        </Router>
      </ToastProvider>
    </AppProvider>
  );
}

export default App;
