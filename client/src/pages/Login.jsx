import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ voterID: "", password: "" });

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", form);
      login(res.data.token, res.data.user);
      toast.success(`Welcome, ${res.data.user.fullName}`);
      navigate("/dashboard");
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
            <span className="text-white text-2xl">🗳️</span>
          </div>
          <h1 className="text-2xl font-bold text-primary">Voter Login</h1>
          <p className="text-gray-500 text-sm mt-1">eVoteFace — Secure Digital Voting</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Voter ID Number</label>
              <input
                name="voterID" value={form.voterID} onChange={set}
                required className="input" placeholder="Enter your Voter ID"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                name="password" type="password" value={form.password} onChange={set}
                required className="input" placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center space-y-2">
            <p className="text-sm text-gray-500">
              New voter?{" "}
              <Link to="/register" className="text-primary font-medium hover:underline">Register here</Link>
            </p>
            <p className="text-sm text-gray-500">
              Election Administrator?{" "}
              <Link to="/admin/login" className="text-accent font-medium hover:underline">Admin Login</Link>
            </p>
          </div>
        </div>

        {/* Info box */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-700">
          <p className="font-medium mb-1">🔒 Three-Factor Security</p>
          <p>Your vote is protected by MetaMask wallet + Face Recognition + OTP verification.</p>
        </div>
      </div>
    </div>
  );
}
