import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<div>Home</div>} />
          <Route path="/login" element={<div>Login</div>} />
          <Route path="/register" element={<div>Register</div>} />

          {/* Protected voter routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Voter Dashboard</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vote"
            element={
              <ProtectedRoute>
                <div>Voting Page</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <div>Results</div>
              </ProtectedRoute>
            }
          />

          {/* Protected admin routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div>Admin Dashboard</div>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/voters"
            element={
              <AdminRoute>
                <div>Manage Voters</div>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/candidates"
            element={
              <AdminRoute>
                <div>Manage Candidates</div>
              </AdminRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
