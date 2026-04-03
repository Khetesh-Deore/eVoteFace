import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";import api from "../utils/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import PhaseIndicator from "../components/common/PhaseIndicator";
import MetaMaskConnect from "../components/voter/MetaMaskConnect";

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const { address, isConnected, isCorrectNetwork } = useWallet();
  const [status, setStatus] = useState(null);
  const [phase, setPhase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingWallet, setSavingWallet] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [statusRes, resultsRes] = await Promise.all([
          api.get("/voters/status"),
          api.get("/votes/results"),
        ]);
        setStatus(statusRes.data);
        setPhase(resultsRes.data.phase);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // Auto-save wallet address when MetaMask connects (only if changed)
  useEffect(() => {
    if (!address || !user) return;
    if (user.walletAddress && user.walletAddress.toLowerCase() === address.toLowerCase()) return;
    const save = async () => {
      setSavingWallet(true);
      try {
        await api.post("/voters/wallet", { walletAddress: address });
        setUser(prev => ({ ...prev, walletAddress: address.toLowerCase() }));
      } catch { /* wallet may already be registered */ }
      finally { setSavingWallet(false); }
    };
    save();
  }, [address, user?.walletAddress]);

  const canVote = phase === "Voting" && isConnected && isCorrectNetwork &&
    status?.isVerified && !status?.hasVoted && status?.isRegisteredOnChain;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Welcome, {user?.fullName}</h1>
          <p className="text-gray-500 text-sm mt-1">Voter ID: {user?.voterID}</p>
        </div>
        {phase && <PhaseIndicator phase={phase} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Voter Profile */}
        <div className="card">
          <h2 className="font-semibold text-primary mb-4 flex items-center gap-2">
            <span>👤</span> Your Profile
          </h2>
          <div className="space-y-2 text-sm">
            {[
              ["Full Name", user?.fullName],
              ["Voter ID", user?.voterID],
              ["Email", user?.email],
              ["City", user?.city],
              ["State", user?.state],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-gray-50 pb-1">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium text-right">{v || "—"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Voting Status */}
        <div className="card">
          <h2 className="font-semibold text-primary mb-4 flex items-center gap-2">
            <span>📋</span> Voting Status
          </h2>
          <div className="space-y-3">
            <StatusRow label="Account Approved" ok={status?.isVerified} />
            <StatusRow label="Face Registered" ok={status?.faceRegistered} />
            <StatusRow label="Registered On-Chain" ok={status?.isRegisteredOnChain} />
            <StatusRow label="MetaMask Connected" ok={isConnected && isCorrectNetwork} />
            {status?.hasVoted ? (
              <div className="mt-3 bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
                ✅ You have successfully cast your vote.
                {status.votedAt && <span className="block text-xs mt-1 text-green-600">
                  Voted on: {new Date(status.votedAt).toLocaleString("en-IN")}
                </span>}
              </div>
            ) : (
              <div className={`mt-3 rounded p-3 text-sm ${canVote ? "bg-green-50 border border-green-200 text-green-800" : "bg-gray-50 border border-gray-200 text-gray-600"}`}>
                {canVote ? "✅ You are eligible to vote!" : "⏳ Complete all steps above to vote."}
              </div>
            )}
          </div>
        </div>

        {/* MetaMask */}
        <div className="card">
          <h2 className="font-semibold text-primary mb-4 flex items-center gap-2">
            <span>🦊</span> MetaMask Wallet
          </h2>
          <div className="space-y-3">
            <MetaMaskConnect />
            {savingWallet && <p className="text-xs text-blue-500">Saving wallet address...</p>}
            {isConnected && isCorrectNetwork && (
              status?.isRegisteredOnChain
                ? <p className="badge-success mt-2">✓ Registered on blockchain</p>
                : <p className="text-xs text-yellow-600 mt-2">⏳ Awaiting admin to register on-chain</p>
            )}
          </div>
        </div>

        {/* Cast Vote CTA */}
        <div className="card flex flex-col justify-between">
          <div>
            <h2 className="font-semibold text-primary mb-2 flex items-center gap-2">
              <span>🗳️</span> Cast Your Vote
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {phase === "Voting"
                ? "Voting is currently open. Complete all verification steps to cast your vote."
                : phase === "Registration"
                ? "Voting has not started yet. Please wait for the election to begin."
                : "The election has ended. Thank you for participating."}
            </p>
          </div>
          {status?.hasVoted ? (
            <div className="btn-primary w-full text-center opacity-50 cursor-not-allowed">
              Vote Already Cast ✓
            </div>
          ) : (
            <Link to="/vote"
              className={`btn-primary w-full text-center ${!canVote ? "opacity-50 pointer-events-none" : ""}`}>
              {canVote ? "Cast Your Vote →" : "Not Eligible Yet"}
            </Link>
          )}
          <Link to="/results" className="text-center text-sm text-primary hover:underline mt-3 block">
            View Live Results →
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, ok }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      {ok
        ? <span className="badge-success">✓ Done</span>
        : <span className="badge-warning">Pending</span>}
    </div>
  );
}
