import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Analytics } from './pages/Analytics';
import { StudentList } from './pages/StudentList';
import { StudentProfile } from './pages/StudentProfile';
import { StudentConnectivityDetail } from './pages/StudentConnectivityDetail';
import { EditProfile } from './pages/EditProfile';
import { Availability } from './pages/Availability';
import { AIReports } from './pages/AIReports';
import { Connectors } from './pages/Connectors';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Analytics />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/students"
              element={
                <ProtectedRoute>
                  <Layout>
                    <StudentList />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/students/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <StudentProfile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/students/:id/connectivity"
              element={
                <ProtectedRoute>
                  <Layout>
                    <StudentConnectivityDetail />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/edit"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EditProfile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/availability"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Availability />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AIReports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* Admin only */}
            <Route
              path="/connectors"
              element={
                <ProtectedRoute adminOnly>
                  <Layout>
                    <Connectors />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/students" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
