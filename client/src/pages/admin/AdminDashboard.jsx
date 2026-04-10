import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../utils/api";
import PhaseIndicator from "../../components/common/PhaseIndicator";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [changingPhase, setChangingPhase] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [votersRes, electionRes] = await Promise.all([
        api.get("/admin/voters?limit=1"),
        api.get("/admin/election"),
      ]);
      setStats({
        totalVoters: votersRes.data.total,
        phase: electionRes.data.onChain?.phase,
        totalCandidates: electionRes.data.onChain?.totalCandidates,
        totalVotes: electionRes.data.onChain?.totalVotes,
        totalRegisteredOnChain: electionRes.data.onChain?.totalVoters,
        electionTitle: electionRes.data.onChain?.title,
      });
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const quickChangePhase = async (newPhase) => {
    if (!window.confirm(`Change election phase to "${newPhase}"? This calls the smart contract.`)) return;
    setChangingPhase(true);
    try {
      const res = await api.post("/admin/election/phase", { phase: newPhase });
      toast.success(`Phase changed to ${res.data.newPhase}`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Phase change failed"); }
    finally { setChangingPhase(false); }
  };

  const cards = [
    { label: "Total Voters (DB)", value: stats?.totalVoters ?? "—", icon: "👥", link: "/admin/voters", color: "border-l-primary" },
    { label: "Registered On-Chain", value: stats?.totalRegisteredOnChain ?? "—", icon: "⛓️", link: "/admin/voters", color: "border-l-accent" },
    { label: "Candidates", value: stats?.totalCandidates ?? "—", icon: "🏛️", link: "/admin/candidates", color: "border-l-success" },
    { label: "Votes Cast", value: stats?.totalVotes ?? "—", icon: "✅", link: "/admin/results", color: "border-l-blue-500" },
  ];

  const quickLinks = [
    { label: "Manage Voters", desc: "Approve, register on-chain, upload face", icon: "👥", to: "/admin/voters" },
    { label: "Manage Candidates", desc: "Add or remove election candidates", icon: "🏛️", to: "/admin/candidates" },
    { label: "Face Registration", desc: "Upload voter face photos", icon: "📷", to: "/admin/face" },
    { label: "Election Control", desc: "Change election phase", icon: "⚙️", to: "/admin/election" },
    { label: "View Results", desc: "Live vote counts from blockchain", icon: "📊", to: "/admin/results" },
  ];

  const phaseNext = { Registration: "voting", Voting: "completed" };
  const phaseNextLabel = { Registration: "▶ Start Voting", Voting: "⏹ Close Election" };
  const phaseNextColor = { Registration: "bg-accent hover:bg-orange-700", Voting: "bg-danger hover:bg-red-800" };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
          {stats?.electionTitle && (
            <p className="text-gray-500 text-sm mt-0.5">📋 {stats.electionTitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {stats?.phase && <PhaseIndicator phase={stats.phase} />}
          {stats?.phase && phaseNext[stats.phase] && (
            <button
              onClick={() => quickChangePhase(phaseNext[stats.phase])}
              disabled={changingPhase}
              className={`text-white text-xs px-3 py-1.5 rounded font-medium transition-colors disabled:opacity-50 ${phaseNextColor[stats.phase]}`}>
              {changingPhase ? "Processing..." : phaseNextLabel[stats.phase]}
            </button>
          )}
          <button onClick={load} className="text-xs text-primary hover:underline">↻ Refresh</button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <Link key={c.label} to={c.link}
            className={`card border-l-4 ${c.color} hover:shadow-md transition-shadow`}>
            <div className="text-2xl mb-1">{c.icon}</div>
            <div className="text-2xl font-bold text-dark">{c.value}</div>
            <div className="text-xs text-gray-500 mt-1">{c.label}</div>
          </Link>
        ))}
      </div>

      {/* Phase workflow guide */}
      <div className="card mb-6 bg-blue-50 border border-blue-200">
        <h2 className="font-semibold text-primary mb-3">Election Workflow</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          {[
            { phase: "Registration", steps: ["Add candidates", "Register voters", "Upload faces", "Register wallets on-chain"], link: "/admin/candidates" },
            { phase: "Voting", steps: ["Voters cast votes", "Monitor live results", "All 3-factor auth required"], link: "/admin/results" },
            { phase: "Completed", steps: ["Results are final", "Winner declared", "Export CSV"], link: "/admin/results" },
          ].map(w => (
            <Link key={w.phase} to={w.link}
              className={`rounded p-3 border transition-colors ${stats?.phase === w.phase ? "bg-white border-primary shadow-sm" : "bg-white/60 border-blue-100 hover:bg-white"}`}>
              <p className={`font-semibold mb-2 ${stats?.phase === w.phase ? "text-primary" : "text-gray-500"}`}>
                {stats?.phase === w.phase ? "▶ " : ""}{w.phase}
              </p>
              <ul className="space-y-1">
                {w.steps.map(s => (
                  <li key={s} className="text-xs text-gray-600 flex items-start gap-1">
                    <span className="text-gray-400 mt-0.5">•</span> {s}
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <h2 className="text-lg font-semibold text-primary mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map((l) => (
          <Link key={l.label} to={l.to}
            className="card hover:shadow-md hover:border-primary transition-all flex items-start gap-4">
            <span className="text-3xl">{l.icon}</span>
            <div>
              <p className="font-semibold text-dark">{l.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{l.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
