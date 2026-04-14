import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import { ElectionProvider } from './context/ElectionContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Common Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Voter Pages
import Dashboard from './pages/Dashboard';
import ElectionsList from './pages/ElectionsList';
import ElectionDetail from './pages/ElectionDetail';
import VotingPage from './pages/VotingPage';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminElectionsList from './pages/admin/AdminElectionsList';
import CreateElection from './pages/admin/CreateElection';
import ManageElection from './pages/admin/ManageElection';

function App() {
  return (
    <Router>
      <AuthProvider>
        <WalletProvider>
          <ElectionProvider>
            <div className="min-h-screen flex flex-col bg-gray-50">
              <Navbar />
              
              <main className="flex-grow">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/elections" element={<ElectionsList />} />
                  <Route path="/elections/:electionId" element={<ElectionDetail />} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route
                    path="/admin/dashboard"
                    element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/elections"
                    element={
                      <AdminRoute>
                        <AdminElectionsList />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/elections/new"
                    element={
                      <AdminRoute>
                        <CreateElection />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/elections/:electionId"
                    element={
                      <AdminRoute>
                        <ManageElection />
                      </AdminRoute>
                    }
                  />
                  
                  {/* Voter Protected Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/elections/:electionId/vote"
                    element={
                      <ProtectedRoute>
                        <VotingPage />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </main>
              
              <Footer />
              
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
              />
            </div>
          </ElectionProvider>
        </WalletProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
