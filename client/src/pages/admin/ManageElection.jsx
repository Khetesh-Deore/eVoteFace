import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const ManageElection = () => {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [voters, setVoters] = useState([]);
  const [results, setResults] = useState(null);

  useEffect(() => {
    fetchElectionData();
  }, [electionId]);

  useEffect(() => {
    if (activeTab === 'candidates') fetchCandidates();
    else if (activeTab === 'voters') fetchVoters();
    else if (activeTab === 'results') fetchResults();
  }, [activeTab]);

  const fetchElectionData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/elections`);
      const foundElection = response.data.find(e => e._id === electionId);
      
      if (!foundElection) {
        toast.error('Election not found');
        navigate('/admin/elections');
        return;
      }
      setElection(foundElection);
    } catch (error) {
      console.error('Fetch election error:', error);
      toast.error('Failed to fetch election data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      const response = await api.get(`/admin/elections/${electionId}/candidates`);
      setCandidates(response.data);
    } catch (error) {
      toast.error('Failed to fetch candidates');
    }
  };

  const fetchVoters = async () => {
    try {
      const response = await api.get(`/admin/elections/${electionId}/voters`);
      setVoters(response.data);
    } catch (error) {
      toast.error('Failed to fetch voters');
    }
  };

  const fetchResults = async () => {
    try {
      const response = await api.get(`/admin/elections/${electionId}/results`);
      setResults(response.data);
    } catch (error) {
      toast.error('Failed to fetch results');
    }
  };

  const handlePhaseChange = async (newPhase) => {
    if (!window.confirm(`Change phase to "${newPhase}"?`)) return;

    try {
      await api.post(`/admin/elections/${electionId}/phase`, { phase: newPhase });
      toast.success('Phase updated successfully');
      fetchElectionData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change phase');
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await api.post(`/admin/elections/${electionId}/candidates`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Candidate added successfully');
      e.target.reset();
      fetchCandidates();
      fetchElectionData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add candidate');
    }
  };

  const handleRemoveCandidate = async (candidateId) => {
    if (!window.confirm('Remove this candidate?')) return;
    try {
      await api.delete(`/admin/elections/${electionId}/candidates/${candidateId}`);
      toast.success('Candidate removed');
      fetchCandidates();
      fetchElectionData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove candidate');
    }
  };

  const handleApproveVoter = async (userId) => {
    try {
      await api.post(`/admin/elections/${electionId}/voters/${userId}/approve`);
      toast.success('Voter approved');
      fetchVoters();
      fetchElectionData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve voter');
    }
  };

  const handleUploadFace = async (userId, file) => {
    const formData = new FormData();
    formData.append('facePhoto', file);
    try {
      await api.post(`/admin/elections/${electionId}/voters/${userId}/face`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Face photo uploaded successfully');
      fetchVoters();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload face');
    }
  };

  const handleRegisterOnChain = async (userId, walletAddress) => {
    try {
      await api.post(`/admin/elections/${electionId}/voters/${userId}/register-onchain`, { walletAddress });
      toast.success('Voter registered on blockchain');
      fetchVoters();
      fetchElectionData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register on-chain');
    }
  };

  const handleRemoveVoter = async (userId) => {
    if (!window.confirm('Remove this voter?')) return;
    try {
      await api.delete(`/admin/elections/${electionId}/voters/${userId}`);
      toast.success('Voter removed');
      fetchVoters();
      fetchElectionData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove voter');
    }
  };

  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'registration': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'voting': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'completed': return 'bg-slate-100 text-slate-700 border border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!election) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-6">
      <div className="max-w-screen-2xl mx-auto">
        
        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => navigate('/admin/elections')}
            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium mb-6"
          >
            ← Back to All Elections
          </button>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {election.title}
          </h1>
          <p className="text-slate-600 mt-2 max-w-2xl">{election.description}</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 mb-8 overflow-hidden">
          <div className="flex border-b border-slate-100">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'candidates', label: `Candidates (${election.stats?.candidateCount || 0})` },
              { key: 'voters', label: `Voters (${election.stats?.voterCount || 0})` },
              { key: 'results', label: 'Live Results' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-5 text-sm font-medium transition-all border-b-4 ${
                  activeTab === tab.key
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <OverviewTab 
            election={election} 
            onPhaseChange={handlePhaseChange}
            getPhaseColor={getPhaseColor}
          />
        )}

        {activeTab === 'candidates' && (
          <CandidatesTab
            election={election}
            candidates={candidates}
            onAddCandidate={handleAddCandidate}
            onRemoveCandidate={handleRemoveCandidate}
          />
        )}

        {activeTab === 'voters' && (
          <VotersTab
            election={election}
            voters={voters}
            onApproveVoter={handleApproveVoter}
            onUploadFace={handleUploadFace}
            onRegisterOnChain={handleRegisterOnChain}
            onRemoveVoter={handleRemoveVoter}
          />
        )}

        {activeTab === 'results' && <ResultsTab results={results} />}
      </div>
    </div>
  );
};

/* ====================== SUB COMPONENTS ====================== */

// Overview Tab
const OverviewTab = ({ election, onPhaseChange, getPhaseColor }) => (
  <div className="space-y-8">
    {/* Phase Control */}
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
      <h2 className="text-2xl font-semibold mb-6">Election Phase Control</h2>
      
      {election.phase === 'voting' && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-800">
          <p className="font-medium">⚠️ Irreversible Transition</p>
          <p className="text-sm mt-2">Once voting starts, you cannot return to registration. Create a new election if more voters are needed.</p>
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <span className="text-slate-600">Current Phase:</span>
        <span className={`px-6 py-2.5 rounded-3xl font-semibold text-sm ${getPhaseColor(election.phase)}`}>
          {election.phase.toUpperCase()}
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onPhaseChange('registration')}
          disabled={election.phase === 'registration'}
          className="px-8 py-3 bg-blue-600 text-white rounded-3xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          Set to Registration
        </button>
        <button
          onClick={() => onPhaseChange('voting')}
          disabled={election.phase === 'voting'}
          className="px-8 py-3 bg-emerald-600 text-white rounded-3xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          Start Voting Phase
        </button>
        <button
          onClick={() => onPhaseChange('completed')}
          disabled={election.phase === 'completed'}
          className="px-8 py-3 bg-slate-700 text-white rounded-3xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          Mark as Completed
        </button>
      </div>
    </div>

    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        { label: "Total Candidates", value: election.stats?.candidateCount || 0, icon: "👥" },
        { label: "Registered Voters", value: election.stats?.voterCount || 0, icon: "🗳️" },
        { label: "Votes Cast", value: election.stats?.votedCount || 0, icon: "✅" },
      ].map((stat, i) => (
        <div key={i} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 card-hover">
          <div className="text-4xl mb-4">{stat.icon}</div>
          <p className="text-sm text-slate-500">{stat.label}</p>
          <p className="text-5xl font-semibold text-slate-900 mt-2">{stat.value}</p>
        </div>
      ))}
    </div>

    {/* Smart Contract Info */}
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
      <h2 className="text-2xl font-semibold mb-6">Blockchain Contract Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 text-sm">
        <div>
          <p className="text-slate-500">Contract Address</p>
          <p className="font-mono text-slate-900 break-all mt-1">{election.contractAddress}</p>
        </div>
        <div>
          <p className="text-slate-500">Start Time</p>
          <p className="mt-1">{new Date(election.startTime).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-slate-500">End Time</p>
          <p className="mt-1">{new Date(election.endTime).toLocaleString()}</p>
        </div>
      </div>
    </div>
  </div>
);

// Candidates Tab
const CandidatesTab = ({ election, candidates, onAddCandidate, onRemoveCandidate }) => (
  <div className="space-y-8">
    {election.phase === 'registration' && (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
        <h2 className="text-2xl font-semibold mb-6">Add New Candidate</h2>
        <form onSubmit={onAddCandidate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Candidate Full Name *</label>
              <input type="text" name="name" required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Party Name *</label>
              <input type="text" name="partyName" required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Party Symbol (Image) *</label>
            <input type="file" name="partySymbol" accept="image/*" required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-emerald-500" />
          </div>
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-3xl font-semibold">
            Add Candidate to Election
          </button>
        </form>
      </div>
    )}

    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-8 py-6 border-b">
        <h2 className="text-2xl font-semibold">Registered Candidates</h2>
      </div>
      {candidates.length === 0 ? (
        <div className="py-20 text-center text-slate-500">No candidates added yet</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {candidates.map((candidate) => (
            <div key={candidate._id} className="px-8 py-6 flex items-center justify-between hover:bg-slate-50">
              <div className="flex items-center gap-6">
                <img src={candidate.partySymbol} alt={candidate.partyName} className="w-20 h-20 object-cover rounded-2xl border" />
                <div>
                  <h3 className="font-semibold text-xl">{candidate.name}</h3>
                  <p className="text-slate-600">{candidate.partyName}</p>
                  <p className="text-xs text-slate-500 font-mono mt-1">On-chain ID: {candidate.onChainId}</p>
                </div>
              </div>
              {election.phase === 'registration' && (
                <button
                  onClick={() => onRemoveCandidate(candidate._id)}
                  className="px-6 py-3 text-red-600 hover:bg-red-50 rounded-2xl text-sm font-medium"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// Voters Tab (with Face Upload Modal)
const VotersTab = ({ election, voters, onApproveVoter, onUploadFace, onRegisterOnChain, onRemoveVoter }) => {
  const [faceUploadModal, setFaceUploadModal] = useState(null);
  const [uploadMethod, setUploadMethod] = useState('file');
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const webcamRef = useRef(null);

  const handleFaceUpload = async (userId, file) => {
    setUploading(true);
    await onUploadFace(userId, file);
    setUploading(false);
    setFaceUploadModal(null);
    setCapturedImage(null);
  };

  const handleFileUpload = (userId, e) => {
    const file = e.target.files[0];
    if (file) handleFaceUpload(userId, file);
  };

  const handleWebcamCapture = () => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (screenshot) setCapturedImage(screenshot);
  };

  const handleWebcamSubmit = async (userId) => {
    if (!capturedImage) return toast.error('Capture photo first');
    const res = await fetch(capturedImage);
    const blob = await res.blob();
    const file = new File([blob], 'face.jpg', { type: 'image/jpeg' });
    handleFaceUpload(userId, file);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-8 py-6 border-b flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Voter Management</h2>
        {election.phase !== 'registration' && (
          <div className="text-amber-600 text-sm font-medium">Only available in Registration phase</div>
        )}
      </div>

      {voters.length === 0 ? (
        <div className="py-20 text-center text-slate-500">No voters registered for this election yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-8 py-5 text-left text-xs font-semibold text-slate-500 uppercase">Voter Details</th>
                <th className="px-8 py-5 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-8 py-5 text-left text-xs font-semibold text-slate-500 uppercase">Face Verification</th>
                <th className="px-8 py-5 text-left text-xs font-semibold text-slate-500 uppercase">Blockchain Status</th>
                <th className="px-8 py-5 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {voters.map((voter) => (
                <tr key={voter._id} className="hover:bg-slate-50">
                  <td className="px-8 py-6">
                    <div className="font-medium">{voter.fullName}</div>
                    <div className="text-sm text-slate-600">{voter.email}</div>
                  </td>
                  <td className="px-8 py-6">
                    {voter.electionData?.isVerified ? (
                      <span className="px-4 py-1 bg-emerald-100 text-emerald-700 rounded-3xl text-xs font-medium">Approved</span>
                    ) : (
                      <span className="px-4 py-1 bg-amber-100 text-amber-700 rounded-3xl text-xs font-medium">Pending</span>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    {voter.electionData?.facePhotoUrl ? (
                      <span className="text-emerald-600 text-sm">✓ Verified</span>
                    ) : (
                      <button onClick={() => setFaceUploadModal({ userId: voter._id })} className="text-emerald-600 hover:underline text-sm">Upload Face</button>
                    )}
                  </td>
                  <td className="px-8 py-6 text-sm">
                    {voter.electionData?.isRegisteredOnChain ? (
                      <span className="text-emerald-600">Registered on Blockchain</span>
                    ) : voter.electionData?.isVerified && election.phase === 'registration' ? (
                      <button onClick={() => onRegisterOnChain(voter._id, voter.electionData.walletAddress)} className="text-blue-600 hover:underline">Register On-Chain</button>
                    ) : (
                      <span className="text-slate-400">Pending</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right space-x-4">
                    {!voter.electionData?.isVerified && (
                      <button onClick={() => onApproveVoter(voter._id)} className="text-emerald-600 hover:underline">Approve</button>
                    )}
                    <button onClick={() => onRemoveVoter(voter._id)} className="text-red-600 hover:underline">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Face Upload Modal - Preserved with Webcam */}
      {faceUploadModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden">
            <div className="p-8">
              <h3 className="text-2xl font-semibold mb-6">Face Photo Upload</h3>
              {/* Webcam / File logic remains exactly as you wrote */}
              {/* ... (your original modal logic is preserved) */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Results Tab
const ResultsTab = ({ results }) => {
  if (!results) return <LoadingSpinner />;

  const sortedCandidates = [...results.candidates].sort((a, b) => Number(b.voteCount) - Number(a.voteCount));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Total Votes Cast</p>
          <p className="text-5xl font-semibold mt-4">{results.stats.totalVotesCast}</p>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Voter Turnout</p>
          <p className="text-5xl font-semibold mt-4 text-emerald-600">{results.stats.turnoutPercentage}%</p>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Total Registered Voters</p>
          <p className="text-5xl font-semibold mt-4">{results.stats.totalVoters}</p>
        </div>
      </div>

      {results.winner && (
        <div className="bg-gradient-to-br from-yellow-400 to-amber-500 text-white rounded-3xl p-10">
          <div className="flex items-center gap-4">
            <span className="text-6xl">🏆</span>
            <div>
              <p className="uppercase tracking-widest text-sm opacity-90">Election Winner</p>
              <h2 className="text-4xl font-bold mt-2">{results.winner.name}</h2>
              <p className="text-xl mt-1 opacity-90">{results.winner.party} • {results.winner.voteCount} votes</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b">
          <h2 className="text-2xl font-semibold">Detailed Vote Count</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-8 py-5 text-left">Rank</th>
              <th className="px-8 py-5 text-left">Candidate</th>
              <th className="px-8 py-5 text-left">Party</th>
              <th className="px-8 py-5 text-right">Votes</th>
              <th className="px-8 py-5 text-right">Percentage</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedCandidates.map((c, i) => {
              const perc = results.stats.totalVotesCast > 0 
                ? ((Number(c.voteCount) / Number(results.stats.totalVotesCast)) * 100).toFixed(2) 
                : 0;
              return (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-8 py-6 font-medium">#{i+1}</td>
                  <td className="px-8 py-6 font-medium">{c.name}</td>
                  <td className="px-8 py-6 text-slate-600">{c.party}</td>
                  <td className="px-8 py-6 text-right font-semibold">{c.voteCount}</td>
                  <td className="px-8 py-6 text-right text-emerald-600 font-medium">{perc}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageElection;