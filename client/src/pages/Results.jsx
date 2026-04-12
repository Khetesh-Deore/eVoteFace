import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import PhaseIndicator from "../components/common/PhaseIndicator";
import ElectionSelector from "../components/common/ElectionSelector";
import { useElection } from "../context/ElectionContext";
import { Clock, Users, TrendingUp, RefreshCw, Download, BarChart3 } from "lucide-react";

export default function Results() {
  const { selectedElectionId, currentElectionDetails, allElections } = useElection();
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedElections, setSelectedElections] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);

  // Load results for selected election
  const load = useCallback(async () => {
    if (!selectedElectionId) return;
    
    try {
      const [resultsRes, statsRes] = await Promise.all([
        api.get(`/elections/${selectedElectionId}/votes/results`),
        api.get(`/elections/${selectedElectionId}`),
      ]);
      
      setData(resultsRes.data);
      setStats(statsRes.data.stats);
      setLastUpdated(new Date());
      
      // Check if live updates needed
      const phase = resultsRes.data.election?.phase || resultsRes.data.phase;
      setIsLive(phase === "voting");
    } catch (error) {
      console.error("Failed to load results:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedElectionId]);

  // Load comparison data
  const loadComparison = useCallback(async () => {
    if (selectedElections.length === 0) return;
    
    try {
      const promises = selectedElections.map(id =>
        api.get(`/elections/${id}/votes/results`).catch(() => null)
      );
      const results = await Promise.all(promises);
      setComparisonData(results.filter(r => r !== null).map(r => r.data));
    } catch (error) {
      console.error("Failed to load comparison:", error);
    }
  }, [selectedElections]);

  // Initial load
  useEffect(() => {
    if (selectedElectionId) {
      setLoading(true);
      load();
    }
  }, [selectedElectionId, load]);

  // Auto-refresh during voting phase
  useEffect(() => {
    if (!selectedElectionId || !isLive) return;
    
    const interval = setInterval(load, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, [selectedElectionId, isLive, load]);

  // Update time remaining
  useEffect(() => {
    if (!currentElectionDetails?.endTime) return;
    
    const updateTime = () => {
      const now = new Date();
      const end = new Date(currentElectionDetails.endTime);
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining("Voting ended");
        setIsLive(false);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [currentElectionDetails]);

  // Load comparison when mode changes
  useEffect(() => {
    if (comparisonMode) {
      loadComparison();
    }
  }, [comparisonMode, loadComparison]);

  // Calculate statistics
  const calculateStats = () => {
    if (!data || !stats) return null;
    
    const totalVotes = data.totalVotes || 0;
    const totalVoters = stats.offChain?.totalUsers || 0;
    const registeredVoters = stats.offChain?.verifiedVoters || 0;
    const turnout = registeredVoters > 0 ? (totalVotes / registeredVoters) * 100 : 0;
    const votesRemaining = registeredVoters - totalVotes;

    return {
      totalVotes,
      totalVoters,
      registeredVoters,
      turnout,
      votesRemaining: votesRemaining > 0 ? votesRemaining : 0,
    };
  };

  const statsData = calculateStats();

  // Export results
  const exportResults = () => {
    if (!data) return;
    
    const csv = [
      ['Candidate', 'Party', 'Votes', 'Percentage'],
      ...data.results.map(c => [
        c.name,
        c.partyName,
        c.voteCount,
        ((c.voteCount / data.totalVotes) * 100).toFixed(2) + '%'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentElectionDetails?.title || 'election'}_results.csv`;
    a.click();
  };

  if (!selectedElectionId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">No election selected</p>
        <p className="text-sm text-gray-400">Please select an election to view results</p>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  const maxVotes = Math.max(...(data?.results?.map(c => c.voteCount) || [1]), 1);
  const isCompleted = data?.election?.phase === "completed" || data?.phase === "completed";

  // Comparison View
  if (comparisonMode) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-primary">Election Comparison</h1>
          <button
            onClick={() => setComparisonMode(false)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Back to Single View
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Select Elections to Compare</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {allElections.map(election => (
              <label key={election._id} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedElections.includes(election._id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedElections([...selectedElections, election._id]);
                    } else {
                      setSelectedElections(selectedElections.filter(id => id !== election._id));
                    }
                  }}
                />
                <span className="text-sm">{election.title}</span>
              </label>
            ))}
          </div>
        </div>

        {comparisonData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comparisonData.map((electionData, idx) => (
              <div key={idx} className="card">
                <h3 className="font-semibold text-lg mb-3">{electionData.election?.title}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Votes:</span>
                    <span className="font-semibold">{electionData.totalVotes}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Candidates:</span>
                    <span className="font-semibold">{electionData.results?.length}</span>
                  </div>
                  {electionData.winner && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-500 mb-1">Winner</p>
                      <p className="font-semibold">{electionData.winner.name}</p>
                      <p className="text-xs text-gray-600">{electionData.winner.voteCount} votes</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Single Election View
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center gap-3 mb-4">
          <ElectionSelector />
          <button
            onClick={() => setComparisonMode(true)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Compare Elections
          </button>
        </div>
        
        <h1 className="text-3xl font-bold text-primary">Election Results</h1>
        <p className="text-gray-500 text-sm mt-1">{currentElectionDetails?.title || 'Election'}</p>
        
        {currentElectionDetails?.description && (
          <p className="text-xs text-gray-400 mt-1">{currentElectionDetails.description}</p>
        )}
        
        <div className="flex justify-center items-center gap-3 mt-3">
          {data?.election?.phase && <PhaseIndicator phase={data.election.phase} />}
          {isLive && (
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
              Live
            </span>
          )}
        </div>
        
        {lastUpdated && (
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-2">
            <RefreshCw className="w-3 h-3" />
            <span>
              Last updated: {lastUpdated.toLocaleTimeString("en-IN")}
              {isLive && " · Auto-refreshes every 10s"}
            </span>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      {statsData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary">{statsData.totalVotes}</div>
            <div className="text-xs text-gray-500 mt-1">Votes Cast</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary">{statsData.registeredVoters}</div>
            <div className="text-xs text-gray-500 mt-1">Registered Voters</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-green-600">{statsData.turnout.toFixed(1)}%</div>
            <div className="text-xs text-gray-500 mt-1">Voter Turnout</div>
          </div>
          {!isCompleted && statsData.votesRemaining > 0 && (
            <div className="card text-center">
              <div className="text-3xl font-bold text-orange-600">{statsData.votesRemaining}</div>
              <div className="text-xs text-gray-500 mt-1">Votes Remaining</div>
            </div>
          )}
          {isCompleted && (
            <div className="card text-center">
              <div className="text-3xl font-bold text-primary">{data?.results?.length || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Candidates</div>
            </div>
          )}
        </div>
      )}

      {/* Time Remaining */}
      {timeRemaining && !isCompleted && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              {timeRemaining === "Voting ended" ? "Voting has ended" : `Time remaining: ${timeRemaining}`}
            </p>
            <p className="text-xs text-blue-600">
              {timeRemaining === "Voting ended" 
                ? "Results will be finalized shortly" 
                : "Results will be final when voting ends"}
            </p>
          </div>
        </div>
      )}

      {/* Winner Banner */}
      {isCompleted && data?.winner && (
        <div className="card bg-gradient-to-r from-primary to-blue-800 text-white text-center mb-8">
          <p className="text-sm opacity-75 mb-1">🏆 Election Winner</p>
          <p className="text-3xl font-bold">{data.winner.name}</p>
          <p className="text-blue-200 text-lg">{data.winner.partyName}</p>
          <p className="text-4xl font-bold mt-3">
            {data.winner.voteCount}
            <span className="text-lg font-normal opacity-75 ml-2">votes</span>
          </p>
          {statsData && (
            <p className="text-sm opacity-75 mt-2">
              {((data.winner.voteCount / data.totalVotes) * 100).toFixed(1)}% of total votes
            </p>
          )}
        </div>
      )}

      {/* Results */}
      <div className="card space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-primary">
            {isCompleted ? "Final Results" : "Live Vote Count"}
          </h2>
          <button
            onClick={exportResults}
            className="flex items-center gap-2 text-sm px-3 py-1 border rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {data?.results?.length === 0 && (
          <p className="text-gray-400 text-center py-6">No candidates registered yet.</p>
        )}

        {data?.results?.map((c) => {
          const pct = data.totalVotes > 0 ? (c.voteCount / data.totalVotes) * 100 : 0;
          const barWidth = maxVotes > 0 ? (c.voteCount / maxVotes) * 100 : 0;
          const isWinner = isCompleted && data.winner?.id === c.id;

          return (
            <div
              key={c.id}
              className={`p-4 rounded-lg border-2 transition-colors ${
                isWinner ? "border-accent bg-orange-50" : "border-gray-100"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                {c.partySymbol?.startsWith("http") ? (
                  <img src={c.partySymbol} alt={c.partyName} className="w-10 h-10 object-contain rounded" />
                ) : (
                  <div className="w-10 h-10 bg-primary rounded flex items-center justify-center text-white font-bold">
                    {c.name[0]}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-dark">{c.name}</p>
                    {isWinner && <span className="badge-success">🏆 Winner</span>}
                  </div>
                  <p className="text-xs text-gray-500">{c.partyName}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-dark">{c.voteCount}</p>
                  <p className="text-xs text-gray-500">{pct.toFixed(1)}%</p>
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isWinner ? "bg-accent" : "bg-primary"
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center mt-6">
        Results are sourced directly from the Ethereum Sepolia blockchain and cannot be altered.
        <br />
        Contract:{" "}
        <span className="font-mono">{currentElectionDetails?.contractAddress?.slice(0, 20)}...</span>
      </p>
    </div>
  );
}
