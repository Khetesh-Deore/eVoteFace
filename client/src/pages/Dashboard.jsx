import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import api from "../utils/api";
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
  const [walletError, setWalletError] = useState(null);

  const loadStatus = useCallback(async () => {
    try {
      const [statusRes, resultsRes] = await Promise.all([
        api.get("/voters/status"),
        api.get("/votes/results"),
      ]);
      setStatus(statusRes.data);
      setPhase(resultsRes.data.phase);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  // Save wallet address manually — called by button only
  const saveWallet = async () => {
    if (!address) return;
    setSavingWallet(true);
    setWalletError(null);
    try {
      await api.post("/voters/wallet", { walletAddress: address });
      setUser(prev => ({ ...prev, walletAddress: address.toLowerCase() }));
      toast.success("Wallet address saved successfully!");
      // Refresh status to check on-chain registration
      await loadStatus();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save wallet";
      setWalletError(msg);
      toast.error(msg);
    } finally {
      setSavingWallet(false);
    }
  };

  const refreshStatus = async () => {
    setLoading(true);
    await loadStatus();
    toast.info("Status refreshed");
  };

  const walletSaved = user?.walletAddress &&
    address &&
    user.walletAddress.toLowerCase() === address.toLowerCase();

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
            {user?.walletAddress && (
              <div className="flex justify-between border-b border-gray-50 pb-1">
                <span className="text-gray-500">Wallet</span>
                <span className="font-mono text-xs text-gray-600">
                  {user.walletAddress.slice(0, 10)}...{user.walletAddress.slice(-6)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Voting Status */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-primary flex items-center gap-2">
              <span>📋</span> Voting Status
            </h2>
            <button onClick={refreshStatus} className="text-xs text-primary hover:underline">
              ↻ Refresh
            </button>
          </div>
          <div className="space-y-3">
            <StatusRow label="Account Approved" ok={status?.isVerified} />
            <StatusRow label="Face Registered" ok={status?.faceRegistered} />
            <StatusRow label="Wallet Saved" ok={!!user?.walletAddress} />
            <StatusRow label="Registered On-Chain" ok={status?.isRegisteredOnChain} />
            <StatusRow label="MetaMask Connected" ok={isConnected && isCorrectNetwork} />
            {status?.hasVoted ? (
              <div className="mt-3 bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
                ✅ You have successfully cast your vote.
                {status.votedAt && (
                  <span className="block text-xs mt-1 text-green-600">
                    Voted on: {new Date(status.votedAt).toLocaleString("en-IN")}
                  </span>
                )}
              </div>
            ) : (
              <div className={`mt-3 rounded p-3 text-sm ${canVote
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-gray-50 border border-gray-200 text-gray-600"}`}>
                {canVote ? "✅ You are eligible to vote!" : "⏳ Complete all steps above to vote."}
              </div>
            )}
          </div>
        </div>

        {/* MetaMask Wallet */}
        <div className="card">
          <h2 className="font-semibold text-primary mb-4 flex items-center gap-2">
            <span>🦊</span> MetaMask Wallet
          </h2>
          <div className="space-y-3">
            {/* Connect button */}
            <MetaMaskConnect />

            {/* Wallet status after connecting */}
            {isConnected && isCorrectNetwork && (
              <div className="space-y-2">
                {/* Show current connected address */}
                <div className="bg-gray-50 rounded p-2 text-xs font-mono text-gray-600 break-all">
                  {address}
                </div>

                {/* Case 1: Wallet already saved and matches */}
                {walletSaved && (
                  <div className="space-y-1">
                    <p className="badge-success text-xs">✓ Wallet address saved to your account</p>
                    {status?.isRegisteredOnChain
                      ? <p className="badge-success text-xs">✓ Registered on Ethereum blockchain</p>
                      : <p className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded p-2">
                          ⏳ Awaiting admin to register your wallet on-chain.
                          Contact the election administrator.
                        </p>
                    }
                  </div>
                )}

                {/* Case 2: Wallet not saved yet */}
                {!user?.walletAddress && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600">
                      Save this wallet address to your voter account so the admin can register you on-chain.
                    </p>
                    {address?.toLowerCase() === import.meta.env.VITE_ADMIN_WALLET?.toLowerCase() && (
                      <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700">
                        ⚠️ This is the admin/deployer wallet. You cannot vote with it.
                        Switch to a different MetaMask account (Account 2, 3, etc.)
                      </div>
                    )}
                    <button
                      onClick={saveWallet}
                      disabled={savingWallet}
                      className="btn-primary w-full text-sm py-2">
                      {savingWallet ? "Saving..." : "💾 Save Wallet Address"}
                    </button>
                    {walletError && (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
                        ⚠️ {walletError}
                      </p>
                    )}
                  </div>
                )}

                {/* Case 3: Different wallet connected than saved */}
                {user?.walletAddress && !walletSaved && (
                  <div className="space-y-2">
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800">
                      ⚠️ Connected wallet is different from your saved wallet.
                      <br />
                      Saved: <span className="font-mono">{user.walletAddress.slice(0, 10)}...</span>
                    </div>
                    <button
                      onClick={saveWallet}
                      disabled={savingWallet}
                      className="btn-outline w-full text-sm py-2">
                      {savingWallet ? "Updating..." : "🔄 Update Wallet Address"}
                    </button>
                    {walletError && (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
                        ⚠️ {walletError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Not connected */}
            {!isConnected && (
              <p className="text-xs text-gray-500">
                Connect MetaMask to save your wallet address and participate in voting.
              </p>
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
            {/* Show what's missing */}
            {!canVote && phase === "Voting" && !status?.hasVoted && (
              <div className="text-xs text-gray-500 space-y-1 mb-3">
                {!status?.isVerified && <p>• Account not approved by admin</p>}
                {!status?.faceRegistered && <p>• Face not registered — contact admin</p>}
                {!user?.walletAddress && <p>• Wallet address not saved</p>}
                {!status?.isRegisteredOnChain && user?.walletAddress && <p>• Not registered on-chain — contact admin</p>}
                {(!isConnected || !isCorrectNetwork) && <p>• MetaMask not connected to Sepolia</p>}
              </div>
            )}
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
