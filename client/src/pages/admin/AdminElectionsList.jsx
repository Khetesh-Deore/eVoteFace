import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const AdminElectionsList = () => {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/elections');
      setElections(response.data);
    } catch (error) {
      console.error('Fetch elections error:', error);
      toast.error('Failed to fetch elections');
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredElections = elections.filter(election => {
    if (filter === 'all') return true;
    return election.phase === filter;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-5 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Elections Management
            </h1>
            <p className="text-slate-600 mt-2 text-lg">Oversee all elections, phases, and performance</p>
          </div>

          {isSuperAdmin && (
          <Link
            to="/admin/elections/new"
            className="inline-flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-4 rounded-3xl transition-all active:scale-95 shadow-lg"
          >
            <i className="fa-solid fa-plus text-xl"></i>
            Create New Election
          </Link>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 mb-8 overflow-hidden">
          <div className="flex flex-wrap border-b border-slate-100">
            {[
              { key: 'all', label: 'All Elections', count: elections.length },
              { key: 'registration', label: 'Registration', count: elections.filter(e => e.phase === 'registration').length },
              { key: 'voting', label: 'Voting Phase', count: elections.filter(e => e.phase === 'voting').length },
              { key: 'completed', label: 'Completed', count: elections.filter(e => e.phase === 'completed').length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex-1 min-w-[140px] px-8 py-5 text-sm font-medium transition-all border-b-4 ${
                  filter === tab.key
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.label} 
                <span className="ml-2 text-xs bg-slate-200 px-2.5 py-0.5 rounded-full font-mono">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Elections Table / List */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {filteredElections.length === 0 ? (
            <div className="px-10 py-20 text-center">
              <div className="text-7xl mb-6 opacity-40">📭</div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-2">No elections found</h3>
              <p className="text-slate-600 max-w-sm mx-auto">
                {filter === 'all' 
                  ? 'Get started by creating your first election.' 
                  : `There are currently no elections in the ${filter} phase.`
                }
              </p>
              {filter === 'all' && isSuperAdmin && (
                <Link
                  to="/admin/elections/new"
                  className="mt-8 inline-flex items-center gap-3 bg-emerald-600 text-white px-8 py-4 rounded-3xl font-semibold hover:bg-emerald-700 transition-all"
                >
                  <i className="fa-solid fa-plus"></i>
                  Create New Election
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-8 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Election Details</th>
                    <th className="px-8 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Phase</th>
                    <th className="px-8 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Duration</th>
                    <th className="px-8 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Voters</th>
                    <th className="px-8 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Candidates</th>
                    <th className="px-8 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Votes Cast</th>
                    <th className="px-8 py-5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredElections.map((election) => (
                    <tr
                      key={election._id}
                      onClick={() => navigate(`/admin/elections/${election._id}`)}
                      className="hover:bg-slate-50 cursor-pointer transition-all group"
                    >
                      <td className="px-8 py-7">
                        <div className="font-semibold text-slate-900 text-lg group-hover:text-emerald-600 transition-colors">
                          {election.title}
                        </div>
                        <div className="text-slate-600 mt-1 line-clamp-2 text-sm">{election.description}</div>
                      </td>
                      <td className="px-8 py-7 whitespace-nowrap">
                        <span className={`inline-flex px-5 py-2 text-sm font-medium rounded-3xl ${getPhaseColor(election.phase)}`}>
                          {election.phase.charAt(0).toUpperCase() + election.phase.slice(1)}
                        </span>
                      </td>
                      <td className="px-8 py-7 whitespace-nowrap text-sm text-slate-600">
                        <div>{formatDate(election.startTime)}</div>
                        <div className="text-xs text-slate-400 mt-0.5">to {formatDate(election.endTime)}</div>
                      </td>
                      <td className="px-8 py-7 text-lg font-medium text-slate-900">
                        {election.stats?.voterCount || 0}
                      </td>
                      <td className="px-8 py-7 text-lg font-medium text-slate-900">
                        {election.stats?.candidateCount || 0}
                      </td>
                      <td className="px-8 py-7 text-lg font-medium text-emerald-600">
                        {election.stats?.votedCount || 0}
                      </td>
                      <td className="px-8 py-7 text-right">
                        <span 
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          Manage Election 
                          <i className="fa-solid fa-arrow-right text-sm"></i>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminElectionsList;
