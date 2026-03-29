import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import { Layout } from './components/layout'

// Public Pages
import { LandingPage } from './pages/public/LandingPage'
import { LoginPage } from './pages/public/LoginPage'
import { RegisterPage } from './pages/public/RegisterPage'

// Voter Pages
import { DashboardPage } from './pages/voter/DashboardPage'
import { FaceVerificationPage } from './pages/voter/FaceVerificationPage'
import { VotingPage } from './pages/voter/VotingPage'
import { ResultsPage } from './pages/voter/ResultsPage'
import { ReceiptPage } from './pages/voter/ReceiptPage'

// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminCandidatesPage } from './pages/admin/AdminCandidatesPage'
import { AdminVotersPage } from './pages/admin/AdminVotersPage'
import { AdminElectionPage } from './pages/admin/AdminElectionPage'
import { AdminAuditPage } from './pages/admin/AdminAuditPage'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes - No Layout */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Landing Page */}
          <Route
            path="/"
            element={
              <Layout>
                <LandingPage />
              </Layout>
            }
          />

          {/* Voter Routes - Protected */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/verify"
            element={
              <ProtectedRoute>
                <Layout>
                  <FaceVerificationPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/vote"
            element={
              <ProtectedRoute>
                <Layout>
                  <VotingPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <Layout>
                  <ResultsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/receipt"
            element={
              <ProtectedRoute>
                <Layout>
                  <ReceiptPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Admin Routes - Protected */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Layout>
                  <AdminDashboardPage />
                </Layout>
              </AdminRoute>
            }
          />

          <Route
            path="/admin/candidates"
            element={
              <AdminRoute>
                <Layout>
                  <AdminCandidatesPage />
                </Layout>
              </AdminRoute>
            }
          />

          <Route
            path="/admin/voters"
            element={
              <AdminRoute>
                <Layout>
                  <AdminVotersPage />
                </Layout>
              </AdminRoute>
            }
          />

          <Route
            path="/admin/election"
            element={
              <AdminRoute>
                <Layout>
                  <AdminElectionPage />
                </Layout>
              </AdminRoute>
            }
          />

          <Route
            path="/admin/audit"
            element={
              <AdminRoute>
                <Layout>
                  <AdminAuditPage />
                </Layout>
              </AdminRoute>
            }
          />

          {/* 404 - Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
