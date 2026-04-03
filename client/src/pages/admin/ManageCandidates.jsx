import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import api from "../../utils/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function ManageCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [phase, setPhase] = useState(null);
  const [form, setForm] = useState({ name: "", partyName: "", partySymbol: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, eRes] = await Promise.all([
        api.get("/admin/candidates"),
        api.get("/admin/election"),
      ]);
      setCandidates(cRes.data.candidates);
      setPhase(eRes.data.onChain?.phase);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addCandidate = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post("/admin/candidates", form);
      toast.success(`${form.name} added to election`);
      setForm({ name: "", partyName: "", partySymbol: "" });
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to add"); }
    finally { setAdding(false); }
  };

  const deleteCandidate = async (id, name) => {
    if (!window.confirm(`Remove ${name} from election?`)) return;
    try {
      await api.delete(`/admin/candidates/${id}`);
      toast.success("Candidate removed");
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const isRegistration = phase === "Registration";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-primary mb-6">Candidate Management</h1>

      {!isRegistration && (
        <div className="bg-yellow-50 border border-yellow-300 rounded p-3 mb-6 text-sm text-yellow-800">
          ⚠️ Candidates can only be added or removed during the <strong>Registration</strong> phase.
          Current phase: <strong>{phase}</strong>
        </div>
      )}

      {/* Add form */}
      {isRegistration && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-primary mb-4">Add New Candidate</h2>
          <form onSubmit={addCandidate} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Candidate Name *</label>
              <input className="input" placeholder="Full name" required
                value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div>
              <label className="label">Party Name *</label>
              <input className="input" placeholder="Political party" required
                value={form.partyName} onChange={e => setForm({...form, partyName: e.target.value})} />
            </div>
            <div>
              <label className="label">Party Symbol URL</label>
              <input className="input" placeholder="https://..." 
                value={form.partySymbol} onChange={e => setForm({...form, partySymbol: e.target.value})} />
            </div>
            <div className="sm:col-span-3">
              <button type="submit" disabled={adding} className="btn-primary">
                {adding ? "Adding to blockchain..." : "Add Candidate"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Candidates list */}
      {loading ? <LoadingSpinner /> : (
        <div className="card p-0">
          <table className="w-full text-sm">
            <thead className="bg-primary text-white">
              <tr>
                {["#", "Name", "Party", "On-Chain ID", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {candidates.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No candidates added yet</td></tr>
              )}
              {candidates.map((c, i) => (
                <tr key={c._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.partyName}</td>
                  <td className="px-4 py-3">
                    <span className="badge-info">ID: {c.onChainId}</span>
                  </td>
                  <td className="px-4 py-3">
                    {isRegistration && (
                      <button onClick={() => deleteCandidate(c._id, c.name)}
                        className="text-xs bg-danger text-white px-3 py-1 rounded hover:bg-red-800">
                        Remove
                      </button>
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
