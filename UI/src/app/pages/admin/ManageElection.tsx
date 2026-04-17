import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import PhaseIndicator from '../../components/PhaseIndicator';
import LoadingSpinner from '../../components/LoadingSpinner';
import axiosInstance from '../../lib/axios';
import { toast } from 'react-toastify';

export default function ManageElection() {
  const { id } = useParams();
  const [election, setElection] = useState<any>(null);
  const [voters, setVoters] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'candidates' | 'voters' | 'results'>('overview');

  useEffect(() => {
    loadElectionData();
  }, [id]);

  const loadElectionData = async () => {
    if (!id) return;
    
    try {
      const [electionRes, candidatesRes, votersRes] = await Promise.all([
        axiosInstance.get(`/elections/${id}`),
        axiosInstance.get(`/admin/elections/${id}/candidates`),
        axiosInstance.get(`/admin/elections/${id}/voters`),
      ]);
      
      setElection(electionRes.data);
      setCandidates(candidatesRes.data);
      setVoters(votersRes.data);
    } catch (error) {
      toast.error('Failed to load election data');
    } finally {
      setLoading(false);
    }
  };

  const changePhase = async (newPhase: string) => {
    const confirmed = window.confirm(`Are you sure you want to change the phase to ${newPhase}?`);
    if (!confirmed) return;

    try {
      await axiosInstance.post(`/admin/elections/${id}/phase`, { phase: newPhase });
      toast.success('Phase changed successfully!');
      loadElectionData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change phase');
    }
  };

  const approveVoter = async (userId: string) => {
    try {
      await axiosInstance.post(`/admin/elections/${id}/voters/${userId}/approve`);
      toast.success('Voter approved!');
      loadElectionData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve voter');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!election) return <div>Election not found</div>;

  return (
    <div className="min-h-screen bg-[#f5f5f5] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          to="/admin/elections"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#e94560] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Elections
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#1a1a2e]">{election.title}</h1>
              <p className="text-gray-600 mt-2">{election.description}</p>
            </div>
            <PhaseIndicator phase={election.phase} />
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Contract Address:</p>
            <p className="font-mono text-sm text-gray-900 break-all">{election.contractAddress}</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex border-b border-gray-200">
            {['overview', 'candidates', 'voters', 'results'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 px-6 py-4 font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-[#e94560] border-b-2 border-[#e94560] bg-red-50'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-8">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-[#1a1a2e] mb-4">Phase Control</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => changePhase('registration')}
                      disabled={election.phase === 'registration'}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                    >
                      Set to Registration
                    </button>
                    <button
                      onClick={() => changePhase('voting')}
                      disabled={election.phase === 'voting'}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                    >
                      Start Voting
                    </button>
                    <button
                      onClick={() => changePhase('completed')}
                      disabled={election.phase === 'completed'}
                      className="px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                    >
                      Complete Election
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="p-6 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total Candidates</p>
                    <p className="text-3xl font-bold text-[#1a1a2e]">{candidates.length}</p>
                  </div>
                  <div className="p-6 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Registered Voters</p>
                    <p className="text-3xl font-bold text-[#1a1a2e]">{voters.length}</p>
                  </div>
                  <div className="p-6 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Votes Cast</p>
                    <p className="text-3xl font-bold text-[#1a1a2e]">{voters.filter(v => v.electionData?.hasVoted).length}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'candidates' && (
              <div>
                <h3 className="text-xl font-bold text-[#1a1a2e] mb-4">Candidates ({candidates.length})</h3>
                {candidates.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No candidates added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {candidates.map((candidate) => (
                      <div key={candidate._id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                        {candidate.partySymbol ? (
                          <img src={candidate.partySymbol} alt={candidate.partyName} className="w-16 h-16 rounded-full object-cover" />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-2xl font-bold text-gray-500">{candidate.name[0]}</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">{candidate.name}</h4>
                          <p className="text-sm text-gray-600">{candidate.partyName}</p>
                          <p className="text-xs text-gray-500">On-chain ID: {candidate.onChainId}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'voters' && (
              <div>
                <h3 className="text-xl font-bold text-[#1a1a2e] mb-4">Voters ({voters.length})</h3>
                {voters.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No voters registered yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Voted</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {voters.map((voter) => (
                          <tr key={voter._id} className="border-t border-gray-100">
                            <td className="py-3 px-4 text-gray-900">{voter.fullName}</td>
                            <td className="py-3 px-4 text-gray-600">{voter.email}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                voter.electionData?.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {voter.electionData?.isVerified ? 'Approved' : 'Pending'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {voter.electionData?.hasVoted ? '✓ Yes' : '✗ No'}
                            </td>
                            <td className="py-3 px-4">
                              {!voter.electionData?.isVerified && (
                                <button
                                  onClick={() => approveVoter(voter._id)}
                                  className="text-green-600 hover:underline font-medium"
                                >
                                  Approve
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
            )}

            {activeTab === 'results' && (
              <div>
                <h3 className="text-xl font-bold text-[#1a1a2e] mb-4">Election Results</h3>
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">View full results page</p>
                  <Link
                    to={`/elections/${id}/results`}
                    className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    View Results
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
