import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const VoterAdminDashboard = () => {
  const { user } = useAuth();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      const response = await api.get('/admin/elections');
      setElections(response.data);
    } catch (error) {
      console.error('Fetch elections error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'registration': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'voting':       return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'completed':    return 'bg-slate-100 text-slate-700 border border-slate-200';
      default:             return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const pendingCount = elections.reduce((acc, e) => {
    const pending = (e.stats?.voterCount || 0) - (e.stats?.votedCount || 0);
    return acc + pending;
  }, 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-slate-50 py-5 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Voter Admin Panel
              </h1>
              <p className="text-slate-600 mt-2 text-lg">
                Welcome, <span className="font-medium text-slate-800">{user?.fullName}</span>
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3 bg-white px-6 py-3 rounded-3xl border border-slate-100">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-600">VOTER ADMIN</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <p className="text-sm font-medium text-slate-500">Total Elections</p>
            <p className="text-5xl font-semibold text-slate-900 mt-3">{elections.length}</p>
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <p className="text-sm font-medium text-slate-500">Total Voters</p>
            <p className="text-5xl font-semibold text-slate-900 mt-3">
              {elections.reduce((acc, e) => acc + (e.stats?.voterCount || 0), 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <p className="text-sm font-medium text-slate-500">Pending Approvals</p>
            <p className="text-5xl font-semibold text-amber-600 mt-3">{pendingCount}</p>
          </div>
        </div>

        {/* Elections List */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100">
            <h2 className="text-2xl font-semibold text-slate-900">Elections — Voter Management</h2>
            <p className="text-slate-500 mt-1 text-sm">Click an election to manage its voters</p>
          </div>

          <div className="divide-y divide-slate-100">
            {elections.length === 0 ? (
              <div className="px-8 py-16 text-center">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-slate-500">No elections available</p>
              </div>
            ) : (
              elections.map((election) => (
                <Link
                  key={election._id}
                  to={`/admin/elections/${election._id}?tab=voters`}
                  className="px-8 py-6 hover:bg-slate-50 flex items-center justify-between group transition-all"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {election.title}
                    </h3>
                    <div className="flex items-center gap-6 mt-2 text-sm text-slate-500">
                      <span>
                        <i className="fa-solid fa-users mr-1"></i>
                        {election.stats?.voterCount || 0} voters
                      </span>
                      <span>
                        <i className="fa-solid fa-check-circle mr-1 text-emerald-500"></i>
                        {election.stats?.votedCount || 0} voted
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-4 py-1.5 text-sm font-medium rounded-3xl ${getPhaseColor(election.phase)}`}>
                      {election.phase.charAt(0).toUpperCase() + election.phase.slice(1)}
                    </span>
                    <span className="text-slate-400 group-hover:text-blue-500 transition-colors">→</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default VoterAdminDashboard;
