
import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import CaseDetails from './pages/CaseDetails';
import Clients from './pages/Clients';
import ClientDetails from './pages/ClientDetails';
import CalendarPage from './pages/Calendar';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Help from './pages/Help';
import Consultations from './pages/Consultations';
import AIAssistant from './pages/AIAssistant';
import { authService } from './services/auth';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/cases" element={
            <ProtectedRoute>
              <Cases />
            </ProtectedRoute>
          } />
          
          <Route path="/cases/:id" element={
            <ProtectedRoute>
              <CaseDetails />
            </ProtectedRoute>
          } />
          
          <Route path="/consultations" element={
            <ProtectedRoute>
              <Consultations />
            </ProtectedRoute>
          } />

          <Route path="/clients" element={
            <ProtectedRoute>
              <Clients />
            </ProtectedRoute>
          } />
          
          <Route path="/clients/:id" element={
            <ProtectedRoute>
              <ClientDetails />
            </ProtectedRoute>
          } />
          
          <Route path="/calendar" element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          } />
          
          <Route path="/tasks" element={
            <ProtectedRoute>
              <Tasks />
            </ProtectedRoute>
          } />
          
          <Route path="/reports" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />

           <Route path="/help" element={
            <ProtectedRoute>
              <Help />
            </ProtectedRoute>
          } />

          <Route path="/ai-assistant" element={
            <ProtectedRoute>
              <AIAssistant />
            </ProtectedRoute>
          } />
          
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
