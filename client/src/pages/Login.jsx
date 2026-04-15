import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [form, setForm] = useState({ voterID: "", email: "", password: "" });

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const credentials = isAdmin 
        ? { email: form.email, password: form.password }
        : { voterID: form.voterID, password: form.password };
      
      await login(credentials, isAdmin);
      
      toast.success(`Welcome back!`);
      navigate(isAdmin ? "/admin/dashboard" : "/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-full mb-3">
            <span className="text-white text-2xl">{isAdmin ? '👨‍💼' : '🗳️'}</span>
          </div>
          <h1 className="text-2xl font-bold text-primary">
            {isAdmin ? 'Admin Login' : 'Voter Login'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">eVoteFace — Secure Digital Voting</p>
        </div>

        {/* Login Type Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setIsAdmin(false)}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              !isAdmin
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Voter Login
          </button>
          <button
            type="button"
            onClick={() => setIsAdmin(true)}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              isAdmin
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Admin Login
          </button>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isAdmin ? (
              <div>
                <label className="label">Admin Email</label>
                <input
                  name="email" 
                  type="email"
                  value={form.email} 
                  onChange={set}
                  required 
                  className="input" 
                  placeholder="Enter your admin email"
                  autoComplete="username"
                />
              </div>
            ) : (
              <div>
                <label className="label">Voter ID Number</label>
                <input
                  name="voterID" 
                  value={form.voterID} 
                  onChange={set}
                  required 
                  className="input" 
                  placeholder="Enter your Voter ID"
                  autoComplete="username"
                />
              </div>
            )}
            
            <div>
              <label className="label">Password</label>
              <input
                name="password" 
                type="password" 
                value={form.password} 
                onChange={set}
                required 
                className="input" 
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>
            
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {!isAdmin && (
            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                New voter?{" "}
                <Link to="/register" className="text-primary font-medium hover:underline">
                  Register here
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-700">
          <p className="font-medium mb-1">🔒 {isAdmin ? 'Admin Access' : 'Three-Factor Security'}</p>
          <p>
            {isAdmin 
              ? 'Manage elections, candidates, and voters with full administrative control.'
              : 'Your vote is protected by MetaMask wallet + Face Recognition + OTP verification.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
