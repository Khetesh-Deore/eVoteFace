import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { getWriteContract } from "../utils/contract";
import api from "../utils/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import OTPInput from "../components/voter/OTPInput";
import MetaMaskConnect from "../components/voter/MetaMaskConnect";
import WebcamCapture from "../components/voter/WebcamCapture";

const STEPS = ["Wallet", "Face", "OTP", "Vote"];

export default function VotingPage() {
  const { user, setUser } = useAuth();
  const { signer, address, isConnected, isCorrectNetwork, connectWallet } = useWallet();
  const navigate = useNavigate();

  const [step, setStep] = useState(0); // 0=wallet 1=face 2=otp 3=vote
  const [candidates, setCandidates] = useState([]);
  const [phase, setPhase] = useState(null);
  const [loading, setLoading] = useState(true);

  // Face step
  const [faceLoading, setFaceLoading] = useState(false);
  const [faceResult, setFaceResult] = useState(null);
  const [faceVerifiedToken, setFaceVerifiedToken] = useState(null);

  // OTP step
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [voteAuthToken, setVoteAuthToken] = useState(null);
  const [otpSent, setOtpSent] = useState(false);

  // Vote step
  const [voting, setVoting] = useState(false);
  const [txHash, setTxHash] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/votes/results");
        setCandidates(res.data.candidates);
        setPhase(res.data.phase);
        if (res.data.phase !== "Voting") {
          toast.error("Voting is not currently open");
          navigate("/dashboard");
          return;
        }
        const statusRes = await api.get("/voters/status");
        if (!statusRes.data.isVerified) {
          toast.error("Your account is not approved yet"); navigate("/dashboard"); return;
        }
        if (statusRes.data.hasVoted) {
          toast.info("You have already voted. Redirecting to dashboard...");
          setTimeout(() => navigate("/dashboard"), 1500);
          return;
        }
        if (!statusRes.data.isRegisteredOnChain) {
          toast.error("Your wallet is not registered on-chain. Contact admin.");
          navigate("/dashboard");
          return;
        }
      } catch { navigate("/dashboard"); }
      finally { setLoading(false); }
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Step 0: Wallet verification
  const verifyWallet = async () => {
    if (!isConnected || !isCorrectNetwork) {
      await connectWallet(); return;
    }
    try {
      const statusRes = await api.get("/voters/status");
      if (!statusRes.data.isRegisteredOnChain) {
        toast.error("Your wallet is not registered on-chain. Contact admin."); return;
      }
      if (statusRes.data.hasVoted) {
        toast.error("You have already voted."); navigate("/dashboard"); return;
      }
      toast.success("Wallet verified ✓");
      setStep(1);
    } catch { toast.error("Failed to verify wallet status"); }
  };

  // Step 1: Face verification
  const scanFace = async (screenshot) => {
    if (!screenshot) return;
    setFaceLoading(true);
    try {
      const res = await api.post("/face/verify", { liveImageBase64: screenshot });
      setFaceResult(res.data);
      if (res.data.match) {
        setFaceVerifiedToken(res.data.faceVerifiedToken);
        toast.success(`Face verified ✓ (${Math.round(res.data.confidence * 100)}% confidence)`);
        setStep(2);
      } else {
        toast.error("Face not matched. Ensure good lighting and face the camera directly.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Face verification failed");
    } finally { setFaceLoading(false); }
  };

  // Step 2: Send OTP
  const sendOTP = async () => {
    setOtpSending(true);
    try {
      await api.post("/otp/send", { faceVerifiedToken });
      setOtpSent(true);
      toast.success("OTP sent to your registered email");
    } catch (err) { toast.error(err.response?.data?.message || "Failed to send OTP"); }
    finally { setOtpSending(false); }
  };

  const verifyOTP = async (code) => {
    setOtpVerifying(true);
    try {
      const res = await api.post("/otp/verify", { code });
      setVoteAuthToken(res.data.voteAuthToken);
      toast.success("OTP verified ✓");
      setStep(3);
    } catch (err) { toast.error(err.response?.data?.message || "Invalid OTP"); }
    finally { setOtpVerifying(false); }
  };

  // Step 3: Cast vote
  const castVote = async (candidateId) => {
    if (!signer) { toast.error("MetaMask not connected"); return; }
    if (!window.confirm(`Confirm vote for candidate #${candidateId}? This cannot be undone.`)) return;
    setVoting(true);
    try {
      const contract = getWriteContract(signer);
      const tx = await contract.castVote(candidateId);
      toast.info("Transaction submitted. Waiting for confirmation...");
      const receipt = await tx.wait();
      const hash = receipt.hash;
      setTxHash(hash);

      // Record in backend
      await api.post("/votes/record", { candidateId, txHash: hash, voteAuthToken });
      setUser(prev => ({ ...prev, hasVoted: true }));
      toast.success("🎉 Vote cast successfully! Redirecting to dashboard...");
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => navigate("/dashboard"), 3000);
      setStep(4); // success
    } catch (err) {
      console.error("Vote error:", err);
      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        toast.error("Transaction rejected by user");
      } else if (err.message?.includes("already cast their vote")) {
        toast.error("You have already voted. Redirecting...");
        setTimeout(() => navigate("/dashboard"), 2000);
      } else if (err.reason) {
        toast.error(`Blockchain error: ${err.reason}`);
      } else {
        toast.error(err.response?.data?.message || err.message || "Voting failed");
      }
    } finally { setVoting(false); }
  };

  if (loading) return <LoadingSpinner />;

  // Success screen
  if (step === 4) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-success mb-2">Vote Cast Successfully!</h1>
        <p className="text-gray-600 mb-4">Your vote has been permanently recorded on the Ethereum blockchain.</p>
        {txHash && (
          <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer"
            className="text-sm text-primary hover:underline block mb-6">
            View on Etherscan: {txHash.slice(0, 20)}...
          </a>
        )}
        <p className="text-sm text-gray-500 mb-4">Redirecting to dashboard in 3 seconds...</p>
        <button onClick={() => navigate("/dashboard")} className="btn-primary">Go to Dashboard Now →</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-primary mb-2">Cast Your Vote</h1>
      <p className="text-gray-500 text-sm mb-6">Complete all three verification steps to cast your vote securely.</p>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
              ${i < step ? "bg-success text-white" : i === step ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}>
              {i < step ? "✓" : i + 1}
            </div>
            <span className={`ml-1 text-xs hidden sm:block ${i === step ? "text-primary font-medium" : "text-gray-400"}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`h-0.5 w-8 mx-2 ${i < step ? "bg-success" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      {/* Step 0: Wallet */}
      {step === 0 && (
        <div className="card">
          <h2 className="font-semibold text-lg mb-3">Step 1 — Wallet Verification</h2>
          <p className="text-sm text-gray-600 mb-4">Connect your MetaMask wallet. It must be registered by the admin.</p>
          <MetaMaskConnect className="mb-4" />
          {isConnected && isCorrectNetwork && (
            <button onClick={verifyWallet} className="btn-primary w-full mt-3">Verify Wallet →</button>
          )}
        </div>
      )}

      {/* Step 1: Face */}
      {step === 1 && (
        <div className="card">
          <h2 className="font-semibold text-lg mb-3">Step 2 — Face Verification</h2>
          <p className="text-sm text-gray-600 mb-4">Position your face clearly in the camera.</p>
          <WebcamCapture onCapture={scanFace} loading={faceLoading} />
          {faceResult && !faceResult.match && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700 mt-3">
              ✗ Face not matched (distance: {faceResult.distance?.toFixed(3)}). Try again.
            </div>
          )}
        </div>
      )}

      {/* Step 2: OTP */}
      {step === 2 && (
        <div className="card">
          <h2 className="font-semibold text-lg mb-3">Step 3 — OTP Verification</h2>
          {!otpSent ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                An OTP will be sent to your registered email: <strong>{user?.email?.replace(/(.{1}).*@/, "$1***@")}</strong>
              </p>
              <button onClick={sendOTP} disabled={otpSending} className="btn-primary w-full">
                {otpSending ? "Sending OTP..." : "Send OTP to Email"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Enter the 6-digit OTP sent to your email.</p>
              <OTPInput onComplete={verifyOTP} loading={otpVerifying} />
              <button onClick={sendOTP} disabled={otpSending}
                className="text-sm text-primary hover:underline w-full text-center">
                {otpSending ? "Resending..." : "Resend OTP"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Vote */}
      {step === 3 && (
        <div className="card">
          <h2 className="font-semibold text-lg mb-1">Step 4 — Cast Your Vote</h2>
          <p className="text-sm text-gray-500 mb-5">Select a candidate. MetaMask will ask you to confirm the transaction.</p>
          <div className="space-y-3">
            {candidates.map((c) => (
              <div key={c.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:border-primary hover:bg-blue-50 transition-colors">
                <div className="flex items-center gap-3">
                  {c.partySymbol && c.partySymbol.startsWith("http") ? (
                    <img src={c.partySymbol} alt={c.partyName} className="w-10 h-10 object-contain rounded" />
                  ) : (
                    <div className="w-10 h-10 bg-primary rounded flex items-center justify-center text-white font-bold text-lg">
                      {c.name[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-dark">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.partyName}</p>
                  </div>
                </div>
                <button onClick={() => castVote(c.id)} disabled={voting}
                  className="btn-accent text-sm px-4 py-2">
                  {voting ? "..." : "Vote"}
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">
            Your vote is anonymous and permanently recorded on the Ethereum blockchain.
          </p>
        </div>
      )}
    </div>
  );
}
