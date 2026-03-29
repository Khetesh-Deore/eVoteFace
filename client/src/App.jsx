import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Layout } from './components/layout'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes - no layout */}
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/register" element={<div>Register Page</div>} />

          {/* Protected routes with layout */}
          <Route
            path="/"
            element={
              <Layout>
                <div>Home</div>
              </Layout>
            }
          />

          {/* Voter routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <div>Voter Dashboard</div>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vote"
            element={
              <ProtectedRoute>
                <Layout>
                  <div>Voting Page</div>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <Layout>
                  <div>Results</div>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/receipt"
            element={
              <ProtectedRoute>
                <Layout>
                  <div>Vote Receipt</div>
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Layout>
                  <div>Admin Dashboard</div>
                </Layout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/voters"
            element={
              <AdminRoute>
                <Layout>
                  <div>Manage Voters</div>
                </Layout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/candidates"
            element={
              <AdminRoute>
                <Layout>
                  <div>Manage Candidates</div>
                </Layout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/election"
            element={
              <AdminRoute>
                <Layout>
                  <div>Election Management</div>
                </Layout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/results"
            element={
              <AdminRoute>
                <Layout>
                  <div>Admin Results</div>
                </Layout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <AdminRoute>
                <Layout>
                  <div>Audit Log</div>
                </Layout>
              </AdminRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
