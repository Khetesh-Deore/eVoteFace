import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import api from "../../utils/api";
import PhaseIndicator from "../../components/common/PhaseIndicator";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function ElectionControl() {
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/election");
      setElection(res.data);
    } catch { toast.error("Failed to load election info"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const changePhase = async (newPhase) => {
    if (!window.confirm(`Change phase to "${newPhase}"?\n\nThis calls the smart contract and CANNOT be undone.`)) return;
    setChanging(true);
    try {
      const res = await api.post("/admin/election/phase", { phase: newPhase });
      toast.success(`Phase changed to ${res.data.newPhase}. TX: ${res.data.txHash.slice(0, 16)}...`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Phase change failed"); }
    finally { setChanging(false); }
  };

  const phase = election?.onChain?.phase;
  const stats = election?.onChain;

  const phaseConfig = {
    Registration: {
      desc: "Add candidates and register voter wallets on-chain. Voting has not started.",
      color: "bg-blue-50 border-blue-200 text-blue-800",
      next: "voting", nextLabel: "▶ Start Voting Phase", nextColor: "btn-accent",
      warning: "Ensure all candidates are added and voter wallets are registered on-chain.",
      checklist: [
        { label: `At least 2 candidates (${stats?.totalCandidates ?? 0} added)`, ok: (stats?.totalCandidates ?? 0) >= 2 },
        { label: `At least 1 voter on-chain (${stats?.totalVoters ?? 0} registered)`, ok: (stats?.totalVoters ?? 0) >= 1 },
      ],
    },
    Voting: {
      desc: "Voting is open. Registered voters can cast votes using 3-factor authentication.",
      color: "bg-orange-50 border-orange-200 text-orange-800",
      next: "completed", nextLabel: "⏹ Close Election", nextColor: "btn-danger",
      warning: "Closing the election is PERMANENT. No more votes can be cast after this.",
      checklist: [
        { label: `Votes cast: ${stats?.totalVotes ?? 0}`, ok: true },
      ],
    },
    Completed: {
      desc: "Election is closed. Results are final and publicly verifiable on the blockchain.",
      color: "bg-green-50 border-green-200 text-green-800",
      next: null,
    },
  };

  const info = phase ? phaseConfig[phase] : null;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Election Control</h1>
        <button onClick={load} className="text-sm text-primary hover:underline">↻ Refresh</button>
      </div>

      {/* Phase banner */}
      <div className={`rounded-lg border p-4 mb-6 ${info?.color || "bg-gray-50 border-gray-200"}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">Current Phase</span>
          {phase && <PhaseIndicator phase={phase} />}
        </div>
        {info && <p className="text-sm">{info.desc}</p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Candidates", value: stats?.totalCandidates, href: "/admin/candidates" },
          { label: "Voters On-Chain", value: stats?.totalVoters, href: "/admin/voters" },
          { label: "Votes Cast", value: stats?.totalVotes, href: "/admin/results" },
        ].map(s => (
          <a key={s.label} href={s.href}
            className="card text-center hover:border-primary hover:shadow-sm transition-all cursor-pointer">
            <div className="text-2xl font-bold text-primary">{s.value ?? "—"}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </a>
        ))}
      </div>

      {/* Phase transition card */}
      {info?.next && (
        <div className="card border-l-4 border-l-accent space-y-4">
          <h2 className="font-semibold text-dark">
            {info.next === "voting" ? "Start Voting Phase" : "Close Election"}
          </h2>

          {/* Checklist */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Checklist</p>
            {info.checklist.map(item => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${item.ok ? "bg-success text-white" : "bg-yellow-400 text-white"}`}>
                  {item.ok ? "✓" : "!"}
                </span>
                <span className={item.ok ? "text-gray-700" : "text-yellow-700"}>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
            ⚠️ {info.warning}
          </div>

          <button onClick={() => changePhase(info.next)} disabled={changing}
            className={`${info.nextColor} w-full`}>
            {changing ? "⏳ Processing blockchain transaction..." : info.nextLabel}
          </button>
          <p className="text-xs text-gray-400 text-center">
            Calls changePhase() on the Sepolia smart contract
          </p>
        </div>
      )}

      {/* Completed */}
      {phase === "Completed" && (
        <div className="card bg-green-50 border border-green-200 text-center space-y-3">
          <p className="text-4xl">🏆</p>
          <p className="font-bold text-success text-lg">Election Completed</p>
          <p className="text-sm text-gray-600">Results are final and permanently on the blockchain.</p>
          <a href="/admin/results" className="btn-primary inline-block">View Final Results →</a>
        </div>
      )}

      {/* Contract info */}
      <div className="card mt-6">
        <h2 className="font-semibold text-primary mb-3 text-sm">Contract Info</h2>
        <div className="space-y-1 text-xs text-gray-500">
          <p>Title: <span className="text-dark font-medium">{stats?.title || "eVoteFace General Election 2026"}</span></p>
          <p>Network: <span className="text-dark font-medium">Ethereum Sepolia Testnet</span></p>
          <p className="font-mono break-all">
            Contract: {import.meta?.env?.VITE_CONTRACT_ADDRESS || "Not configured"}
          </p>
        </div>
      </div>
    </div>
  );
}
