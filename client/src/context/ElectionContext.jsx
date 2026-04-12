import { createContext, useState, useEffect, useContext, useCallback, useRef, useMemo } from 'react';
import api from '../utils/api';

const ElectionContext = createContext();

const STORAGE_KEY = 'selectedElectionId';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function ElectionProvider({ children }) {
  // State
  const [allElections, setAllElections] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || null;
  });
  const [currentElectionDetails, setCurrentElectionDetails] = useState(null);
  const [isLoadingElections, setIsLoadingElections] = useState(false);
  const [electionError, setElectionError] = useState(null);
  const [switchCallbacks, setSwitchCallbacks] = useState([]);

  // Cache management
  const electionsCache = useRef({ data: null, timestamp: null });
  const detailsCache = useRef({});
  const fetchInProgress = useRef(false);

  // Sync across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY && e.newValue !== selectedElectionId) {
        setSelectedElectionId(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [selectedElectionId]);

  // Initial load
  useEffect(() => {
    fetchAllElections();
  }, []);

  // Load details when election changes
  useEffect(() => {
    if (selectedElectionId) {
      localStorage.setItem(STORAGE_KEY, selectedElectionId);
      refreshCurrentElection();
      notifySwitchCallbacks(selectedElectionId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setCurrentElectionDetails(null);
    }
  }, [selectedElectionId]);

  // Fetch all elections with caching
  const fetchAllElections = useCallback(async (forceRefresh = false) => {
    // Check cache
    const now = Date.now();
    if (!forceRefresh && electionsCache.current.data && 
        (now - electionsCache.current.timestamp) < CACHE_DURATION) {
      setAllElections(electionsCache.current.data);
      autoSelectElection(electionsCache.current.data);
      return;
    }

    // Prevent duplicate requests
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;

    try {
      setIsLoadingElections(true);
      setElectionError(null);
      
      const res = await api.get('/elections');
      
      // Handle different response formats
      let electionsData = [];
      if (Array.isArray(res.data)) {
        electionsData = res.data;
      } else if (res.data.elections && Array.isArray(res.data.elections)) {
        electionsData = res.data.elections;
      } else if (res.data.data && Array.isArray(res.data.data)) {
        electionsData = res.data.data;
      } else {
        console.error('Unexpected elections response format:', res.data);
        electionsData = [];
      }
      
      // Update cache
      electionsCache.current = {
        data: electionsData,
        timestamp: now,
      };
      
      setAllElections(electionsData);
      autoSelectElection(electionsData);
    } catch (error) {
      console.error('Failed to fetch elections:', error);
      setElectionError(error.response?.data?.message || 'Failed to load elections');
      
      // Use cached data as fallback
      if (electionsCache.current.data) {
        setAllElections(electionsCache.current.data);
      } else {
        setAllElections([]);
      }
    } finally {
      setIsLoadingElections(false);
      fetchInProgress.current = false;
    }
  }, []);

  // Auto-select election logic
  const autoSelectElection = useCallback((electionsData) => {
    // Ensure electionsData is an array
    if (!Array.isArray(electionsData) || electionsData.length === 0) {
      return;
    }
    
    if (!selectedElectionId || !electionsData.find(e => e._id === selectedElectionId)) {
      const activeElection = electionsData.find(e => e.isActive && e.phase !== 'completed');
      if (activeElection) {
        setSelectedElectionId(activeElection._id);
      } else if (electionsData.length > 0) {
        setSelectedElectionId(electionsData[0]._id);
      }
    }
  }, [selectedElectionId]);

  // Refresh current election details
  const refreshCurrentElection = useCallback(async () => {
    if (!selectedElectionId) return;

    try {
      const res = await api.get(`/elections/${selectedElectionId}`);
      const details = res.data.election;
      
      // Update cache
      detailsCache.current[selectedElectionId] = {
        data: details,
        stats: res.data.stats,
        timestamp: Date.now(),
      };
      
      setCurrentElectionDetails(details);
      
      // Update in allElections array
      setAllElections(prev => 
        prev.map(e => e._id === selectedElectionId ? details : e)
      );
    } catch (error) {
      console.error('Failed to fetch election details:', error);
      setElectionError(error.response?.data?.message || 'Failed to load election details');
    }
  }, [selectedElectionId]);

  // Set selected election
  const setSelectedElection = useCallback((electionId) => {
    if (electionId === selectedElectionId) return;
    setSelectedElectionId(electionId);
  }, [selectedElectionId]);

  // Get election stats
  const getElectionStats = useCallback(() => {
    if (!selectedElectionId || !detailsCache.current[selectedElectionId]) {
      return {
        candidates: 0,
        voters: 0,
        votes: 0,
        verifiedVoters: 0,
      };
    }
    
    const cached = detailsCache.current[selectedElectionId];
    return {
      candidates: cached.stats?.offChain?.totalCandidates || 0,
      voters: cached.stats?.offChain?.totalUsers || 0,
      votes: cached.stats?.onChain?.numVotes || 0,
      verifiedVoters: cached.stats?.offChain?.verifiedVoters || 0,
    };
  }, [selectedElectionId]);

  // Check if election is active
  const isElectionActive = useCallback(() => {
    if (!currentElectionDetails) return false;
    return currentElectionDetails.isActive === true;
  }, [currentElectionDetails]);

  // Get election phase
  const getElectionPhase = useCallback(() => {
    return currentElectionDetails?.phase || 'registration';
  }, [currentElectionDetails]);

  // Check if user can vote
  const canUserVote = useCallback((userStatus) => {
    if (!currentElectionDetails || !userStatus) return false;
    
    return (
      currentElectionDetails.phase === 'voting' &&
      currentElectionDetails.isActive &&
      userStatus.isVerified &&
      !userStatus.hasVoted &&
      userStatus.isRegisteredOnChain
    );
  }, [currentElectionDetails]);

  // Get contract address
  const getContractAddress = useCallback(() => {
    return currentElectionDetails?.contractAddress || null;
  }, [currentElectionDetails]);

  // Clear cache (on logout)
  const clearCache = useCallback(() => {
    electionsCache.current = { data: null, timestamp: null };
    detailsCache.current = {};
    setAllElections([]);
    setCurrentElectionDetails(null);
    setSelectedElectionId(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Switch callbacks
  const onElectionSwitch = useCallback((callback) => {
    setSwitchCallbacks(prev => [...prev, callback]);
    return () => {
      setSwitchCallbacks(prev => prev.filter(cb => cb !== callback));
    };
  }, []);

  const notifySwitchCallbacks = useCallback((electionId) => {
    switchCallbacks.forEach(callback => {
      try {
        callback(electionId);
      } catch (error) {
        console.error('Election switch callback error:', error);
      }
    });
  }, [switchCallbacks]);

  // Memoized value
  const value = useMemo(() => ({
    // State
    allElections,
    selectedElectionId,
    currentElectionDetails,
    isLoadingElections,
    electionError,
    
    // Legacy aliases
    elections: allElections,
    selectedElection: currentElectionDetails,
    loading: isLoadingElections,
    error: electionError,
    
    // Functions
    setSelectedElection,
    fetchAllElections,
    refreshCurrentElection,
    getElectionStats,
    isElectionActive,
    getElectionPhase,
    canUserVote,
    getContractAddress,
    clearCache,
    onElectionSwitch,
    
    // Legacy aliases
    selectElection: setSelectedElection,
    setSelectedElectionId: setSelectedElection,
    fetchElections: fetchAllElections,
  }), [
    allElections,
    selectedElectionId,
    currentElectionDetails,
    isLoadingElections,
    electionError,
    setSelectedElection,
    fetchAllElections,
    refreshCurrentElection,
    getElectionStats,
    isElectionActive,
    getElectionPhase,
    canUserVote,
    getContractAddress,
    clearCache,
    onElectionSwitch,
  ]);

  return (
    <ElectionContext.Provider value={value}>
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
