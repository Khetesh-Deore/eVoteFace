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
      return { text: 'Voted', color: 'bg-green-100 text-green-800', icon: '✓' };
    }

    if (election.phase === 'completed') {
      return { text: 'Completed', color: 'bg-gray-100 text-gray-800', icon: '🏁' };
    }

    if (election.phase === 'voting') {
      if (!status.isVerified) {
        return { text: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' };
      }
      if (!status.walletAddress) {
        return { text: 'Connect Wallet', color: 'bg-blue-100 text-blue-800', icon: '🦊' };
      }
      if (!status.facePhotoUrl) {
        return { text: 'Face Required', color: 'bg-purple-100 text-purple-800', icon: '📷' };
      }
      if (!status.isRegisteredOnChain) {
        return { text: 'Pending On-Chain', color: 'bg-orange-100 text-orange-800', icon: '⛓️' };
      }
      return { text: 'Ready to Vote', color: 'bg-green-100 text-green-800', icon: '🗳️' };
    }

    if (election.phase === 'registration') {
      if (!status.isVerified) {
        return { text: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' };
      }
      return { text: 'Approved', color: 'bg-green-100 text-green-800', icon: '✓' };
    }

    return { text: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: '?' };
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
      case 'registration':
        return 'bg-blue-100 text-blue-800';
      case 'voting':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Voter Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.fullName}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Elections</p>
              <p className="text-3xl font-bold text-gray-900">{elections.length}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Elections</p>
              <p className="text-3xl font-bold text-green-600">
                {elections.filter(e => e.phase === 'voting').length}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Votes Cast</p>
              <p className="text-3xl font-bold text-gray-900">
                {elections.filter(e => e.userStatus?.hasVoted).length}
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">
                {elections.filter(e => !e.userStatus?.isVerified).length}
              </p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Elections List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">My Elections</h2>
        </div>

        {elections.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No elections yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              You haven't been registered for any elections yet.
            </p>
            <div className="mt-6">
              <Link
                to="/elections"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Browse Elections
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {elections.map((election) => {
              const statusBadge = getStatusBadge(election);
              const votingEnabled = canVote(election);

              return (
                <div
                  key={election._id}
                  className="px-6 py-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {election.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPhaseColor(election.phase)}`}>
                          {election.phase}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                          {statusBadge.icon} {statusBadge.text}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{election.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>📅 {formatDate(election.startTime)} - {formatDate(election.endTime)}</span>
                        {election.userStatus?.votedAt && (
                          <span>✓ Voted on {formatDate(election.userStatus.votedAt)}</span>
                        )}
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col gap-2">
                      {votingEnabled && (
                        <Link
                          to={`/elections/${election._id}/vote`}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-center"
                        >
                          Vote Now
                        </Link>
                      )}
                      <Link
                        to={`/elections/${election._id}`}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-center"
                      >
                        View Details
                      </Link>
                      {election.phase === 'completed' && (
                        <Link
                          to={`/elections/${election._id}/results`}
                          className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium text-center"
                        >
                          View Results
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Status Details */}
                  {election.phase === 'voting' && !election.userStatus?.hasVoted && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Voting Requirements:</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className={`flex items-center gap-2 text-sm ${election.userStatus?.isVerified ? 'text-green-600' : 'text-gray-400'}`}>
                          {election.userStatus?.isVerified ? '✓' : '○'} Admin Approval
                        </div>
                        <div className={`flex items-center gap-2 text-sm ${election.userStatus?.walletAddress ? 'text-green-600' : 'text-gray-400'}`}>
                          {election.userStatus?.walletAddress ? '✓' : '○'} Wallet Connected
                        </div>
                        <div className={`flex items-center gap-2 text-sm ${election.userStatus?.facePhotoUrl ? 'text-green-600' : 'text-gray-400'}`}>
                          {election.userStatus?.facePhotoUrl ? '✓' : '○'} Face Registered
                        </div>
                        <div className={`flex items-center gap-2 text-sm ${election.userStatus?.isRegisteredOnChain ? 'text-green-600' : 'text-gray-400'}`}>
                          {election.userStatus?.isRegisteredOnChain ? '✓' : '○'} On-Chain Registered
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Browse More Elections */}
      <div className="mt-8 text-center">
        <Link
          to="/elections"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Browse All Elections
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
