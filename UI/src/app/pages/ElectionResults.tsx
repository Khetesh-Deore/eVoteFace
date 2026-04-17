import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Trophy, Users, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import PhaseIndicator from '../components/PhaseIndicator';
import LoadingSpinner from '../components/LoadingSpinner';
import axiosInstance from '../lib/axios';
import { toast } from 'react-toastify';

export default function ElectionResults() {
  const { id } = useParams();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
    
    // Auto-refresh every 10 seconds if voting is live
    const interval = setInterval(() => {
      if (results?.election?.phase === 'voting') {
        loadResults();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [id, results?.election?.phase]);

  const loadResults = async () => {
    try {
      const response = await axiosInstance.get(`/elections/${id}/votes/results`);
      setResults(response.data);
    } catch (error) {
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!results) return <div>No results available</div>;

  const maxVotes = Math.max(...results.candidates.map((c: any) => parseInt(c.voteCount)));
  const totalVotes = parseInt(results.totalVotesCast);

  return (
    <div className="min-h-screen bg-[#f5f5f5] py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          to={`/elections/${id}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#e94560] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Election Details
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-[#1a1a2e]">Election Results</h1>
            <PhaseIndicator phase={results.election.phase} />
          </div>
          <h2 className="text-xl text-gray-700 mb-2">{results.election.title}</h2>
          {results.election.phase === 'voting' && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span>Live · Auto-refreshes every 10s</span>
            </div>
          )}
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="w-10 h-10 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Votes Cast</p>
                <p className="text-3xl font-bold text-[#1a1a2e]">{totalVotes}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <div className="flex items-center gap-3">
              <Users className="w-10 h-10 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Candidates</p>
                <p className="text-3xl font-bold text-[#1a1a2e]">{results.candidates.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <div className="flex items-center gap-3">
              <Users className="w-10 h-10 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Voter Turnout</p>
                <p className="text-3xl font-bold text-[#1a1a2e]">
                  {totalVotes > 0 ? ((totalVotes / (results.stats?.registeredVoters || 1)) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Winner Banner */}
        {results.winner && results.election.phase === 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl shadow-lg p-8 mb-6 text-white"
          >
            <div className="flex items-center gap-4">
              <Trophy className="w-16 h-16" />
              <div>
                <h3 className="text-2xl font-bold mb-1">🏆 Election Winner</h3>
                <p className="text-3xl font-bold">{results.winner.name}</p>
                <p className="text-xl">{results.winner.party}</p>
                <p className="text-lg mt-2">
                  {results.winner.voteCount} votes 
                  ({((parseInt(results.winner.voteCount) / totalVotes) * 100).toFixed(1)}%)
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold text-[#1a1a2e] mb-6">
            {results.election.phase === 'voting' ? 'Live Vote Count' : 'Final Results'}
          </h2>

          <div className="space-y-4">
            {results.candidates
              .sort((a: any, b: any) => parseInt(b.voteCount) - parseInt(a.voteCount))
              .map((candidate: any, index: number) => {
                const votes = parseInt(candidate.voteCount);
                const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                const isWinner = results.winner && results.winner.id === candidate.id;

                return (
                  <div
                    key={candidate.id}
                    className={`p-6 border-2 rounded-lg transition-all ${
                      isWinner ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4 flex-1">
                        {candidate.partySymbol ? (
                          <img
                            src={candidate.partySymbol}
                            alt={candidate.party}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xl font-bold text-gray-500">
                              {candidate.name[0]}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-gray-900">{candidate.name}</h3>
                            {isWinner && <Trophy className="w-5 h-5 text-orange-500" />}
                          </div>
                          <p className="text-sm text-gray-600">{candidate.party}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-[#1a1a2e]">{votes}</p>
                        <p className="text-sm text-gray-600">{percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(votes / maxVotes) * 100}%` }}
                        transition={{ duration: 0.7, delay: index * 0.1 }}
                        className={`h-full rounded-full ${
                          isWinner ? 'bg-orange-500' : 'bg-[#1a1a2e]'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Results are sourced directly from the Ethereum Sepolia blockchain and cannot be altered.
            </p>
            <p className="text-xs text-gray-400 mt-1 font-mono">
              Contract: {results.election.contractAddress}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
