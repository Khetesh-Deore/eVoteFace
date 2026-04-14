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
    if (activeTab === 'candidates') {
      fetchCandidates();
    } else if (activeTab === 'voters') {
      fetchVoters();
    } else if (activeTab === 'results') {
      fetchResults();
    }
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
      console.error('Fetch candidates error:', error);
      toast.error('Failed to fetch candidates');
    }
  };

  const fetchVoters = async () => {
    try {
      const response = await api.get(`/admin/elections/${electionId}/voters`);
      setVoters(response.data);
    } catch (error) {
      console.error('Fetch voters error:', error);
      toast.error('Failed to fetch voters');
    }
  };

  const fetchResults = async () => {
    try {
      const response = await api.get(`/admin/elections/${electionId}/results`);
      setResults(response.data);
    } catch (error) {
      console.error('Fetch results error:', error);
      toast.error('Failed to fetch results');
    }
  };

  const handlePhaseChange = async (newPhase) => {
    if (!window.confirm(`Are you sure you want to change phase to ${newPhase}?`)) {
      return;
    }

    try {
      await api.post(`/admin/elections/${electionId}/phase`, { phase: newPhase });
      toast.success('Phase changed successfully');
      fetchElectionData();
    } catch (error) {
      console.error('Change phase error:', error);
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
      console.error('Add candidate error:', error);
      toast.error(error.response?.data?.message || 'Failed to add candidate');
    }
  };

  const handleRemoveCandidate = async (candidateId) => {
    if (!window.confirm('Are you sure you want to remove this candidate?')) {
      return;
    }

    try {
      await api.delete(`/admin/elections/${electionId}/candidates/${candidateId}`);
      toast.success('Candidate removed successfully');
      fetchCandidates();
      fetchElectionData();
    } catch (error) {
      console.error('Remove candidate error:', error);
      toast.error(error.response?.data?.message || 'Failed to remove candidate');
    }
  };

  const handleApproveVoter = async (userId) => {
    try {
      await api.post(`/admin/elections/${electionId}/voters/${userId}/approve`);
      toast.success('Voter approved successfully');
      fetchVoters();
      fetchElectionData();
    } catch (error) {
      console.error('Approve voter error:', error);
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
      console.error('Upload face error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload face photo');
    }
  };

  const handleRegisterOnChain = async (userId, walletAddress) => {
    try {
      await api.post(`/admin/elections/${electionId}/voters/${userId}/register-onchain`, {
        walletAddress
      });
      toast.success('Voter registered on blockchain');
      fetchVoters();
      fetchElectionData();
    } catch (error) {
      console.error('Register on-chain error:', error);
      toast.error(error.response?.data?.message || 'Failed to register on blockchain');
    }
  };

  const handleRemoveVoter = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this voter?')) {
      return;
    }

    try {
      await api.delete(`/admin/elections/${electionId}/voters/${userId}`);
      toast.success('Voter removed successfully');
      fetchVoters();
      fetchElectionData();
    } catch (error) {
      console.error('Remove voter error:', error);
      toast.error(error.response?.data?.message || 'Failed to remove voter');
    }
  };

  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'registration':
        return 'bg-blue-100 text-blue-800';
      case 'voting':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!election) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/elections')}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Elections
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{election.title}</h1>
        <p className="text-gray-600 mt-2">{election.description}</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium transition ${
              activeTab === 'overview'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('candidates')}
            className={`px-6 py-3 font-medium transition ${
              activeTab === 'candidates'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Candidates ({election.stats?.candidateCount || 0})
          </button>
          <button
            onClick={() => setActiveTab('voters')}
            className={`px-6 py-3 font-medium transition ${
              activeTab === 'voters'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Voters ({election.stats?.voterCount || 0})
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-6 py-3 font-medium transition ${
              activeTab === 'results'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Results
          </button>
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

      {activeTab === 'results' && (
        <ResultsTab results={results} />
      )}
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ election, onPhaseChange, getPhaseColor }) => {
  return (
    <div className="space-y-6">
      {/* Phase Control */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Phase Control</h2>
        <div className="flex items-center gap-4">
          <span className="text-gray-700">Current Phase:</span>
          <span className={`px-4 py-2 rounded-full font-medium ${getPhaseColor(election.phase)}`}>
            {election.phase}
          </span>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => onPhaseChange('registration')}
            disabled={election.phase === 'registration'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Set to Registration
          </button>
          <button
            onClick={() => onPhaseChange('voting')}
            disabled={election.phase === 'voting'}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Voting
          </button>
          <button
            onClick={() => onPhaseChange('completed')}
            disabled={election.phase === 'completed'}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Complete Election
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Candidates</p>
          <p className="text-3xl font-bold text-gray-900">{election.stats?.candidateCount || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Registered Voters</p>
          <p className="text-3xl font-bold text-gray-900">{election.stats?.voterCount || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Votes Cast</p>
          <p className="text-3xl font-bold text-gray-900">{election.stats?.votedCount || 0}</p>
        </div>
      </div>

      {/* Contract Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Contract Information</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Contract Address:</span>
            <span className="font-mono text-sm">{election.contractAddress}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Start Time:</span>
            <span>{new Date(election.startTime).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">End Time:</span>
            <span>{new Date(election.endTime).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Candidates Tab Component
const CandidatesTab = ({ election, candidates, onAddCandidate, onRemoveCandidate }) => {
  return (
    <div className="space-y-6">
      {/* Add Candidate Form */}
      {election.phase === 'registration' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Add New Candidate</h2>
          <form onSubmit={onAddCandidate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Candidate Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Party Name *
                </label>
                <input
                  type="text"
                  name="partyName"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Party Symbol *
              </label>
              <input
                type="file"
                name="partySymbol"
                accept="image/*"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Candidate
            </button>
          </form>
        </div>
      )}

      {/* Candidates List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Candidates List</h2>
        </div>
        {candidates.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No candidates added yet
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {candidates.map((candidate) => (
              <div key={candidate._id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={candidate.partySymbol}
                    alt={candidate.partyName}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">{candidate.name}</h3>
                    <p className="text-sm text-gray-600">{candidate.partyName}</p>
                    <p className="text-xs text-gray-500">ID: {candidate.onChainId}</p>
                  </div>
                </div>
                {election.phase === 'registration' && (
                  <button
                    onClick={() => onRemoveCandidate(candidate._id)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
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
};

// Voters Tab Component
const VotersTab = ({ election, voters, onApproveVoter, onUploadFace, onRegisterOnChain, onRemoveVoter }) => {
  const [selectedVoter, setSelectedVoter] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [faceUploadModal, setFaceUploadModal] = useState(null);
  const [uploadMethod, setUploadMethod] = useState('file'); // 'file' or 'webcam'
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
    if (file) {
      handleFaceUpload(userId, file);
    }
  };

  const handleWebcamCapture = () => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (screenshot) {
      setCapturedImage(screenshot);
    }
  };

  const handleWebcamSubmit = async (userId) => {
    if (!capturedImage) {
      toast.error('Please capture an image first');
      return;
    }

    // Convert base64 to file
    const response = await fetch(capturedImage);
    const blob = await response.blob();
    const file = new File([blob], 'face-photo.jpg', { type: 'image/jpeg' });
    
    handleFaceUpload(userId, file);
  };

  const handleRegisterOnChain = (userId) => {
    if (!walletAddress) {
      toast.error('Please enter wallet address');
      return;
    }
    onRegisterOnChain(userId, walletAddress);
    setSelectedVoter(null);
    setWalletAddress('');
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold">Voters Management</h2>
      </div>
      {voters.length === 0 ? (
        <div className="px-6 py-8 text-center text-gray-500">
          No voters registered yet
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Voter</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Face Photo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Blockchain</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {voters.map((voter) => (
                <tr key={voter._id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{voter.fullName}</div>
                    <div className="text-sm text-gray-500">{voter.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    {voter.electionData?.isVerified ? (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Approved</span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {voter.electionData?.facePhotoUrl ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-600">✓ Uploaded</span>
                        <button
                          onClick={() => setFaceUploadModal({ userId: voter._id, photoUrl: voter.electionData.facePhotoUrl })}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setFaceUploadModal({ userId: voter._id, photoUrl: null })}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Upload
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {voter.electionData?.isRegisteredOnChain ? (
                      <span className="text-xs text-green-600">✓ Registered</span>
                    ) : (
                      <button
                        onClick={() => setSelectedVoter(voter._id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Register
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    {!voter.electionData?.isVerified && (
                      <button
                        onClick={() => onApproveVoter(voter._id)}
                        className="text-xs text-green-600 hover:underline"
                      >
                        Approve
                      </button>
                    )}
                    {!voter.electionData?.hasVoted && (
                      <button
                        onClick={() => onRemoveVoter(voter._id)}
                        className="text-xs text-red-600 hover:underline"
                      >
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

      {/* Register On-Chain Modal */}
      {selectedVoter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Register Voter On-Chain</h3>
            <input
              type="text"
              placeholder="Enter wallet address"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedVoter(null);
                  setWalletAddress('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRegisterOnChain(selectedVoter)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Face Upload Modal */}
      {faceUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {faceUploadModal.photoUrl ? 'Face Photo' : 'Upload Face Photo'}
            </h3>

            {faceUploadModal.photoUrl ? (
              // View existing photo
              <div className="space-y-4">
                <img
                  src={faceUploadModal.photoUrl}
                  alt="Voter face"
                  className="w-full max-w-md mx-auto rounded-lg border-2 border-gray-300"
                />
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs text-gray-600 mb-1">Cloudinary URL:</p>
                  <p className="text-xs font-mono break-all">{faceUploadModal.photoUrl}</p>
                </div>
                <button
                  onClick={() => {
                    setFaceUploadModal(null);
                    setCapturedImage(null);
                    setUploadMethod('file');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            ) : (
              // Upload new photo
              <div className="space-y-4">
                {/* Upload Method Tabs */}
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => {
                      setUploadMethod('file');
                      setCapturedImage(null);
                    }}
                    className={`px-4 py-2 font-medium transition ${
                      uploadMethod === 'file'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    File Upload
                  </button>
                  <button
                    onClick={() => {
                      setUploadMethod('webcam');
                      setCapturedImage(null);
                    }}
                    className={`px-4 py-2 font-medium transition ${
                      uploadMethod === 'webcam'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Webcam Capture
                  </button>
                </div>

                {/* File Upload */}
                {uploadMethod === 'file' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select face photo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(faceUploadModal.userId, e)}
                      disabled={uploading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Webcam Capture */}
                {uploadMethod === 'webcam' && (
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700 flex gap-2">
                      <span>💡</span>
                      <span>Face the camera directly · Ensure good lighting · Remove glasses if possible</span>
                    </div>

                    {!capturedImage ? (
                      <div className="relative">
                        <Webcam
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          screenshotQuality={0.9}
                          className="w-full rounded-lg border-2 border-gray-300"
                          videoConstraints={{ facingMode: 'user', width: 640, height: 480 }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-40 h-48 border-2 border-dashed border-white opacity-60 rounded-full" />
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <img
                          src={capturedImage}
                          alt="Captured face"
                          className="w-full rounded-lg border-2 border-blue-600"
                        />
                        <div className="absolute top-2 right-2">
                          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">Captured</span>
                        </div>
                      </div>
                    )}

                    {!capturedImage ? (
                      <button
                        onClick={handleWebcamCapture}
                        disabled={uploading}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        📸 Capture Photo
                      </button>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          onClick={() => setCapturedImage(null)}
                          disabled={uploading}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                          🔄 Retake
                        </button>
                        <button
                          onClick={() => handleWebcamSubmit(faceUploadModal.userId)}
                          disabled={uploading}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {uploading ? 'Uploading...' : '✓ Upload'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Cancel Button */}
                {uploadMethod === 'file' && (
                  <button
                    onClick={() => {
                      setFaceUploadModal(null);
                      setCapturedImage(null);
                      setUploadMethod('file');
                    }}
                    disabled={uploading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Results Tab Component
const ResultsTab = ({ results }) => {
  if (!results) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <LoadingSpinner />
      </div>
    );
  }

  const sortedCandidates = [...results.candidates].sort((a, b) => 
    Number(b.voteCount) - Number(a.voteCount)
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Votes Cast</p>
          <p className="text-3xl font-bold text-gray-900">{results.stats.totalVotesCast}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Voter Turnout</p>
          <p className="text-3xl font-bold text-gray-900">{results.stats.turnoutPercentage}%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Voters</p>
          <p className="text-3xl font-bold text-gray-900">{results.stats.totalVoters}</p>
        </div>
      </div>

      {/* Winner */}
      {results.winner && (
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-400 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900">Winner</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-semibold text-gray-900">{results.winner.name}</p>
              <p className="text-gray-700">{results.winner.party}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-yellow-600">{results.winner.voteCount}</p>
              <p className="text-sm text-gray-600">votes</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Detailed Results</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Party</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Votes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCandidates.map((candidate, index) => {
                const percentage = results.stats.totalVotesCast > 0
                  ? ((Number(candidate.voteCount) / Number(results.stats.totalVotesCast)) * 100).toFixed(2)
                  : 0;

                return (
                  <tr key={candidate.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">#{index + 1}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{candidate.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{candidate.party}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{candidate.voteCount}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{percentage}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageElection;
