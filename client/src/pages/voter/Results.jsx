import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const Results = () => {
  const { electionId } = useParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadResults();
  }, [electionId]);

  useEffect(() => {
    if (!autoRefresh || results?.election?.phase === 'completed') return;

    const interval = setInterval(() => {
      loadResults(true);
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, results?.election?.phase]);

  const loadResults = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const response = await api.get(`/votes/results/${electionId}`);
      setResults(response.data);
    } catch (error) {
      console.error('Load results error:', error);
      if (!silent) {
        toast.error('Failed to load results');
      }
    } finally {
      if (!silent) setLoading(false);
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

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!results) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Results not available</h2>
          <Link to="/elections" className="text-blue-600 hover:underline mt-4 inline-block">
            Back to Elections
          </Link>
        </div>
      </div>
    );
  }

  const sortedCandidates = [...results.candidates].sort((a, b) => 
    Number(b.voteCount) - Number(a.voteCount)
  );

  const maxVotes = Math.max(...sortedCandidates.map(c => Number(c.voteCount)), 1);
  const totalVotes = Number(results.totalVotesCast);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{results.election.title}</h1>
            <p className="text-gray-600 mt-2">{results.election.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getPhaseColor(results.election.phase)}`}>
              {results.election.phase}
            </span>
            {results.election.phase === 'voting' && autoRefresh && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                <span>Live</span>
              </div>
            )}
          </div>
        </div>

        {/* Auto-refresh toggle */}
        {results.election.phase === 'voting' && (
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Auto-refresh every 10 seconds
            </label>
            <button
              onClick={() => loadResults()}
              className="ml-4 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Now
            </button>
          </div>
        )}
      </div>

      {/* Winner Banner */}
      {results.winner && results.election.phase === 'completed' && (
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-400 rounded-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-400 rounded-full p-4">
                <svg className="w-12 h-12 text-yellow-800" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{results.winner.name}</h2>
                <p className="text-xl text-gray-700">{results.winner.party}</p>
                <p className="text-sm text-gray-600 mt-1">Election Winner</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-5xl font-bold text-yellow-600">{results.winner.voteCount}</p>
              <p className="text-gray-600">votes</p>
              <p className="text-sm text-gray-500 mt-1">
                {totalVotes > 0 ? ((Number(results.winner.voteCount) / totalVotes) * 100).toFixed(1) : 0}% of total
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Votes Cast</p>
              <p className="text-3xl font-bold text-gray-900">{totalVotes}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Candidates</p>
              <p className="text-3xl font-bold text-gray-900">{results.candidates.length}</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Election Status</p>
              <p className="text-xl font-bold text-gray-900 capitalize">{results.election.phase}</p>
            </div>
            <div className={`rounded-full p-3 ${
              results.election.phase === 'completed' ? 'bg-gray-100' :
              results.election.phase === 'voting' ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              <svg className={`w-8 h-8 ${
                results.election.phase === 'completed' ? 'text-gray-600' :
                results.election.phase === 'voting' ? 'text-green-600' : 'text-blue-600'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Results Chart */}
      <div className="bg-white rounded-lg shadow p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {results.election.phase === 'completed' ? 'Final Results' : 'Live Results'}
        </h2>

        {sortedCandidates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No votes cast yet
          </div>
        ) : (
          <div className="space-y-6">
            {sortedCandidates.map((candidate, index) => {
              const voteCount = Number(candidate.voteCount);
              const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : 0;
              const barWidth = maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0;

              return (
                <div key={candidate.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2 min-w-[40px]">
                        <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                      </div>
                      {candidate.partySymbol && (
                        <img
                          src={candidate.partySymbol}
                          alt={candidate.party}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{candidate.name}</h3>
                        <p className="text-sm text-gray-600">{candidate.party}</p>
                      </div>
                    </div>
                    <div className="text-right min-w-[120px]">
                      <p className="text-2xl font-bold text-gray-900">{voteCount}</p>
                      <p className="text-sm text-gray-600">{percentage}%</p>
                    </div>
                  </div>

                  {/* Bar Chart */}
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                      <div
                        className={`h-8 rounded-full transition-all duration-500 flex items-center justify-end px-3 ${
                          index === 0 && voteCount > 0
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                            : 'bg-gradient-to-r from-gray-400 to-gray-500'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      >
                        {barWidth > 15 && (
                          <span className="text-white font-semibold text-sm">
                            {voteCount} votes
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Election Timeline */}
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Election Timeline</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 rounded-full p-2 mt-1">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Start Date</p>
              <p className="text-sm text-gray-600">{formatDate(results.election.startTime)}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-red-100 rounded-full p-2 mt-1">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">End Date</p>
              <p className="text-sm text-gray-600">{formatDate(results.election.endTime)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="mt-8 text-center">
        <Link
          to={`/elections/${electionId}`}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Election Details
        </Link>
      </div>
    </div>
  );
};

export default Results;
