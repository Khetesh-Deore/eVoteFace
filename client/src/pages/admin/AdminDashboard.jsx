import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalElections: 0,
    activeElections: 0,
    completedElections: 0,
    totalVoters: 0,
    totalCandidates: 0,
    totalVotesCast: 0
  });
  const [recentElections, setRecentElections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/elections');
      const elections = response.data;

      const totalElections = elections.length;
      const activeElections = elections.filter(
        e => e.phase === 'registration' || e.phase === 'voting'
      ).length;
      const completedElections = elections.filter(
        e => e.phase === 'completed'
      ).length;

      let totalVoters = 0;
      let totalCandidates = 0;
      let totalVotesCast = 0;

      elections.forEach(election => {
        totalVoters += election.stats?.voterCount || 0;
        totalCandidates += election.stats?.candidateCount || 0;
        totalVotesCast += election.stats?.votedCount || 0;
      });

      setStats({
        totalElections,
        activeElections,
        completedElections,
        totalVoters,
        totalCandidates,
        totalVotesCast
      });

      setRecentElections(elections.slice(0, 5));
    } catch (error) {
      console.error('Fetch dashboard data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'registration':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'voting':
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'completed':
        return 'bg-slate-100 text-slate-700 border border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-5 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Admin Dashboard
              </h1>
              <p className="text-slate-600 mt-2 text-lg">
                Welcome back, <span className="font-medium text-slate-800">{user?.fullName || 'Admin'}</span>
              </p>
            </div>
            
            <div className="hidden md:flex items-center gap-3 bg-white px-6 py-3 rounded-3xl border border-slate-100">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-600">SUPER ADMIN</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 card-hover">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Elections</p>
                <p className="text-5xl font-semibold text-slate-900 mt-3">{stats.totalElections}</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                <i className="fa-solid fa-chart-bar text-3xl text-blue-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 card-hover">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Active Elections</p>
                <p className="text-5xl font-semibold text-emerald-600 mt-3">{stats.activeElections}</p>
              </div>
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <i className="fa-solid fa-circle-play text-3xl text-emerald-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 card-hover">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Voters</p>
                <p className="text-5xl font-semibold text-slate-900 mt-3">{stats.totalVoters.toLocaleString()}</p>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                <i className="fa-solid fa-users text-3xl text-purple-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 card-hover">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Candidates</p>
                <p className="text-5xl font-semibold text-slate-900 mt-3">{stats.totalCandidates}</p>
              </div>
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center">
                <i className="fa-solid fa-user-tie text-3xl text-amber-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 card-hover">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Votes Cast</p>
                <p className="text-5xl font-semibold text-slate-900 mt-3">{stats.totalVotesCast.toLocaleString()}</p>
              </div>
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center">
                <i className="fa-solid fa-check-to-slot text-3xl text-indigo-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 card-hover">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Completed Elections</p>
                <p className="text-5xl font-semibold text-slate-900 mt-3">{stats.completedElections}</p>
              </div>
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                <i className="fa-solid fa-flag-checkered text-3xl text-slate-600"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Link
            to="/admin/elections/new"
            className="group bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-3xl p-8 flex items-center justify-between transition-all duration-300 shadow-lg"
          >
            <div>
              <h3 className="text-2xl font-semibold">Create New Election</h3>
              <p className="text-emerald-100 mt-2">Set up a new voting event</p>
            </div>
            <div className="text-5xl group-hover:rotate-12 transition-transform">
              ➕
            </div>
          </Link>

          <Link
            to="/admin/elections"
            className="group bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-8 flex items-center justify-between transition-all duration-300"
          >
            <div>
              <h3 className="text-2xl font-semibold text-slate-900">Manage All Elections</h3>
              <p className="text-slate-600 mt-2">View, edit &amp; monitor ongoing elections</p>
            </div>
            <div className="text-5xl text-slate-300 group-hover:text-slate-400 transition-colors">
              📋
            </div>
          </Link>
        </div>

        {/* Recent Elections */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">Recent Elections</h2>
            <Link 
              to="/admin/elections" 
              className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-2"
            >
              View All <span>→</span>
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentElections.length === 0 ? (
              <div className="px-8 py-16 text-center">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-slate-500">No elections created yet</p>
              </div>
            ) : (
              recentElections.map((election) => (
                <Link
                  key={election._id}
                  to={`/admin/elections/${election._id}`}
                  className="px-8 py-7 hover:bg-slate-50 flex items-center justify-between group transition-all"
                >
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      {election.title}
                    </h3>
                    <p className="text-slate-600 mt-1 line-clamp-1">{election.description}</p>
                    
                    <div className="flex items-center gap-6 mt-4 text-sm text-slate-500">
                      <span>{election.stats?.voterCount || 0} voters</span>
                      <span>{election.stats?.candidateCount || 0} candidates</span>
                      <span className="font-medium text-emerald-600">
                        {election.stats?.votedCount || 0} votes cast
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className={`px-5 py-2 text-sm font-medium rounded-3xl ${getPhaseColor(election.phase)}`}>
                      {election.phase.charAt(0).toUpperCase() + election.phase.slice(1)}
                    </span>
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

export default AdminDashboard;
