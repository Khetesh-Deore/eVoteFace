import { useState, useEffect } from "react";
import api from "../utils/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import PhaseIndicator from "../components/common/PhaseIndicator";
import ElectionSelector from "../components/common/ElectionSelector";
import { useElection } from "../context/ElectionContext";

export default function Results() {
  const { selectedElectionId } = useElection();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = async () => {
    if (!selectedElectionId) return;
    
    try {
      const res = await api.get(`/elections/${selectedElectionId}/votes/results`);
      setData(res.data);
      setLastUpdated(new Date());
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (selectedElectionId) {
      setLoading(true);
      load();
    }
  }, [selectedElectionId]);

  useEffect(() => {
    if (!selectedElectionId) return;
    
    // Auto-refresh every 30s during voting phase
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [selectedElectionId]);

  if (!selectedElectionId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">No election selected</p>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  const maxVotes = Math.max(...(data?.results?.map(c => c.voteCount) || [1]), 1);
  const isCompleted = data?.election?.phase === "completed";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <ElectionSelector />
        </div>
        <h1 className="text-3xl font-bold text-primary">Election Results</h1>
        <p className="text-gray-500 text-sm mt-1">{data?.election?.title || 'Election'}</p>
        {data?.election?.phase && (
          <div className="flex justify-center mt-3">
            <PhaseIndicator phase={data.election.phase} />
          </div>
        )}
        {lastUpdated && (
          <p className="text-xs text-gray-400 mt-2">
            Last updated: {lastUpdated.toLocaleTimeString("en-IN")}
            {data?.election?.phase === "voting" && " · Auto-refreshes every 30s"}
          </p>
        )}
      </div>      {/* Winner banner — only in Completed phase */}
      {isCompleted && data?.winner && (
        <div className="card bg-gradient-to-r from-primary to-blue-800 text-white text-center mb-8">
          <p className="text-sm opacity-75 mb-1">🏆 Election Winner</p>
          <p className="text-3xl font-bold">{data.winner.name}</p>
          <p className="text-blue-200 text-lg">{data.winner.partyName}</p>
          <p className="text-4xl font-bold mt-3">{data.winner.voteCount}
            <span className="text-lg font-normal opacity-75 ml-2">votes</span>
          </p>
        </div>
      )}

      {/* Total votes */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary">{data?.totalVotes ?? 0}</div>
          <div className="text-sm text-gray-500 mt-1">Total Votes Cast</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary">{data?.results?.length ?? 0}</div>
          <div className="text-sm text-gray-500 mt-1">Candidates</div>
        </div>
      </div>

      {/* Results */}
      <div className="card space-y-5">
        <h2 className="font-semibold text-primary">
          {isCompleted ? "Final Results" : "Live Vote Count"}
        </h2>

        {data?.results?.length === 0 && (
          <p className="text-gray-400 text-center py-6">No candidates registered yet.</p>
        )}

        {data?.results?.map((c) => {
          const pct = data.totalVotes > 0 ? (c.voteCount / data.totalVotes) * 100 : 0;
          const barWidth = maxVotes > 0 ? (c.voteCount / maxVotes) * 100 : 0;
          const isWinner = isCompleted && data.winner?.id === c.id;

          return (
            <div key={c.id} className={`p-4 rounded-lg border-2 transition-colors ${isWinner ? "border-accent bg-orange-50" : "border-gray-100"}`}>
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
                  className={`h-full rounded-full transition-all duration-700 ${isWinner ? "bg-accent" : "bg-primary"}`}
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
        Contract: <span className="font-mono">{data?.election?.contractAddress?.slice(0, 20)}...</span>
      </p>
    </div>
  );
}
