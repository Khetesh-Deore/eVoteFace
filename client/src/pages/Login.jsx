import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import LoadingModal from "../components/common/LoadingModal";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [form, setForm] = useState({ voterID: "", email: "", password: "" });

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoadingMessage(isAdmin ? 'Verifying admin credentials...' : 'Logging you in...');
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
      setLoadingMessage('');
    }
  };

  return (
    <>
      <LoadingModal isOpen={loading} message={loadingMessage} subMessage="Please wait while we verify your credentials" />
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center shadow-xl">
              <i className="fa-solid fa-fingerprint text-white text-4xl"></i>
            </div>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {isAdmin ? 'Admin Portal' : 'Voter Login'}
          </h1>
          <p className="text-slate-600 mt-2">Secure access to eVoteface</p>
        </div>

        {/* Toggle between Voter & Admin */}
        <div className="flex bg-white rounded-3xl p-1 shadow-sm border border-slate-100 mb-8">
          <button
            type="button"
            onClick={() => setIsAdmin(false)}
            className={`flex-1 py-3.5 text-sm font-semibold rounded-3xl transition-all ${
              !isAdmin 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Voter Login
          </button>
          <button
            type="button"
            onClick={() => setIsAdmin(true)}
            className={`flex-1 py-3.5 text-sm font-semibold rounded-3xl transition-all ${
              isAdmin 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Admin Login
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {isAdmin ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Admin Email Address</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={set}
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 placeholder:text-slate-400 text-slate-900"
                    placeholder="admin@evoteface.gov.in"
                    autoComplete="username"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Voter ID Number</label>
                  <input
                    name="voterID"
                    value={form.voterID}
                    onChange={set}
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 placeholder:text-slate-400 text-slate-900"
                    placeholder="Enter your Voter ID"
                    autoComplete="username"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={set}
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 placeholder:text-slate-400 text-slate-900"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-3xl text-lg transition-all active:scale-[0.985]"
              >
                {loading ? "Verifying Credentials..." : "Login Securely"}
              </button>
            </form>
          </div>

          {/* Footer Links */}
          {!isAdmin && (
            <div className="border-t border-slate-100 px-10 py-6 bg-slate-50 text-center">
              <p className="text-sm text-slate-600">
                New to eVoteface?{" "}
                <Link to="/register" className="text-emerald-600 font-semibold hover:underline">
                  Register as a Voter
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Security Info */}
        <div className="mt-8 bg-white border border-slate-100 rounded-3xl p-6 text-sm">
          <div className="flex items-center gap-3 mb-3">
            <i className="fa-solid fa-shield-halved text-emerald-500 text-xl"></i>
            <span className="font-semibold text-slate-800">
              {isAdmin ? "Administrator Access" : "Three-Factor Security"}
            </span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[13px]">
            {isAdmin 
              ? "Full control over elections, candidates, and voter approvals. All actions are logged for audit."
              : "Your account is protected by Voter ID + Password + upcoming Face Recognition & OTP verification."
            }
          </p>
        </div>

        {/* Trust Bar */}
        <div className="text-center text-xs text-slate-500 mt-10 flex items-center justify-center gap-6">
          <span>🔒 End-to-End Encrypted</span>
          <span>•</span>
          <span>🇮🇳 Government Compliant</span>
          <span>•</span>
          <span>✅ Secure Login</span>
        </div>
      </div>
    </div>
    </>
  );
}
