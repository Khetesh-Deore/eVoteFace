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

      const electionResponse = await api.get(`/elections/${electionId}`);
      setElection(electionResponse.data);
      setCandidates(electionResponse.data.candidates || []);

      if (user) {
        const status = await getVoterStatus(electionId);
        setVoterStatus(status);
      }

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
      await loadElectionData();
      setWalletAddressInput('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request registration');
    } finally {
      setRequestingRegistration(false);
    }
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

  if (loading) return <LoadingSpinner />;

  if (!election) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-slate-900">Election not found</h2>
          <Link to="/elections" className="mt-6 inline-block text-emerald-600 hover:underline font-medium">
            ← Back to All Elections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-6">
      <div className="max-w-screen-2xl mx-auto">
        
        {/* Back Button */}
        <button
          onClick={() => navigate('/elections')}
          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium mb-8"
        >
          ← Back to All Elections
        </button>

        {/* Main Header Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-10 mb-10">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {election.title}
                </h1>
                <span className={`px-6 py-2 rounded-3xl text-sm font-medium ${getPhaseColor(election.phase)}`}>
                  {election.phase.toUpperCase()}
                </span>
              </div>
              <p className="text-slate-600 text-lg leading-relaxed">{election.description}</p>
            </div>
          </div>

          {/* Election Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10 pt-8 border-t border-slate-100">
            <div>
              <p className="text-sm text-slate-500">Starts On</p>
              <p className="font-medium text-slate-900 mt-1">{formatDate(election.startTime)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Ends On</p>
              <p className="font-medium text-slate-900 mt-1">{formatDate(election.endTime)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Registered Voters</p>
              <p className="font-medium text-slate-900 mt-1">{election.voterCount || 0}</p>
            </div>
          </div>

          {/* Voter Action Area */}
          {user && (
            <div className="mt-10 pt-8 border-t border-slate-100">
              {voterStatus?.isRegistered ? (
                voterStatus.hasVoted ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8">
                    <div className="flex items-center gap-4">
                      <div className="text-5xl">🎉</div>
                      <div>
                        <p className="text-2xl font-semibold text-emerald-800">You have successfully voted!</p>
                        <p className="text-emerald-700 mt-2">
                          Voted on {formatDate(voterStatus.votedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : canVote() ? (
                  <Link
                    to={`/elections/${electionId}/vote`}
                    className="inline-flex items-center gap-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xl px-12 py-6 rounded-3xl transition-all active:scale-95 shadow-lg"
                  >
                    <span>🗳️</span>
                    Go to Voting Booth
                  </Link>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8">
                    <p className="font-semibold text-amber-800 mb-4">Complete these steps to vote:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {[
                        { label: "Admin Approval", done: voterStatus.isVerified },
                        { label: "Wallet Connected", done: !!voterStatus.walletAddress },
                        { label: "Face Photo Registered", done: !!voterStatus.facePhotoUrl },
                        { label: "Blockchain Registration", done: voterStatus.isRegisteredOnChain },
                      ].map((item, idx) => (
                        <div key={idx} className={`flex items-center gap-3 ${item.done ? 'text-emerald-600' : 'text-slate-500'}`}>
                          <span className="text-2xl">{item.done ? '✓' : '○'}</span>
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                /* Registration Request Form */
                <div className="bg-white border border-slate-200 rounded-3xl p-8">
                  <h3 className="text-xl font-semibold mb-2">Register for this Election</h3>
                  <p className="text-slate-600 mb-6">Enter your MetaMask wallet address to request registration.</p>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">MetaMask Wallet Address</label>
                    <input
                      type="text"
                      placeholder="0x1234...abcd"
                      value={walletAddressInput}
                      onChange={(e) => setWalletAddressInput(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={handleRequestRegistration}
                    disabled={requestingRegistration || !walletAddressInput}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-4 rounded-3xl transition-all"
                  >
                    {requestingRegistration ? 'Sending Request...' : 'Request Registration'}
                  </button>

                  <div className="mt-6 text-xs text-slate-500 space-y-1">
                    <p>💡 Open MetaMask → Click on your account → Copy address</p>
                    <p>⚠️ Use a different wallet for each election if you want</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {!user && (
            <div className="mt-8 bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center">
              <p className="text-slate-700">
                Please <Link to="/login" className="text-emerald-600 font-medium hover:underline">Login</Link> or{' '}
                <Link to="/register" className="text-emerald-600 font-medium hover:underline">Register</Link> to participate in this election.
              </p>
            </div>
          )}
        </div>

        {/* Candidates Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-10 mb-10">
          <h2 className="text-3xl font-semibold mb-8">Contestants</h2>
          
          {candidates.length === 0 ? (
            <p className="text-slate-500 text-center py-12">No candidates added yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {candidates.map((candidate) => {
                const candidateResult = results?.candidates?.find(c => c.id === candidate.onChainId);
                const voteCount = candidateResult?.voteCount || 0;
                const totalVotes = results?.totalVotesCast || 0;
                const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : 0;

                return (
                  <div key={candidate._id} className="border border-slate-200 rounded-3xl p-8 hover:shadow-xl transition-all card-hover">
                    <div className="flex items-center gap-5 mb-6">
                      <img
                        src={candidate.partySymbol}
                        alt={candidate.partyName}
                        className="w-24 h-24 object-cover rounded-2xl border border-slate-100"
                      />
                      <div>
                        <h3 className="text-2xl font-semibold">{candidate.name}</h3>
                        <p className="text-emerald-600 font-medium">{candidate.partyName}</p>
                      </div>
                    </div>

                    {(election.phase === 'voting' || election.phase === 'completed') && results && (
                      <div className="pt-6 border-t border-slate-100">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-600">Votes Received</span>
                          <span className="font-semibold">{voteCount}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-2 bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-right text-xs text-slate-500 mt-1">{percentage}%</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live / Final Results Section */}
        {results && (election.phase === 'voting' || election.phase === 'completed') && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-semibold">
                {election.phase === 'completed' ? 'Final Results' : 'Live Results'}
              </h2>
              {election.phase === 'voting' && (
                <div className="flex items-center gap-2 text-emerald-600 font-medium">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  LIVE UPDATING
                </div>
              )}
            </div>

            {results.winner && election.phase === 'completed' && (
              <div className="bg-gradient-to-br from-amber-400 to-yellow-500 text-white rounded-3xl p-10 mb-10">
                <div className="flex items-center gap-6">
                  <span className="text-7xl">🏆</span>
                  <div>
                    <p className="uppercase tracking-[2px] text-sm opacity-90">Declared Winner</p>
                    <h3 className="text-4xl font-bold mt-2">{results.winner.name}</h3>
                    <p className="text-2xl opacity-90 mt-1">{results.winner.party}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-slate-50 rounded-2xl p-6">
                <p className="text-slate-500">Total Votes Cast</p>
                <p className="text-4xl font-semibold text-slate-900 mt-3">{results.totalVotesCast}</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-6">
                <p className="text-slate-500">Candidates</p>
                <p className="text-4xl font-semibold text-slate-900 mt-3">{results.candidates?.length || 0}</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-6">
                <p className="text-slate-500">Registered Voters</p>
                <p className="text-4xl font-semibold text-slate-900 mt-3">{election.voterCount || 0}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ElectionDetail;