import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useElection } from '../context/ElectionContext';
import { useAuth } from '../context/AuthContext';
import { Calendar, Users, User, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import PhaseIndicator from '../components/PhaseIndicator';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';

export default function Elections() {
  const { elections, loading, fetchPublicElections, fetchVoterElections } = useElection();
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchVoterElections();
    } else {
      fetchPublicElections();
    }
  }, [user]);

  const filteredElections = elections.filter((election) => {
    if (filter === 'all') return true;
    return election.phase === filter;
  });

  const getElectionCounts = () => {
    return {
      all: elections.length,
      registration: elections.filter((e) => e.phase === 'registration').length,
      voting: elections.filter((e) => e.phase === 'voting').length,
      completed: elections.filter((e) => e.phase === 'completed').length,
    };
  };

  const counts = getElectionCounts();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#f5f5f5] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a2e] mb-4">
            Public Elections
          </h1>
          <p className="text-lg text-gray-600">
            Browse all active and upcoming elections
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          {[
            { key: 'all', label: `All Elections (${counts.all})` },
            { key: 'voting', label: `Active Voting (${counts.voting})` },
            { key: 'registration', label: `Registration (${counts.registration})` },
            { key: 'completed', label: `Completed (${counts.completed})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                filter === tab.key
                  ? 'bg-[#e94560] text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Elections Grid */}
        {filteredElections.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No elections found for this filter.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredElections.map((election, index) => (
              <motion.div
                key={election._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                <div className="p-6 space-y-4">
                  {/* Title and Phase */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl font-bold text-[#1a1a2e] group-hover:text-[#e94560] transition-colors line-clamp-2">
                      {election.title}
                    </h3>
                    <PhaseIndicator phase={election.phase} />
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {election.description || 'No description available'}
                  </p>

                  {/* Dates */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Start: {format(new Date(election.startTime), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>End: {format(new Date(election.endTime), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{election.voterCount || 0} Voters</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{election.candidates?.length || 0} Candidates</span>
                    </div>
                  </div>

                  {/* Live Indicator */}
                  {election.phase === 'voting' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                      <span className="text-sm font-medium">Voting is Live</span>
                    </div>
                  )}

                  {/* View Details Button */}
                  <Link
                    to={`/elections/${election._id}`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                  >
                    View Details
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
