import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { useElection } from '../context/ElectionContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Calendar, Users, CheckCircle2, AlertCircle, Vote as VoteIcon } from 'lucide-react';
import { motion } from 'motion/react';
import PhaseIndicator from '../components/PhaseIndicator';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';
import axiosInstance from '../lib/axios';
import { toast } from 'react-toastify';

export default function ElectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchElectionById } = useElection();
  const { user } = useAuth();
  
  const [election, setElection] = useState<any>(null);
  const [voterStatus, setVoterStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    loadElectionData();
  }, [id]);

  const loadElectionData = async () => {
    if (!id) return;
    
    try {
      const electionData = await fetchElectionById(id);
      setElection(electionData);
      
      if (user) {
        try {
          const response = await axiosInstance.get(`/elections/${id}/voters/status`);
          setVoterStatus(response.data);
        } catch (err) {
          // User not registered for this election
        }
      }
    } catch (error) {
      toast.error('Failed to load election details');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRegistration = async () => {
    if (!walletAddress.trim()) {
      toast.error('Please enter your wallet address');
      return;
    }
    
    setRequesting(true);
    try {
      await axiosInstance.post(`/voters/elections/${id}/request-registration`, {
        walletAddress: walletAddress.trim()
      });
      toast.success('Registration request submitted successfully!');
      loadElectionData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to request registration');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!election) return <div>Election not found</div>;

  const canVote = voterStatus?.isVerified && 
                  voterStatus?.isRegisteredOnChain && 
                  !voterStatus?.hasVoted && 
                  election.phase === 'voting';

  return (
    <div className="min-h-screen bg-[#f5f5f5] py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          to="/elections"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#e94560] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Elections
        </Link>

        {/* Election Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-6"
        >
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a2e]">
              {election.title}
            </h1>
            <PhaseIndicator phase={election.phase} />
          </div>

          <p className="text-gray-600 mb-6">{election.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-500 mb-1">Start Date</div>
              <div className="font-semibold text-gray-900">
                {format(new Date(election.startTime), 'MMM dd, yyyy')}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">End Date</div>
              <div className="font-semibold text-gray-900">
                {format(new Date(election.endTime), 'MMM dd, yyyy')}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Registered Voters</div>
              <div className="font-semibold text-gray-900">{election.voterCount || 0}</div>
            </div>
          </div>
        </motion.div>

        {/* Voter Status Section */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-8 mb-6"
          >
            <h2 className="text-2xl font-bold text-[#1a1a2e] mb-6">Your Status</h2>

            {voterStatus?.hasVoted ? (
              <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-900">Vote Cast Successfully</h3>
                    <p className="text-sm text-green-700">
                      You voted on {format(new Date(voterStatus.votedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            ) : canVote ? (
              <div className="space-y-4">
                <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <h3 className="font-semibold text-green-900">Ready to Vote</h3>
                  </div>
                  <p className="text-sm text-green-700 mb-4">
                    All requirements are met. You can now cast your vote!
                  </p>
                  <button
                    onClick={() => navigate(`/elections/${id}/vote`)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    <VoteIcon className="w-5 h-5" />
                    Go Vote Now
                  </button>
                </div>
              </div>
            ) : voterStatus ? (
              <div className="space-y-4">
                <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-semibold text-yellow-900 mb-4">Registration Status</h3>
                  <div className="space-y-3">
                    <StatusItem
                      checked={voterStatus.isVerified}
                      label="Admin Approval"
                    />
                    <StatusItem
                      checked={!!voterStatus.walletAddress}
                      label="Wallet Connected"
                    />
                    <StatusItem
                      checked={!!voterStatus.facePhotoUrl}
                      label="Face Photo Registered"
                    />
                    <StatusItem
                      checked={voterStatus.isRegisteredOnChain}
                      label="Blockchain Registration"
                    />
                  </div>
                  {election.phase === 'completed' && (
                    <p className="mt-4 text-sm text-yellow-700">
                      This election has ended.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-4">Not Registered</h3>
                <p className="text-sm text-blue-700 mb-4">
                  Register for this election to participate in voting.
                </p>
                
                <div className="space-y-3">
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>💡 <strong>How to get your wallet address:</strong></p>
                    <ol className="ml-4 space-y-1 list-decimal">
                      <li>Open MetaMask extension</li>
                      <li>Click on your account name at the top</li>
                      <li>Copy your wallet address (0x...)</li>
                      <li>Paste it below</li>
                    </ol>
                    <p className="text-xs mt-2">⚠️ Do NOT use admin wallet: 0x5b97...f103</p>
                  </div>
                  
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="Your wallet address (0x...)"
                    className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  
                  <button
                    onClick={handleRequestRegistration}
                    disabled={requesting || !walletAddress.trim()}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
                  >
                    {requesting ? 'Requesting...' : '✓ Request Registration'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-8 mb-6"
          >
            <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Login Required</h3>
              <p className="text-gray-600 mb-4">
                Login or register to participate in this election
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  to="/login"
                  className="px-6 py-2 bg-[#e94560] hover:bg-[#d63651] text-white rounded-lg transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 border-2 border-[#e94560] text-[#e94560] hover:bg-[#e94560] hover:text-white rounded-lg transition-colors"
                >
                  Register
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Candidates Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold text-[#1a1a2e] mb-6">Candidates</h2>
          
          {election.candidates && election.candidates.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {election.candidates.map((candidate: any) => (
                <div
                  key={candidate._id}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#e94560] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {candidate.partySymbol ? (
                      <img
                        src={candidate.partySymbol}
                        alt={candidate.partyName}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-gray-500">
                          {candidate.name[0]}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{candidate.name}</h3>
                      <p className="text-sm text-gray-600">{candidate.partyName}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No candidates registered yet</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function StatusItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      {checked ? (
        <CheckCircle2 className="w-5 h-5 text-green-600" />
      ) : (
        <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
      )}
      <span className={checked ? 'text-gray-900' : 'text-gray-500'}>{label}</span>
    </div>
  );
}
