import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useElection } from '../../context/ElectionContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { user } = useAuth();
  const { fetchVoterElections } = useElection();
  const navigate = useNavigate();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = async () => {
    try {
      setLoading(true);
      const data = await fetchVoterElections();
      if (data && Array.isArray(data)) {
        setElections(data);
      } else {
        setElections([]);
      }
    } catch (error) {
      console.error('Load elections error:', error);
      toast.error('Failed to load elections');
      setElections([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (election) => {
    const status = election.userStatus || {};

    if (status.hasVoted) {
      return { text: 'Voted', color: 'bg-emerald-100 text-emerald-700 border border-emerald-200', icon: '✓' };
    }

    if (election.phase === 'completed') {
      return { text: 'Completed', color: 'bg-slate-100 text-slate-700 border border-slate-200', icon: '🏁' };
    }

    if (election.phase === 'voting') {
      if (!status.isVerified) return { text: 'Pending Approval', color: 'bg-amber-100 text-amber-700 border border-amber-200', icon: '⏳' };
      if (!status.walletAddress) return { text: 'Connect Wallet', color: 'bg-blue-100 text-blue-700 border border-blue-200', icon: '🦊' };
      if (!status.facePhotoUrl) return { text: 'Face Required', color: 'bg-purple-100 text-purple-700 border border-purple-200', icon: '📷' };
      if (!status.isRegisteredOnChain) return { text: 'Pending On-Chain', color: 'bg-orange-100 text-orange-700 border border-orange-200', icon: '⛓️' };
      return { text: 'Ready to Vote', color: 'bg-emerald-100 text-emerald-700 border border-emerald-200', icon: '🗳️' };
    }

    if (election.phase === 'registration') {
      if (!status.isVerified) return { text: 'Pending Approval', color: 'bg-amber-100 text-amber-700 border border-amber-200', icon: '⏳' };
      return { text: 'Approved', color: 'bg-emerald-100 text-emerald-700 border border-emerald-200', icon: '✓' };
    }

    return { text: 'Unknown', color: 'bg-slate-100 text-slate-700 border border-slate-200', icon: '?' };
  };

  const canVote = (election) => {
    const status = election.userStatus || {};
    return (
      election.phase === 'voting' &&
      status.isVerified &&
      status.walletAddress &&
      status.facePhotoUrl &&
      status.isRegisteredOnChain &&
      !status.hasVoted
    );
  };

  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'registration': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'voting': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'completed': return 'bg-slate-100 text-slate-700 border border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-6">
      <div className="max-w-screen-2xl mx-auto">
        
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Voter Dashboard
          </h1>
          <p className="text-slate-600 mt-3 text-lg">
            Welcome back, <span className="font-medium text-slate-800">{user?.fullName || 'Voter'}</span>
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 card-hover">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Total Elections</p>
                <p className="text-5xl font-semibold text-slate-900 mt-4">{elections.length}</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl">📋</div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 card-hover">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Active Elections</p>
                <p className="text-5xl font-semibold text-emerald-600 mt-4">
                  {elections.filter(e => e.phase === 'voting').length}
                </p>
              </div>
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl">🗳️</div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 card-hover">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Votes Cast</p>
                <p className="text-5xl font-semibold text-slate-900 mt-4">
                  {elections.filter(e => e.userStatus?.hasVoted).length}
                </p>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-3xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 card-hover">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Pending Approval</p>
                <p className="text-5xl font-semibold text-amber-600 mt-4">
                  {elections.filter(e => !e.userStatus?.isVerified).length}
                </p>
              </div>
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-3xl">⏳</div>
            </div>
          </div>
        </div>

        {/* My Elections */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">My Elections</h2>
            <Link 
              to="/elections" 
              className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-2"
            >
              Browse More Elections →
            </Link>
          </div>

          {elections.length === 0 ? (
            <div className="px-8 py-20 text-center">
              <div className="text-6xl mb-6">🗳️</div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-3">No elections yet</h3>
              <p className="text-slate-600 max-w-sm mx-auto">
                You haven't been registered for any elections. Browse available elections to get started.
              </p>
              <Link
                to="/elections"
                className="mt-8 inline-block bg-emerald-600 text-white px-10 py-4 rounded-3xl font-semibold hover:bg-emerald-700 transition-all"
              >
                Browse All Elections
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {elections.map((election) => {
                const statusBadge = getStatusBadge(election);
                const votingEnabled = canVote(election);

                return (
                  <div key={election._id} className="px-8 py-8 hover:bg-slate-50 transition-all group">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-8">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <h3 className="text-2xl font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                            {election.title}
                          </h3>
                          <span className={`px-5 py-1.5 rounded-3xl text-sm font-medium ${getPhaseColor(election.phase)}`}>
                            {election.phase}
                          </span>
                          <span className={`px-5 py-1.5 rounded-3xl text-sm font-medium ${statusBadge.color}`}>
                            {statusBadge.icon} {statusBadge.text}
                          </span>
                        </div>

                        <p className="text-slate-600 mb-4 line-clamp-2">{election.description}</p>

                        <div className="flex items-center gap-6 text-sm text-slate-500">
                          <span>📅 {formatDate(election.startTime)} — {formatDate(election.endTime)}</span>
                          {election.userStatus?.votedAt && (
                            <span className="text-emerald-600">✓ Voted on {formatDate(election.userStatus.votedAt)}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 lg:min-w-[220px]">
                        {votingEnabled && (
                          <Link
                            to={`/elections/${election._id}/vote`}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-3xl text-center transition-all active:scale-95"
                          >
                            Vote Now →
                          </Link>
                        )}
                        <Link
                          to={`/elections/${election._id}`}
                          className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-4 rounded-3xl text-center transition-all"
                        >
                          View Details
                        </Link>
                        {election.phase === 'completed' && (
                          <Link
                            to={`/elections/${election._id}/results`}
                            className="flex-1 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-medium py-4 rounded-3xl text-center transition-all"
                          >
                            View Results
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Voting Requirements Progress */}
                    {election.phase === 'voting' && !election.userStatus?.hasVoted && (
                      <div className="mt-8 pt-6 border-t border-slate-100">
                        <p className="text-sm font-medium text-slate-700 mb-4">Voting Requirements Status</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {[
                            { label: "Admin Approval", done: election.userStatus?.isVerified },
                            { label: "Wallet Connected", done: !!election.userStatus?.walletAddress },
                            { label: "Face Registered", done: !!election.userStatus?.facePhotoUrl },
                            { label: "On-Chain Registered", done: election.userStatus?.isRegisteredOnChain },
                          ].map((req, idx) => (
                            <div key={idx} className={`flex items-center gap-3 ${req.done ? 'text-emerald-600' : 'text-slate-400'}`}>
                              <span className="text-xl">{req.done ? '✓' : '○'}</span>
                              <span>{req.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Browse More */}
        <div className="mt-12 text-center">
          <Link
            to="/elections"
            className="inline-flex items-center gap-3 text-emerald-600 hover:text-emerald-700 font-medium text-lg"
          >
            <span>Browse All Available Elections</span>
            <span className="text-2xl">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;