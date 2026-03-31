import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/admin/login", form);
      login(res.data.token, { ...res.data.admin, role: res.data.admin.role });
      toast.success(`Welcome, ${res.data.admin.fullName}`);
      navigate("/admin/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Admin login failed");
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
            <span className="text-white text-2xl">🛡️</span>
          </div>
          <h1 className="text-2xl font-bold text-primary">Election Administrator</h1>
          <p className="text-gray-500 text-sm mt-1">eVoteFace Admin Portal</p>
        </div>

        <div className="card border-l-4 border-l-accent">
          <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-5 text-xs text-orange-800">
            ⚠️ Restricted access. Authorised personnel only.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Admin Email</label>
              <input
                name="email" type="email" value={form.email} onChange={set}
                required className="input" placeholder="admin@evoteface.com"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                name="password" type="password" value={form.password} onChange={set}
                required className="input" placeholder="Enter admin password"
                autoComplete="current-password"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-accent w-full">
              {loading ? "Authenticating..." : "Login to Admin Panel"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Voter?{" "}
          <a href="/login" className="text-primary font-medium hover:underline">Go to Voter Login</a>
        </p>
      </div>
    </div>
  );
}
