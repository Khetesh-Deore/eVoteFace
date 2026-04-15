import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useElection } from '../../context/ElectionContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const ElectionsList = () => {
  const { fetchPublicElections } = useElection();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, registration, voting, upcoming

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = async () => {
    try {
      setLoading(true);
      const data = await fetchPublicElections();
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = (election) => {
    const now = new Date();
    const start = new Date(election.startTime);
    return start > now;
  };

  const filteredElections = elections.filter(election => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return isUpcoming(election);
    return election.phase === filter;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Public Elections</h1>
        <p className="text-gray-600 mt-2">Browse all active and upcoming elections</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 font-medium transition whitespace-nowrap ${
              filter === 'all'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Elections ({elections.length})
          </button>
          <button
            onClick={() => setFilter('voting')}
            className={`px-6 py-3 font-medium transition whitespace-nowrap ${
              filter === 'voting'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Active Voting ({elections.filter(e => e.phase === 'voting').length})
          </button>
          <button
            onClick={() => setFilter('registration')}
            className={`px-6 py-3 font-medium transition whitespace-nowrap ${
              filter === 'registration'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Registration ({elections.filter(e => e.phase === 'registration').length})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-6 py-3 font-medium transition whitespace-nowrap ${
              filter === 'upcoming'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Upcoming ({elections.filter(e => isUpcoming(e)).length})
          </button>
        </div>
      </div>

      {/* Elections Grid */}
      {filteredElections.length === 0 ? (
        <div className="bg-white rounded-lg shadow px-6 py-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No elections found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' 
              ? 'There are no elections available at the moment.'
              : `No elections in ${filter} phase.`
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredElections.map((election) => (
            <Link
              key={election._id}
              to={`/elections/${election._id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">
                    {election.title}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPhaseColor(election.phase)}`}>
                    {election.phase}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {election.description}
                </p>

                {/* Dates */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Starts: {formatDate(election.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Ends: {formatDate(election.endTime)}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{election.voterCount || 0} voters</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{election.candidates?.length || 0} candidates</span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  {election.phase === 'voting' && (
                    <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                      Live
                    </div>
                  )}
                  {isUpcoming(election) && (
                    <div className="flex items-center gap-1 text-blue-600 text-sm font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Upcoming
                    </div>
                  )}
                </div>

                {/* View Details Button */}
                <div className="mt-4">
                  <div className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center font-medium transition">
                    View Details →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex gap-4">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-800 mb-1">How to participate</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Register as a voter if you haven't already</li>
              <li>• Wait for admin approval for the specific election</li>
              <li>• Connect your MetaMask wallet and register your face photo</li>
              <li>• Vote during the voting phase using 3-factor authentication</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElectionsList;
