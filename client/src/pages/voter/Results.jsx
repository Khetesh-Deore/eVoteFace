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
      case 'registration': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'voting': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'completed': return 'bg-slate-100 text-slate-700 border border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-slate-900">Results not available</h2>
          <Link to="/elections" className="mt-6 inline-block text-emerald-600 hover:underline">
            ← Back to Elections
          </Link>
        </div>
      </div>
    );
  }

  const sortedCandidates = [...results.candidates].sort((a, b) => 
    Number(b.voteCount) - Number(a.voteCount)
  );

  const totalVotes = Number(results.totalVotesCast || 0);
  const maxVotes = Math.max(...sortedCandidates.map(c => Number(c.voteCount)), 1);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-6">
      <div className="max-w-screen-2xl mx-auto">
        
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {results.election.title}
              </h1>
              <p className="text-slate-600 mt-3 max-w-2xl">{results.election.description}</p>
            </div>

            <div className="flex items-center gap-4">
              <span className={`px-6 py-3 rounded-3xl text-sm font-medium ${getPhaseColor(results.election.phase)}`}>
                {results.election.phase.toUpperCase()}
              </span>
              
              {results.election.phase === 'voting' && autoRefresh && (
                <div className="flex items-center gap-3 bg-emerald-100 text-emerald-700 px-5 py-2 rounded-3xl text-sm font-medium">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  LIVE RESULTS
                </div>
              )}
            </div>
          </div>

          {/* Auto-refresh Toggle */}
          {results.election.phase === 'voting' && (
            <div className="mt-6 flex items-center gap-4">
              <label className="flex items-center gap-3 cursor-pointer text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-5 h-5 accent-emerald-600"
                />
                Auto-refresh every 10 seconds
              </label>
              <button
                onClick={() => loadResults()}
                className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <i className="fa-solid fa-rotate"></i>
                Refresh Now
              </button>
            </div>
          )}
        </div>

        {/* Winner Banner (Completed Only) */}
        {results.winner && results.election.phase === 'completed' && (
          <div className="bg-gradient-to-br from-amber-400 to-yellow-500 text-white rounded-3xl p-12 mb-12 flex items-center gap-8">
            <div className="text-8xl">🏆</div>
            <div className="flex-1">
              <p className="uppercase tracking-widest text-sm opacity-90">Declared Winner</p>
              <h2 className="text-5xl font-bold mt-3">{results.winner.name}</h2>
              <p className="text-3xl mt-2 opacity-90">{results.winner.party}</p>
            </div>
            <div className="text-right">
              <p className="text-7xl font-bold">{results.winner.voteCount}</p>
              <p className="text-2xl opacity-80">votes</p>
              <p className="text-lg opacity-75 mt-2">
                {totalVotes > 0 ? ((Number(results.winner.voteCount) / totalVotes) * 100).toFixed(1) : 0}% of total
              </p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 card-hover">
            <p className="text-sm text-slate-500">Total Votes Cast</p>
            <p className="text-5xl font-semibold text-slate-900 mt-6">{totalVotes}</p>
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 card-hover">
            <p className="text-sm text-slate-500">Total Candidates</p>
            <p className="text-5xl font-semibold text-slate-900 mt-6">{results.candidates.length}</p>
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 card-hover">
            <p className="text-sm text-slate-500">Election Status</p>
            <p className="text-4xl font-semibold capitalize mt-6">{results.election.phase}</p>
          </div>
        </div>

        {/* Results Visualization */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-10 mb-12">
          <h2 className="text-3xl font-semibold mb-10">
            {results.election.phase === 'completed' ? 'Final Results' : 'Live Vote Count'}
          </h2>

          {sortedCandidates.length === 0 ? (
            <div className="py-20 text-center text-slate-500">No votes have been cast yet</div>
          ) : (
            <div className="space-y-10">
              {sortedCandidates.map((candidate, index) => {
                const voteCount = Number(candidate.voteCount);
                const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : 0;
                const barWidth = maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0;

                return (
                  <div key={candidate.id} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6 flex-1">
                        <div className="text-3xl font-bold text-slate-300 w-10">#{index + 1}</div>
                        
                        {candidate.partySymbol && (
                          <img 
                            src={candidate.partySymbol} 
                            alt={candidate.party} 
                            className="w-16 h-16 object-cover rounded-2xl border border-slate-100" 
                          />
                        )}
                        
                        <div>
                          <h3 className="text-2xl font-semibold text-slate-900">{candidate.name}</h3>
                          <p className="text-emerald-600 font-medium">{candidate.party}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-4xl font-bold text-slate-900">{voteCount}</p>
                        <p className="text-sm text-slate-500">{percentage}%</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          index === 0 && voteCount > 0 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                            : 'bg-slate-400'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Election Timeline */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-10">
          <h2 className="text-3xl font-semibold mb-8">Election Timeline</h2>
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">📅</div>
              <div>
                <p className="font-semibold">Started On</p>
                <p className="text-slate-600">{formatDate(results.election.startTime)}</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">⏰</div>
              <div>
                <p className="font-semibold">Ended On</p>
                <p className="text-slate-600">{formatDate(results.election.endTime)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-12 text-center">
          <Link
            to={`/elections/${electionId}`}
            className="inline-flex items-center gap-3 text-emerald-600 hover:text-emerald-700 font-medium"
          >
            ← Back to Election Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Results;