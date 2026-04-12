import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const ElectionContext = createContext();

export function ElectionProvider({ children }) {
  const [elections, setElections] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState(null);
  const [selectedElection, setSelectedElection] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchElections();
  }, []);

  useEffect(() => {
    if (selectedElectionId) {
      fetchElectionDetails(selectedElectionId);
    }
  }, [selectedElectionId]);

  const fetchElections = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/elections');
      const electionsData = res.data.elections || res.data;
      setElections(electionsData);
      
      // Auto-select first active election
      const activeElection = electionsData.find(e => e.isActive);
      if (activeElection && !selectedElectionId) {
        setSelectedElectionId(activeElection._id);
      } else if (electionsData.length > 0 && !selectedElectionId) {
        setSelectedElectionId(electionsData[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch elections', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchElectionDetails = async (electionId) => {
    try {
      const res = await axios.get(`/api/elections/${electionId}`);
      setSelectedElection(res.data.election);
    } catch (error) {
      console.error('Failed to fetch election details', error);
    }
  };

  const selectElection = (electionId) => {
    setSelectedElectionId(electionId);
  };

  const refreshElections = () => {
    fetchElections();
  };

  return (
    <ElectionContext.Provider
      value={{
        elections,
        selectedElectionId,
        selectedElection,
        loading,
        selectElection,
        setSelectedElectionId,
        fetchElections: refreshElections,
      }}
    >
      {children}
    </ElectionContext.Provider>
  );
}

export const useElection = () => {
  const context = useContext(ElectionContext);
  if (!context) {
    throw new Error('useElection must be used within ElectionProvider');
  }
  return context;
};
