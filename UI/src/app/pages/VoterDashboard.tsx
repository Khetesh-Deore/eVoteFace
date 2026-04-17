import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Users, CheckCircle, Clock, Vote as VoteIcon, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import PhaseIndicator from '../components/PhaseIndicator';
import LoadingSpinner from '../components/LoadingSpinner';
import axiosInstance from '../lib/axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

export default function VoterDashboard() {
  const { user } = useAuth();
  const [voterElections, setVoterElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVoterElections();
  }, []);

  const loadVoterElections = async () => {
    try {
      const response = await axiosInstance.get('/voters/elections');
      setVoterElections(response.data);
    } catch (error: any) {
      toast.error('Failed to load elections');
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    return {
      total: voterElections.length,
      active: voterElections.filter((e) => e.election.phase === 'voting').length,
      voted: voterElections.filter((e) => e.userStatus?.hasVoted).length,
      pending: voterElections.filter((e) => !e.userStatus?.isVerified).length,
    };
  };

  const stats = getStats();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#f5f5f5] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-[#1a1a2e] mb-2">Voter Dashboard</h1>
          <p className="text-lg text-gray-600">Welcome back, {user?.fullName}</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { icon: Users, label: 'Total Elections', value: stats.total, color: 'blue' },
            { icon: VoteIcon, label: 'Active Elections', value: stats.active, color: 'green' },
            { icon: CheckCircle, label: 'Votes Cast', value: stats.voted, color: 'purple' },
            { icon: Clock, label: 'Pending', value: stats.pending, color: 'yellow' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-md p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-[#1a1a2e]">{stat.value}</p>
                </div>
                <stat.icon className={`w-12 h-12 text-${stat.color}-600`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* My Elections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#1a1a2e]">My Elections</h2>
            <Link
              to="/elections"
              className="text-[#e94560] hover:underline font-medium"
            >
              Browse All Elections →
            </Link>
          </div>

          {voterElections.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                You haven't been registered for any elections yet.
              </p>
              <Link
                to="/elections"
                className="inline-block px-6 py-3 bg-[#e94560] hover:bg-[#d63651] text-white rounded-lg transition-colors"
              >
                Browse Elections
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {voterElections.map((item) => {
                const election = item.election;
                const status = item.userStatus;
                
                const canVote = status?.isVerified && 
                               status?.isRegisteredOnChain && 
                               !status?.hasVoted && 
                               election.phase === 'voting';

                return (
                  <div
                    key={election._id}
                    className="border-2 border-gray-200 rounded-lg p-6 hover:border-[#e94560] transition-all"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-[#1a1a2e]">
                            {election.title}
                          </h3>
                          <PhaseIndicator phase={election.phase} />
                          {status?.hasVoted && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              ✓ Voted
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{election.description}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(election.startTime), 'MMM dd, yyyy')} - {format(new Date(election.endTime), 'MMM dd, yyyy')}
                        </p>
                        {status?.hasVoted && status?.votedAt && (
                          <p className="text-sm text-green-600 mt-2">
                            Voted on: {format(new Date(status.votedAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {canVote && (
                          <Link
                            to={`/elections/${election._id}/vote`}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                          >
                            Vote Now
                          </Link>
                        )}
                        <Link
                          to={`/elections/${election._id}`}
                          className="px-6 py-2 border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg transition-colors font-medium"
                        >
                          View Details
                        </Link>
                        {election.phase === 'completed' && (
                          <Link
                            to={`/elections/${election._id}/results`}
                            className="px-6 py-2 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                          >
                            View Results
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Voting Requirements */}
                    {!status?.hasVoted && election.phase === 'voting' && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-2">Voting Requirements:</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <StatusBadge checked={status?.isVerified} label="Admin Approved" />
                          <StatusBadge checked={!!status?.walletAddress} label="Wallet Connected" />
                          <StatusBadge checked={!!status?.facePhotoUrl} label="Face Registered" />
                          <StatusBadge checked={status?.isRegisteredOnChain} label="On-Chain" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function StatusBadge({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {checked ? (
        <CheckCircle className="w-4 h-4 text-green-600" />
      ) : (
        <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
      )}
      <span className={`text-xs ${checked ? 'text-gray-900' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );
}
