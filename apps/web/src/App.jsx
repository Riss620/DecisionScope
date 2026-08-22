import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Decisions from './pages/Decisions';
import Simulation from './pages/Simulation';
import Scenarios from './pages/Scenarios';
import Settings from './pages/Settings';
import DocumentUpload from './pages/DocumentUpload';
import DocumentReview from './pages/DocumentReview';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SimulationProvider } from './contexts/SimulationContext';
import { ThemeProvider } from './contexts/ThemeContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--bg-primary))] text-[hsl(var(--text-primary))]">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--bg-primary))] text-[hsl(var(--text-primary))]">Loading...</div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SimulationProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
              
              {/* Protected Routes (App Workspace) */}
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/decisions" element={<Decisions />} />
                <Route path="/decisions/:id/simulate" element={<Simulation />} />
                <Route path="/scenarios" element={<Scenarios />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/documents/upload" element={<DocumentUpload />} />
                <Route path="/documents/review" element={<DocumentReview />} />
              </Route>
              
              {/* Fallback for unknown routes inside the app (optional) */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SimulationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
