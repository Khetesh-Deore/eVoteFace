import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";
import PhaseIndicator from "../../components/common/PhaseIndicator";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
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
        });
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">eVoteFace Election Management Portal</p>
        </div>
        {stats?.phase && <PhaseIndicator phase={stats.phase} />}
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
