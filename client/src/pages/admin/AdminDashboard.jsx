import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useElection } from "../../context/ElectionContext";
import api from "../../utils/api";
import PhaseIndicator from "../../components/common/PhaseIndicator";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ElectionSelector from "../../components/common/ElectionSelector";
import { Users, FileText, TrendingUp, AlertCircle, Copy, ExternalLink, Download } from "lucide-react";

export default function AdminDashboard() {
  const { selectedElectionId, currentElectionDetails, getElectionPhase, getContractAddress } = useElection();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [changingPhase, setChangingPhase] = useState(false);

  const load = useCallback(async () => {
    if (!selectedElectionId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/elections/${selectedElectionId}/admin`);
      setStats(res.data.stats);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [selectedElectionId]);

  useEffect(() => {
    load();
  }, [load]);

  const quickChangePhase = async (newPhase) => {
    const phaseWarnings = {
      voting: "Starting voting will lock candidate registration. Voters can start casting votes.",
      completed: "Completing the election will finalize results and prevent further voting.",
    };

    const warning = phaseWarnings[newPhase];
    if (warning && !window.confirm(`${warning}\n\nAre you sure you want to proceed?`)) {
      return;
    }

    setChangingPhase(true);
    try {
      await api.post(`/elections/${selectedElectionId}/admin/phase`, { phase: newPhase });
      toast.success(`Phase changed to ${newPhase}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Phase change failed");
    } finally {
      setChangingPhase(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const exportData = (type) => {
    toast.info(`Export ${type} feature coming soon`);
  };

  if (!selectedElectionId) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No election selected</p>
          <p className="text-sm text-gray-400 mb-6">Please select an election to manage</p>
          <ElectionSelector />
        </div>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  const phase = getElectionPhase();
  const contractAddress = getContractAddress();
  const phaseNext = { registration: "voting", voting: "completed" };
  const phaseNextLabel = { registration: "▶ Start Voting", voting: "⏹ Close Election" };
  const phaseNextColor = {
    registration: "bg-accent hover:bg-orange-700",
    voting: "bg-danger hover:bg-red-800",
  };

  const cards = [
    {
      label: "Total Voters",
      value: stats?.offChain?.totalUsers ?? "—",
      icon: <Users className="w-6 h-6" />,
      link: "/admin/voters",
      color: "border-l-primary",
      description: "Registered in database",
    },
    {
      label: "Verified Voters",
      value: stats?.offChain?.verifiedUsers ?? "—",
      icon: <Users className="w-6 h-6" />,
      link: "/admin/voters",
      color: "border-l-green-500",
      description: "Approved by admin",
    },
    {
      label: "On-Chain Voters",
      value: stats?.onChain?.numVoters ?? "—",
      icon: <Users className="w-6 h-6" />,
      link: "/admin/voters",
      color: "border-l-blue-500",
      description: "Registered on blockchain",
    },
    {
      label: "Candidates",
      value: stats?.offChain?.totalCandidates ?? "—",
      icon: <FileText className="w-6 h-6" />,
      link: "/admin/candidates",
      color: "border-l-purple-500",
      description: "Total candidates",
    },
    {
      label: "Votes Cast",
      value: stats?.onChain?.numVotes ?? "—",
      icon: <TrendingUp className="w-6 h-6" />,
      link: "/admin/results",
      color: "border-l-orange-500",
      description: "On blockchain",
    },
    {
      label: "Voted",
      value: stats?.offChain?.votedUsers ?? "—",
      icon: <TrendingUp className="w-6 h-6" />,
      link: "/admin/results",
      color: "border-l-green-600",
      description: "Recorded in database",
    },
  ];

  const quickLinks = [
    { label: "Manage Voters", desc: "Approve, register on-chain, upload face", icon: "👥", to: "/admin/voters" },
    { label: "Manage Candidates", desc: "Add or remove election candidates", icon: "🏛️", to: "/admin/candidates" },
    { label: "Face Registration", desc: "Upload voter face photos", icon: "📷", to: "/admin/face" },
    { label: "Election Control", desc: "Change election phase", icon: "⚙️", to: "/admin/election" },
    { label: "View Results", desc: "Live vote counts from blockchain", icon: "📊", to: "/admin/results" },
  ];

  const turnout =
    stats?.onChain?.numVoters > 0
      ? ((stats?.onChain?.numVotes / stats?.onChain?.numVoters) * 100).toFixed(1)
      : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
          {currentElectionDetails?.title && (
            <p className="text-gray-500 text-sm mt-0.5">📋 {currentElectionDetails.title}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ElectionSelector />
          {phase && <PhaseIndicator phase={phase} />}
          {phase && phaseNext[phase] && (
            <button
              onClick={() => quickChangePhase(phaseNext[phase])}
              disabled={changingPhase}
              className={`text-white text-xs px-3 py-1.5 rounded font-medium transition-colors disabled:opacity-50 ${phaseNextColor[phase]}`}
            >
              {changingPhase ? "Processing..." : phaseNextLabel[phase]}
            </button>
          )}
          <button onClick={load} className="text-xs text-primary hover:underline">
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Election Info Card */}
      <div className="card mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900">{currentElectionDetails?.title}</h3>
            {currentElectionDetails?.description && (
              <p className="text-sm text-gray-600 mt-1">{currentElectionDetails.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exportData("voters")}
              className="p-2 hover:bg-white rounded-lg transition-colors"
              title="Export voters"
            >
              <Download className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-blue-200">
          <div>
            <label className="text-xs text-gray-500">Contract Address</label>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs bg-white px-2 py-1 rounded flex-1 overflow-x-auto">
                {contractAddress?.slice(0, 20)}...{contractAddress?.slice(-10)}
              </code>
              <button
                onClick={() => copyToClipboard(contractAddress)}
                className="p-1 hover:bg-white rounded"
                title="Copy address"
              >
                <Copy className="w-3 h-3 text-gray-600" />
              </button>
              <a
                href={`https://sepolia.etherscan.io/address/${contractAddress}`}
                target="_blank"
                rel="noreferrer"
                className="p-1 hover:bg-white rounded"
                title="View on Etherscan"
              >
                <ExternalLink className="w-3 h-3 text-gray-600" />
              </a>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500">Created</label>
            <p className="text-sm font-medium mt-1">
              {new Date(currentElectionDetails?.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => (
          <Link key={c.label} to={c.link} className={`card border-l-4 ${c.color} hover:shadow-md transition-shadow`}>
            <div className="flex items-start justify-between mb-2">
              <div className="text-gray-400">{c.icon}</div>
              <div className="text-2xl font-bold text-dark">{c.value}</div>
            </div>
            <div className="text-sm font-medium text-gray-700">{c.label}</div>
            <div className="text-xs text-gray-500 mt-1">{c.description}</div>
          </Link>
        ))}
      </div>

      {/* Turnout Card */}
      {stats?.onChain?.numVoters > 0 && (
        <div className="card mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Voter Turnout</h3>
              <p className="text-sm text-gray-600 mt-1">
                {stats?.onChain?.numVotes} out of {stats?.onChain?.numVoters} registered voters have voted
              </p>
            </div>
            <div className="text-4xl font-bold text-green-600">{turnout}%</div>
          </div>
          <div className="mt-3 h-2 bg-white rounded-full overflow-hidden">
            <div className="h-full bg-green-600 transition-all duration-500" style={{ width: `${turnout}%` }} />
          </div>
        </div>
      )}

      {/* Data Sync Status */}
      <div className="card mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Data Synchronization</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">Off-Chain (Database)</span>
              <span className="text-xs text-blue-600">MongoDB</span>
            </div>
            <div className="space-y-1 text-xs text-blue-800">
              <div className="flex justify-between">
                <span>Total Users:</span>
                <span className="font-semibold">{stats?.offChain?.totalUsers || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Verified:</span>
                <span className="font-semibold">{stats?.offChain?.verifiedUsers || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Voted (DB):</span>
                <span className="font-semibold">{stats?.offChain?.votedUsers || 0}</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-900">On-Chain (Blockchain)</span>
              <span className="text-xs text-purple-600">Ethereum</span>
            </div>
            <div className="space-y-1 text-xs text-purple-800">
              <div className="flex justify-between">
                <span>Registered Voters:</span>
                <span className="font-semibold">{stats?.onChain?.numVoters || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Candidates:</span>
                <span className="font-semibold">{stats?.onChain?.numCandidates || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Votes Cast:</span>
                <span className="font-semibold">{stats?.onChain?.numVotes || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phase workflow guide */}
      <div className="card mb-6 bg-blue-50 border border-blue-200">
        <h2 className="font-semibold text-primary mb-3">Election Workflow</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          {[
            {
              phase: "registration",
              steps: ["Add candidates", "Register voters", "Upload faces", "Register wallets on-chain"],
              link: "/admin/candidates",
            },
            {
              phase: "voting",
              steps: ["Voters cast votes", "Monitor live results", "All 3-factor auth required"],
              link: "/admin/results",
            },
            {
              phase: "completed",
              steps: ["Results are final", "Winner declared", "Export data"],
              link: "/admin/results",
            },
          ].map((w) => (
            <Link
              key={w.phase}
              to={w.link}
              className={`rounded p-3 border transition-colors ${
                phase === w.phase
                  ? "bg-white border-primary shadow-sm"
                  : "bg-white/60 border-blue-100 hover:bg-white"
              }`}
            >
              <p
                className={`font-semibold mb-2 capitalize ${
                  phase === w.phase ? "text-primary" : "text-gray-500"
                }`}
              >
                {phase === w.phase ? "▶ " : ""}
                {w.phase}
              </p>
              <ul className="space-y-1">
                {w.steps.map((s) => (
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
          <Link
            key={l.label}
            to={l.to}
            className="card hover:shadow-md hover:border-primary transition-all flex items-start gap-4"
          >
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
