import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useElection } from '../../context/ElectionContext';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const ElectionDetail = () => {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getVoterStatus } = useElection();
  
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [results, setResults] = useState(null);
  const [voterStatus, setVoterStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestingRegistration, setRequestingRegistration] = useState(false);
  const [walletAddressInput, setWalletAddressInput] = useState('');

  useEffect(() => {
    loadElectionData();
  }, [electionId]);

  const loadElectionData = async () => {
    try {
      setLoading(true);

      // Fetch election details
      const electionResponse = await api.get(`/elections/${electionId}`);
      setElection(electionResponse.data);
      setCandidates(electionResponse.data.candidates || []);

      // Fetch voter status if logged in
      if (user) {
        const status = await getVoterStatus(electionId);
        setVoterStatus(status);
      }

      // Fetch results if voting or completed
      if (electionResponse.data.phase === 'voting' || electionResponse.data.phase === 'completed') {
        try {
          const resultsResponse = await api.get(`/votes/results/${electionId}`);
          setResults(resultsResponse.data);
        } catch (error) {
          console.error('Failed to fetch results:', error);
        }
      }
    } catch (error) {
      console.error('Load election error:', error);
      toast.error('Failed to load election details');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRegistration = async () => {
    if (!walletAddressInput) {
      toast.error('Please enter your wallet address');
      return;
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddressInput)) {
      toast.error('Invalid wallet address format');
      return;
    }

    try {
      setRequestingRegistration(true);
      
      await api.post(`/voters/elections/${electionId}/request-registration`, {
        walletAddress: walletAddressInput
      });
      
      toast.success('Registration request sent! Waiting for admin approval.');
      
      // Reload election data
      await loadElectionData();
      setWalletAddressInput('');
    } catch (error) {
      console.error('Request registration error:', error);
      toast.error(error.response?.data?.message || 'Failed to request registration');
    } finally {
      setRequestingRegistration(false);
    }
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canVote = () => {
    if (!voterStatus || !voterStatus.isRegistered) return false;
    return (
      election.phase === 'voting' &&
      voterStatus.isVerified &&
      voterStatus.walletAddress &&
      voterStatus.facePhotoUrl &&
      voterStatus.isRegisteredOnChain &&
      !voterStatus.hasVoted
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!election) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Election not found</h2>
          <Link to="/elections" className="text-blue-600 hover:underline mt-4 inline-block">
            Back to Elections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/elections')}
        className="text-blue-600 hover:text-blue-800 mb-6 flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Elections
      </button>

      {/* Election Header */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{election.title}</h1>
            <p className="text-gray-600">{election.description}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getPhaseColor(election.phase)}`}>
            {election.phase}
          </span>
        </div>

        {/* Election Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-600 mb-1">Start Date</p>
            <p className="font-medium text-gray-900">{formatDate(election.startTime)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">End Date</p>
            <p className="font-medium text-gray-900">{formatDate(election.endTime)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Registered Voters</p>
            <p className="font-medium text-gray-900">{election.voterCount || 0}</p>
          </div>
        </div>

        {/* Voter Actions */}
        {user && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            {voterStatus?.isRegistered ? (
              <div>
                {voterStatus.hasVoted ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-medium text-green-900">You have voted in this election</p>
                        <p className="text-sm text-green-700">
                          Voted on {formatDate(voterStatus.votedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : canVote() ? (
                  <Link
                    to={`/elections/${electionId}/vote`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Go Vote Now
                  </Link>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="font-medium text-yellow-900 mb-2">Registration Status</p>
                    <div className="space-y-2 text-sm">
                      <div className={`flex items-center gap-2 ${voterStatus.isVerified ? 'text-green-600' : 'text-gray-500'}`}>
                        {voterStatus.isVerified ? '✓' : '○'} Admin Approval
                      </div>
                      <div className={`flex items-center gap-2 ${voterStatus.walletAddress ? 'text-green-600' : 'text-gray-500'}`}>
                        {voterStatus.walletAddress ? '✓' : '○'} Wallet Connected
                      </div>
                      <div className={`flex items-center gap-2 ${voterStatus.facePhotoUrl ? 'text-green-600' : 'text-gray-500'}`}>
                        {voterStatus.facePhotoUrl ? '✓' : '○'} Face Photo Registered
                      </div>
                      <div className={`flex items-center gap-2 ${voterStatus.isRegisteredOnChain ? 'text-green-600' : 'text-gray-500'}`}>
                        {voterStatus.isRegisteredOnChain ? '✓' : '○'} Blockchain Registration
                      </div>
                    </div>
                    {election.phase === 'completed' && (
                      <p className="text-sm text-gray-600 mt-3">This election has ended.</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">Not Registered</p>
                    <p className="text-sm text-blue-700 mt-1 mb-3">
                      You are not registered for this election. Click below to request registration.
                    </p>
                    
                    {/* Wallet Address Input */}
                    <div className="bg-white rounded-lg p-3 mb-3 border border-blue-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your MetaMask Wallet Address (Required)
                      </label>
                      <input
                        type="text"
                        placeholder="0x..."
                        value={walletAddressInput}
                        onChange={(e) => setWalletAddressInput(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <span>💡</span>
                          <span>Open MetaMask → Click account name → Copy address</span>
                        </p>
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <span>⚠️</span>
                          <span>Do NOT use admin wallet: 0x5b97...f103</span>
                        </p>
                        <p className="text-xs text-blue-600 flex items-center gap-1">
                          <span>✓</span>
                          <span>You can use different wallets for different elections</span>
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleRequestRegistration}
                      disabled={requestingRegistration || !walletAddressInput}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition"
                    >
                      {requestingRegistration ? 'Requesting...' : 'Request Registration'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!user && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700">
                <Link to="/login" className="text-blue-600 hover:underline font-medium">
                  Login
                </Link>
                {' '}or{' '}
                <Link to="/register" className="text-blue-600 hover:underline font-medium">
                  Register
                </Link>
                {' '}to participate in this election.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Candidates Section */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Candidates</h2>
        
        {candidates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No candidates have been added yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate) => {
              const candidateResult = results?.candidates?.find(c => c.id === candidate.onChainId);
              const voteCount = candidateResult?.voteCount || '0';
              const totalVotes = results?.totalVotesCast || '0';
              const percentage = totalVotes > 0 
                ? ((Number(voteCount) / Number(totalVotes)) * 100).toFixed(1)
                : 0;

              return (
                <div
                  key={candidate._id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={candidate.partySymbol}
                      alt={candidate.partyName}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                      <p className="text-sm text-gray-600">{candidate.partyName}</p>
                    </div>
                  </div>

                  {/* Show results if voting or completed */}
                  {results && (election.phase === 'voting' || election.phase === 'completed') && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Votes</span>
                        <span className="font-semibold text-gray-900">{voteCount}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-right">{percentage}%</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Results Section */}
      {results && (election.phase === 'voting' || election.phase === 'completed') && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {election.phase === 'completed' ? 'Final Results' : 'Live Results'}
            </h2>
            {election.phase === 'voting' && (
              <div className="flex items-center gap-2 text-green-600">
                <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium">Live</span>
              </div>
            )}
          </div>

          {/* Winner */}
          {results.winner && election.phase === 'completed' && (
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-400 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <h3 className="text-2xl font-bold text-gray-900">Winner</h3>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-semibold text-gray-900">{results.winner.name}</p>
                  <p className="text-gray-700">{results.winner.party}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-yellow-600">{results.winner.voteCount}</p>
                  <p className="text-sm text-gray-600">votes</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Votes Cast</p>
              <p className="text-2xl font-bold text-gray-900">{results.totalVotesCast}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Candidates</p>
              <p className="text-2xl font-bold text-gray-900">{results.candidates?.length || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Registered Voters</p>
              <p className="text-2xl font-bold text-gray-900">{election.voterCount || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElectionDetail;
