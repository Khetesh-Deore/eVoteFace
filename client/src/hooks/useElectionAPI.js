import { useElection } from '../context/ElectionContext';
import api from '../utils/api';

/**
 * Custom hook for election-scoped API calls
 * Automatically uses selected election ID
 */
export function useElectionAPI() {
  const { selectedElectionId, getContractAddress } = useElection();

  const getElectionPath = (path) => {
    if (!selectedElectionId) {
      throw new Error('No election selected');
    }
    return `/elections/${selectedElectionId}${path}`;
  };

  return {
    // Admin routes
    admin: {
      getCandidates: () => api.get(getElectionPath('/admin/candidates')),
      addCandidate: (data) => api.post(getElectionPath('/admin/candidates'), data),
      deleteCandidate: (id) => api.delete(getElectionPath(`/admin/candidates/${id}`)),
      
      getVoters: (params) => api.get(getElectionPath('/admin/voters'), { params }),
      approveVoter: (id) => api.post(getElectionPath(`/admin/voters/${id}/approve`)),
      registerVoterOnChain: (id, data) => api.post(getElectionPath(`/admin/voters/${id}/register-onchain`), data),
      uploadFace: (id, formData) => api.post(getElectionPath(`/admin/voters/${id}/face`), formData),
      
      changePhase: (phase) => api.post(getElectionPath('/admin/phase'), { phase }),
      getDashboard: () => api.get(getElectionPath('/admin')),
    },

    // Voter routes
    voter: {
      getStatus: () => api.get(getElectionPath('/voters/status')),
      saveWallet: (walletAddress) => api.post(getElectionPath('/voters/wallet'), { walletAddress }),
      getProfile: () => api.get(getElectionPath('/voters/profile')),
    },

    // Voting routes
    votes: {
      getCandidates: () => api.get(getElectionPath('/votes/candidates')),
      recordVote: (data) => api.post(getElectionPath('/votes/record'), data),
      getResults: () => api.get(getElectionPath('/votes/results')),
    },

    // Utility
    selectedElectionId,
    getElectionPath,
    getContractAddress,
  };
}
