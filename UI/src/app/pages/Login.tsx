import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Vote, Shield, Lock } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [credentials, setCredentials] = useState({
    voterID: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const loginData = isAdmin
        ? { email: credentials.email, password: credentials.password }
        : { voterID: credentials.voterID, password: credentials.password };
      
      await login(loginData, isAdmin);
      navigate(isAdmin ? '/admin/dashboard' : '/dashboard');
    } catch (error) {
      // Error handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f5f5] to-gray-200 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              {isAdmin ? (
                <Shield className="w-8 h-8 text-blue-600" />
              ) : (
                <Vote className="w-8 h-8 text-blue-600" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-[#1a1a2e] mb-2">
              {isAdmin ? 'Admin Login' : 'Voter Login'}
            </h1>
            <p className="text-gray-600">eVoteFace — Secure Digital Voting</p>
          </div>

          {/* Toggle Tabs */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg mb-6">
            <button
              onClick={() => setIsAdmin(false)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                !isAdmin
                  ? 'bg-[#1a1a2e] text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Voter Login
            </button>
            <button
              onClick={() => setIsAdmin(true)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                isAdmin
                  ? 'bg-[#1a1a2e] text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Admin Login
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isAdmin ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e94560] focus:border-transparent outline-none transition-all"
                  placeholder="admin@evoteface.com"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voter ID Number
                </label>
                <input
                  type="text"
                  value={credentials.voterID}
                  onChange={(e) => setCredentials({ ...credentials, voterID: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e94560] focus:border-transparent outline-none transition-all"
                  placeholder="VTR001"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e94560] focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#e94560] hover:bg-[#d63651] disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            {!isAdmin && (
              <p className="text-sm text-gray-600">
                New voter?{' '}
                <Link to="/register" className="text-[#e94560] hover:underline font-medium">
                  Register here
                </Link>
              </p>
            )}
            {isAdmin ? (
              <p className="text-sm text-gray-600">
                Voter?{' '}
                <button
                  onClick={() => setIsAdmin(false)}
                  className="text-[#e94560] hover:underline font-medium"
                >
                  Go to Voter Login
                </button>
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                Election Administrator?{' '}
                <button
                  onClick={() => setIsAdmin(true)}
                  className="text-[#e94560] hover:underline font-medium"
                >
                  Admin Login
                </button>
              </p>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">
                  {isAdmin ? 'Admin Access' : 'Three-Factor Security'}
                </h4>
                <p className="text-sm text-blue-700">
                  {isAdmin
                    ? 'Manage elections, candidates, and voters with full administrative control'
                    : 'Your vote is protected by MetaMask wallet + Face Recognition + OTP verification'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
