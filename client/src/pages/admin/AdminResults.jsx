import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../../utils/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function AdminResults() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get("/admin/results");
      setData(res.data);
    } catch { toast.error("Failed to load results"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  const exportCSV = () => {
    if (!data?.candidates) return;
    const rows = [["Candidate", "Party", "Votes", "Percentage"]];
    data.candidates.forEach(c => {
      const pct = data.totalVotes > 0 ? ((c.voteCount / data.totalVotes) * 100).toFixed(1) : "0.0";
      rows.push([c.name, c.partyName, c.voteCount, pct + "%"]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "evoteface_results.csv"; a.click();
  };

  if (loading) return <LoadingSpinner />;

  const maxVotes = Math.max(...(data?.candidates?.map(c => c.voteCount) || [1]), 1);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Election Results</h1>
        <div className="flex gap-2">
          <button onClick={load} className="btn-outline text-sm px-4 py-2">↻ Refresh</button>
          <button onClick={exportCSV} className="btn-primary text-sm px-4 py-2">⬇ Export CSV</button>
        </div>
      </div>

      {/* Winner banner */}
      {data?.winner && (
        <div className="card bg-gradient-to-r from-primary to-blue-700 text-white mb-6 text-center">
          <p className="text-sm opacity-80 mb-1">🏆 Winner</p>
          <p className="text-2xl font-bold">{data.winner.name}</p>
          <p className="text-blue-200">{data.winner.partyName}</p>
          <p className="text-3xl font-bold mt-2">{data.winner.voteCount} votes</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary">{data?.totalVotes ?? 0}</div>
          <div className="text-sm text-gray-500 mt-1">Total Votes Cast</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary">{data?.candidates?.length ?? 0}</div>
          <div className="text-sm text-gray-500 mt-1">Candidates</div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-primary">Vote Distribution</h2>
        {data?.candidates?.length === 0 && (
          <p className="text-gray-400 text-center py-4">No candidates found</p>
        )}
        {data?.candidates?.map((c) => {
          const pct = data.totalVotes > 0 ? (c.voteCount / data.totalVotes) * 100 : 0;
          const barWidth = maxVotes > 0 ? (c.voteCount / maxVotes) * 100 : 0;
          const isWinner = data.winner?.id === c.id;
          return (
            <div key={c.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium flex items-center gap-1">
                  {isWinner && <span>🏆</span>} {c.name}
                  <span className="text-gray-400 font-normal">— {c.partyName}</span>
                </span>
                <span className="font-semibold">{c.voteCount} ({pct.toFixed(1)}%)</span>
              </div>
              <div className="h-6 bg-gray-100 rounded overflow-hidden">
                <div
                  className={`h-full rounded transition-all duration-500 ${isWinner ? "bg-accent" : "bg-primary"}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">
        Data sourced live from Ethereum Sepolia blockchain · Auto-refreshes every 30s
      </p>
    </div>
  );
}
