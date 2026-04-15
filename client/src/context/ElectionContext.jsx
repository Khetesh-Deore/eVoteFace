import { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const ElectionContext = createContext();

export const useElection = () => {
  const context = useContext(ElectionContext);
  if (!context) {
    throw new Error('useElection must be used within ElectionProvider');
  }
  return context;
};

export const ElectionProvider = ({ children }) => {
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all public elections
  const fetchPublicElections = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/elections');
      setElections(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch elections');
      console.error('Fetch elections error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch voter's registered elections
  const fetchVoterElections = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/voters/elections');
      setElections(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch your elections');
      console.error('Fetch voter elections error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch specific election details
  const fetchElectionById = async (electionId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/elections/${electionId}`);
      setSelectedElection(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch election details');
      console.error('Fetch election error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch election results
  const fetchElectionResults = async (electionId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/votes/results/${electionId}`);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch results');
      console.error('Fetch results error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get voter status for specific election
  const getVoterStatus = async (electionId) => {
    try {
      const response = await api.get(`/voters/elections/${electionId}/status`);
      return response.data;
    } catch (err) {
      console.error('Get voter status error:', err);
      return null;
    }
  };

  // Clear selected election
  const clearSelectedElection = () => {
    setSelectedElection(null);
  };

  // Refresh elections list
  const refreshElections = () => {
    fetchPublicElections();
  };

  const value = {
    elections,
    selectedElection,
    setSelectedElection,
    loading,
    error,
    fetchPublicElections,
    fetchVoterElections,
    fetchElectionById,
    fetchElectionResults,
    getVoterStatus,
    clearSelectedElection,
    refreshElections
  };

  return (
    <ElectionContext.Provider value={value}>
      {children}
    </ElectionContext.Provider>
  );
};

export default ElectionContext;
