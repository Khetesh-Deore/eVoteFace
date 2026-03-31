import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Common
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import LoadingSpinner from "./components/common/LoadingSpinner";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminRoute from "./components/common/AdminRoute";

// Public pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Results from "./pages/Results";

// Voter pages
import Dashboard from "./pages/Dashboard";
import VotingPage from "./pages/VotingPage";

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageVoters from "./pages/admin/ManageVoters";
import ManageCandidates from "./pages/admin/ManageCandidates";
import FaceRegistration from "./pages/admin/FaceRegistration";
import ElectionControl from "./pages/admin/ElectionControl";
import AdminResults from "./pages/admin/AdminResults";

export default function App() {
  const { loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public */}
          <Route path="/"         element={<Home />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/results"  element={<Results />} />

          {/* Admin auth */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected voter routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vote"      element={<VotingPage />} />
          </Route>

          {/* Protected admin routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/dashboard"   element={<AdminDashboard />} />
            <Route path="/admin/voters"      element={<ManageVoters />} />
            <Route path="/admin/candidates"  element={<ManageCandidates />} />
            <Route path="/admin/face"        element={<FaceRegistration />} />
            <Route path="/admin/election"    element={<ElectionControl />} />
            <Route path="/admin/results"     element={<AdminResults />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
