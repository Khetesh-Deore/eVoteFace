import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import api from "../../utils/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function ManageVoters() {
  const [voters, setVoters] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/voters?page=${page}&limit=15&search=${search}`);
      setVoters(res.data.voters);
      setTotal(res.data.total);
    } catch { toast.error("Failed to load voters"); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const approve = async (id) => {
    setActionId(id);
    try {
      await api.post(`/admin/voters/${id}/approve`);
      toast.success("Voter approved");
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setActionId(null); }
  };

  const registerOnChain = async (id, wallet) => {
    if (!wallet) { toast.error("Voter has no wallet address saved"); return; }
    setActionId(id + "_chain");
    try {
      const res = await api.post(`/admin/voters/${id}/register-onchain`, { walletAddress: wallet });
      toast.success(`Registered on-chain! TX: ${res.data.txHash.slice(0, 12)}...`);
      load();
    } catch (err) {
      const msg = err.response?.data?.message || "Blockchain error";
      if (msg.includes("Owner cannot be a voter")) {
        toast.error("❌ This wallet is the contract owner (admin wallet). The voter must use a DIFFERENT MetaMask wallet address.");
      } else {
        toast.error(msg);
      }
    }
    finally { setActionId(null); }
  };
  const deleteVoter = async (id) => {
    if (!window.confirm("Remove this voter from database?")) return;
    try {
      await api.delete(`/admin/voters/${id}`);
      toast.success("Voter removed");
      load();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Voter Management</h1>
        <div className="flex items-center gap-3">
          <button onClick={load} className="text-sm text-primary hover:underline">↻ Refresh</button>
          <span className="badge-info">{total} total voters</span>
        </div>
      </div>
      <div className="card mb-4">
        <input className="input max-w-sm" placeholder="Search by name, voter ID or email..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>
      {loading ? <LoadingSpinner /> : (
        <>
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-primary text-white">
                <tr>
                  {["Name","Voter ID","Email","Wallet","Face","Verified","Voted","Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {voters.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-8 text-gray-400">No voters found</td></tr>
                )}
                {voters.map((v) => (
                  <tr key={v._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{v.fullName}</td>
                    <td className="px-4 py-3 text-gray-600">{v.voterID}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{v.email}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {v.walletAddress ? `${v.walletAddress.slice(0,8)}...` : <span className="text-red-400">None</span>}
                    </td>
                    <td className="px-4 py-3">
                      {v.faceImagePath ? <span className="badge-success">✓ Registered</span> : <span className="badge-danger">✗ Missing</span>}
                    </td>
                    <td className="px-4 py-3">
                      {v.isVerified ? <span className="badge-success">Approved</span> : <span className="badge-warning">Pending</span>}
                    </td>
                    <td className="px-4 py-3">
                      {v.hasVoted ? <span className="badge-success">Voted</span> : <span className="badge-info">Not yet</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {!v.isVerified && (
                          <button onClick={() => approve(v._id)} disabled={actionId === v._id}
                            className="text-xs bg-success text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50">
                            {actionId === v._id ? "..." : "Approve"}
                          </button>
                        )}
                        {v.isVerified && v.walletAddress && (
                          <button onClick={() => registerOnChain(v._id, v.walletAddress)}
                            disabled={actionId === v._id + "_chain"}
                            className="text-xs bg-primary text-white px-2 py-1 rounded hover:bg-blue-900 disabled:opacity-50">
                            {actionId === v._id + "_chain" ? "..." : "On-Chain"}
                          </button>
                        )}
                        <button onClick={() => deleteVoter(v._id)}
                          className="text-xs bg-danger text-white px-2 py-1 rounded hover:bg-red-800">
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <span>Page {page} of {Math.ceil(total / 15) || 1}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100">Prev</button>
              <button onClick={() => setPage(p => p+1)} disabled={page >= Math.ceil(total/15)}
                className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100">Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
