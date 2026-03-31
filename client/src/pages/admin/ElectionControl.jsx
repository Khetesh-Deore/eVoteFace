import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../../utils/api";
import PhaseIndicator from "../../components/common/PhaseIndicator";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function ElectionControl() {
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/election");
      setElection(res.data);
    } catch { toast.error("Failed to load election info"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const changePhase = async (newPhase) => {
    const confirm = window.confirm(
      `Change phase to "${newPhase}"?\n\nThis action calls the smart contract and CANNOT be undone.`
    );
    if (!confirm) return;
    setChanging(true);
    try {
      const res = await api.post("/admin/election/phase", { phase: newPhase });
      toast.success(`Phase changed to ${res.data.newPhase}. TX: ${res.data.txHash.slice(0, 16)}...`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Phase change failed"); }
    finally { setChanging(false); }
  };

  const phase = election?.onChain?.phase;

  const phaseInfo = {
    Registration: {
      desc: "Candidates and voters can be registered. Voting has not started.",
      next: "voting", nextLabel: "Start Voting Phase →",
      nextColor: "btn-accent",
      warning: "Make sure all candidates are added and voters are registered on-chain before proceeding.",
    },
    Voting: {
      desc: "Voting is open. Registered voters can cast their votes.",
      next: "completed", nextLabel: "Close Election →",
      nextColor: "btn-danger",
      warning: "Closing the election is permanent. No more votes can be cast after this.",
    },
    Completed: {
      desc: "Election is closed. Results are final and publicly available.",
      next: null, nextLabel: null,
    },
  };

  const info = phase ? phaseInfo[phase] : null;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-primary mb-6">Election Phase Control</h1>

      {/* Current phase */}
      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Current Phase</h2>
        {phase && <PhaseIndicator phase={phase} />}
        {info && <p className="text-sm text-gray-600 mt-3">{info.desc}</p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Candidates", value: election?.onChain?.totalCandidates },
          { label: "Registered Voters", value: election?.onChain?.totalVoters },
          { label: "Votes Cast", value: election?.onChain?.totalVotes },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <div className="text-2xl font-bold text-primary">{s.value ?? "—"}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Phase change */}
      {info?.next && (
        <div className="card border-l-4 border-l-accent">
          <h2 className="font-semibold text-dark mb-2">Next Action</h2>
          {info.warning && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4 text-sm text-yellow-800">
              ⚠️ {info.warning}
            </div>
          )}
          <button onClick={() => changePhase(info.next)} disabled={changing}
            className={`${info.nextColor} w-full`}>
            {changing ? "Processing blockchain transaction..." : info.nextLabel}
          </button>
          <p className="text-xs text-gray-400 mt-2 text-center">
            This will call changePhase() on the Sepolia smart contract
          </p>
        </div>
      )}

      {phase === "Completed" && (
        <div className="card bg-green-50 border border-green-200 text-center">
          <p className="text-2xl mb-2">🏆</p>
          <p className="font-semibold text-success">Election Completed</p>
          <p className="text-sm text-gray-600 mt-1">Results are final and publicly verifiable on the blockchain.</p>
        </div>
      )}
    </div>
  );
}
