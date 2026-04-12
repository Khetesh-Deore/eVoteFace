import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useElection } from "../../context/ElectionContext";
import api from "../../utils/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function ManageCandidates() {
  const { selectedElectionId, currentElectionDetails } = useElection();
  const [candidates, setCandidates] = useState([]);
  const [onChainCandidates, setOnChainCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", partyName: "", partySymbol: "" });

  const load = useCallback(async () => {
    if (!selectedElectionId) {
      toast.error("No election selected");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [cRes, rRes] = await Promise.all([
        api.get(`/elections/${selectedElectionId}/admin/candidates`),
        api.get(`/elections/${selectedElectionId}/votes/results`).catch(() => ({ data: { results: [] } })),
      ]);
      
      setCandidates(cRes.data.candidates || []);
      setOnChainCandidates(rRes.data.results || []);
    } catch (error) {
      console.error("Failed to load candidates:", error);
      toast.error(error.response?.data?.message || "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  }, [selectedElectionId]);

  useEffect(() => {
    load();
  }, [load]);

  const addCandidate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.partyName.trim()) {
      toast.error("Name and party name are required");
      return;
    }
    
    if (!selectedElectionId) {
      toast.error("No election selected");
      return;
    }

    setAdding(true);
    try {
      await api.post(`/elections/${selectedElectionId}/admin/candidates`, form);
      toast.success(`${form.name} added to election blockchain`);
      setForm({ name: "", partyName: "", partySymbol: "" });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add candidate");
    } finally {
      setAdding(false);
    }
  };

  const deleteCandidate = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from election? This calls the smart contract.`)) return;
    
    if (!selectedElectionId) {
      toast.error("No election selected");
      return;
    }

    try {
      await api.delete(`/elections/${selectedElectionId}/admin/candidates/${id}`);
      toast.success(`${name} removed`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove candidate");
    }
  };

  const phase = currentElectionDetails?.phase;
  const isRegistration = phase === "registration";

  // Merge DB candidates with on-chain vote counts
  const merged = candidates.map(c => ({
    ...c,
    voteCount: onChainCandidates.find(oc => oc.id === c.onChainId)?.voteCount ?? 0,
  }));

  if (!selectedElectionId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Please select an election first</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Candidate Management</h1>
        <button onClick={load} className="text-sm text-primary hover:underline">↻ Refresh</button>
      </div>

      {/* Phase warning */}
      {phase && !isRegistration && (
        <div className="bg-yellow-50 border border-yellow-300 rounded p-3 mb-6 text-sm text-yellow-800">
          ⚠️ Candidates can only be added/removed during <strong>Registration</strong> phase.
          Current phase: <strong className="capitalize">{phase}</strong>
        </div>
      )}

      {/* Add form — only in Registration */}
      {isRegistration && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-primary mb-4">Add New Candidate</h2>
          <form onSubmit={addCandidate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Candidate Full Name *</label>
                <input className="input" placeholder="e.g. Rahul Gandhi" required
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div>
                <label className="label">Political Party *</label>
                <input className="input" placeholder="e.g. Indian National Congress" required
                  value={form.partyName} onChange={e => setForm({...form, partyName: e.target.value})} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Party Symbol / Logo URL (optional)</label>
                <input className="input" placeholder="https://example.com/logo.png"
                  value={form.partySymbol} onChange={e => setForm({...form, partySymbol: e.target.value})} />
                <p className="text-xs text-gray-400 mt-1">Paste a direct image URL. Leave blank to use initials.</p>
              </div>
            </div>
            {/* Preview */}
            {form.partySymbol && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border">
                <img src={form.partySymbol} alt="preview" className="w-12 h-12 object-contain rounded border"
                  onError={e => { e.target.style.display = "none"; }} />
                <div>
                  <p className="font-semibold text-sm">{form.name || "Candidate Name"}</p>
                  <p className="text-xs text-gray-500">{form.partyName || "Party Name"}</p>
                </div>
              </div>
            )}
            <button type="submit" disabled={adding} className="btn-primary">
              {adding ? "⏳ Adding to blockchain (15-30s)..." : "➕ Add Candidate to Election"}
            </button>
          </form>
        </div>
      )}

      {/* Candidates list */}
      {loading ? <LoadingSpinner /> : (
        <div className="card p-0">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-primary">
              Registered Candidates ({merged.length})
            </h2>
            {phase === "voting" || phase === "completed" ? (
              <span className="text-xs text-gray-500">Live vote counts shown</span>
            ) : null}
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                {["Logo", "Name", "Party", "Chain ID", "Votes", "Action"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {merged.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    <p className="text-2xl mb-2">🏛️</p>
                    <p>No candidates added yet.</p>
                    {isRegistration && <p className="text-xs mt-1">Use the form above to add candidates.</p>}
                  </td>
                </tr>
              )}
              {merged.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {c.partySymbol?.startsWith("http") ? (
                      <img src={c.partySymbol} alt={c.partyName}
                        className="w-10 h-10 object-contain rounded border bg-white p-1"
                        onError={e => { e.target.outerHTML = `<div class="w-10 h-10 bg-primary rounded flex items-center justify-center text-white font-bold">${c.name[0]}</div>`; }} />
                    ) : (
                      <div className="w-10 h-10 bg-primary rounded flex items-center justify-center text-white font-bold">
                        {c.name[0]}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.partyName}</td>
                  <td className="px-4 py-3">
                    <span className="badge-info">#{c.onChainId}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-primary">
                    {phase === "registration" ? "—" : c.voteCount}
                  </td>
                  <td className="px-4 py-3">
                    {isRegistration ? (
                      <button onClick={() => deleteCandidate(c._id, c.name)}
                        className="text-xs bg-danger text-white px-3 py-1 rounded hover:bg-red-800">
                        Remove
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Locked</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
