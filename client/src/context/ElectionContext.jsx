import { createContext, useState, useEffect, useContext, useCallback, useRef, useMemo, useReducer } from 'react';
import api from '../utils/api';

const ElectionContext = createContext();

const STORAGE_KEY = 'selectedElectionId';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DETAILS_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
const SWITCH_DEBOUNCE = 500; // 500ms debounce

// Debug mode flag
const DEBUG = import.meta.env.MODE === 'development';

const debugLog = (...args) => {
  if (DEBUG) console.log('[ElectionContext]', ...args);
};

// Reducer for complex state management
const electionReducer = (state, action) => {
  debugLog('Action:', action.type, action.payload);
  
  switch (action.type) {
    case 'SET_ELECTIONS':
      return { ...state, allElections: action.payload, lastUpdated: Date.now() };
    case 'SET_SELECTED_ID':
      return { ...state, selectedElectionId: action.payload };
    case 'SET_CURRENT_DETAILS':
      return { ...state, currentElectionDetails: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoadingElections: action.payload };
    case 'SET_ERROR':
      return { ...state, electionError: action.payload };
    case 'SET_STATS':
      return { ...state, electionStats: action.payload };
    case 'SET_CAN_VOTE':
      return { ...state, canUserVote: action.payload };
    case 'CLEAR_CACHE':
      return {
        ...state,
        allElections: [],
        selectedElectionId: null,
        currentElectionDetails: null,
        electionStats: {},
        canUserVote: false,
        lastUpdated: null,
      };
    default:
      return state;
  }
};

export function ElectionProvider({ children }) {
  // Use reducer for complex state
  const [state, dispatch] = useReducer(electionReducer, {
    allElections: [],
    selectedElectionId: localStorage.getItem(STORAGE_KEY) || null,
    currentElectionDetails: null,
    isLoadingElections: false,
    electionError: null,
    electionStats: {},
    canUserVote: false,
    lastUpdated: null,
  });

  const [switchCallbacks, setSwitchCallbacks] = useState([]);

  // Cache management
  const electionsCache = useRef({ data: null, timestamp: null });
  const detailsCache = useRef({});
  const fetchInProgress = useRef(false);
  const switchTimeout = useRef(null);

  // Sync across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY && e.newValue !== state.selectedElectionId) {
        debugLog('Storage changed from another tab:', e.newValue);
        dispatch({ type: 'SET_SELECTED_ID', payload: e.newValue });
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [state.selectedElectionId]);

  // Initial load
  useEffect(() => {
    debugLog('Initial load');
    fetchAllElections();
  }, []);

  // Load details when election changes
  useEffect(() => {
    if (state.selectedElectionId) {
      localStorage.setItem(STORAGE_KEY, state.selectedElectionId);
      debugLog('Selected election changed:', state.selectedElectionId);
      refreshCurrentElection();
      notifySwitchCallbacks(state.selectedElectionId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      dispatch({ type: 'SET_CURRENT_DETAILS', payload: null });
    }
  }, [state.selectedElectionId]);

  // Fetch all elections with caching
  const fetchAllElections = useCallback(async (forceRefresh = false) => {
    // Check cache
    const now = Date.now();
    if (!forceRefresh && electionsCache.current.data && 
        (now - electionsCache.current.timestamp) < CACHE_DURATION) {
      debugLog('Using cached elections');
      dispatch({ type: 'SET_ELECTIONS', payload: electionsCache.current.data });
      autoSelectElection(electionsCache.current.data);
      return;
    }

    // Prevent duplicate requests
    if (fetchInProgress.current) {
      debugLog('Fetch already in progress, skipping');
      return;
    }
    fetchInProgress.current = true;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      debugLog('Fetching elections from API');
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
      
      debugLog(`Fetched ${electionsData.length} elections`);
      
      // Update cache
      electionsCache.current = {
        data: electionsData,
        timestamp: now,
      };
      
      dispatch({ type: 'SET_ELECTIONS', payload: electionsData });
      autoSelectElection(electionsData);
    } catch (error) {
      console.error('Failed to fetch elections:', error);
      const errorMsg = error.response?.data?.message || 'Failed to load elections';
      dispatch({ type: 'SET_ERROR', payload: errorMsg });
      
      // Use cached data as fallback
      if (electionsCache.current.data) {
        debugLog('Using cached elections as fallback');
        dispatch({ type: 'SET_ELECTIONS', payload: electionsCache.current.data });
      } else {
        dispatch({ type: 'SET_ELECTIONS', payload: [] });
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      fetchInProgress.current = false;
    }
  }, []);

  // Auto-select election logic
  const autoSelectElection = useCallback((electionsData) => {
    // Ensure electionsData is an array
    if (!Array.isArray(electionsData) || electionsData.length === 0) {
      debugLog('No elections to auto-select');
      return;
    }
    
    if (!state.selectedElectionId || !electionsData.find(e => e._id === state.selectedElectionId)) {
      const activeElection = electionsData.find(e => e.isActive && e.phase !== 'completed');
      if (activeElection) {
        debugLog('Auto-selecting active election:', activeElection._id);
        dispatch({ type: 'SET_SELECTED_ID', payload: activeElection._id });
      } else if (electionsData.length > 0) {
        debugLog('Auto-selecting first election:', electionsData[0]._id);
        dispatch({ type: 'SET_SELECTED_ID', payload: electionsData[0]._id });
      }
    }
  }, [state.selectedElectionId]);

  // Refresh current election details
  const refreshCurrentElection = useCallback(async () => {
    if (!state.selectedElectionId) return;

    // Check details cache
    const cached = detailsCache.current[state.selectedElectionId];
    const now = Date.now();
    if (cached && (now - cached.timestamp) < DETAILS_CACHE_DURATION) {
      debugLog('Using cached election details');
      dispatch({ type: 'SET_CURRENT_DETAILS', payload: cached.data });
      dispatch({ type: 'SET_STATS', payload: {
        candidates: cached.stats?.offChain?.totalCandidates || 0,
        voters: cached.stats?.offChain?.totalUsers || 0,
        votes: cached.stats?.onChain?.numVotes || 0,
        verifiedVoters: cached.stats?.offChain?.verifiedVoters || 0,
        votedCount: cached.stats?.offChain?.votedCount || 0,
      }});
      return;
    }

    try {
      debugLog('Fetching election details:', state.selectedElectionId);
      const res = await api.get(`/elections/${state.selectedElectionId}`);
      const details = res.data.election;
      
      // Update cache
      detailsCache.current[state.selectedElectionId] = {
        data: details,
        stats: res.data.stats,
        timestamp: Date.now(),
      };
      
      dispatch({ type: 'SET_CURRENT_DETAILS', payload: details });
      dispatch({ type: 'SET_STATS', payload: {
        candidates: res.data.stats?.offChain?.totalCandidates || 0,
        voters: res.data.stats?.offChain?.totalUsers || 0,
        votes: res.data.stats?.onChain?.numVotes || 0,
        verifiedVoters: res.data.stats?.offChain?.verifiedVoters || 0,
        votedCount: res.data.stats?.offChain?.votedCount || 0,
      }});
      
      // Update in allElections array
      dispatch({ type: 'SET_ELECTIONS', payload: 
        state.allElections.map(e => e._id === state.selectedElectionId ? details : e)
      });
    } catch (error) {
      console.error('Failed to fetch election details:', error);
      
      // Handle 404 - election deleted
      if (error.response?.status === 404) {
        debugLog('Election not found, clearing selection');
        localStorage.removeItem(STORAGE_KEY);
        dispatch({ type: 'SET_SELECTED_ID', payload: null });
        dispatch({ type: 'SET_ERROR', payload: 'Election not found or deleted' });
        
        // Try to select another election
        if (state.allElections.length > 0) {
          const nextElection = state.allElections.find(e => e._id !== state.selectedElectionId);
          if (nextElection) {
            dispatch({ type: 'SET_SELECTED_ID', payload: nextElection._id });
          }
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to load election details' });
      }
    }
  }, [state.selectedElectionId, state.allElections]);

  // Set selected election with debouncing
  const setSelectedElection = useCallback((electionId) => {
    if (electionId === state.selectedElectionId) return;
    
    // Clear previous timeout
    if (switchTimeout.current) {
      clearTimeout(switchTimeout.current);
    }
    
    // Debounce election switch
    switchTimeout.current = setTimeout(() => {
      debugLog('Switching to election:', electionId);
      dispatch({ type: 'SET_SELECTED_ID', payload: electionId });
    }, SWITCH_DEBOUNCE);
  }, [state.selectedElectionId]);

  // Switch election (immediate, no debounce)
  const switchElection = useCallback(async (newElectionId) => {
    if (newElectionId === state.selectedElectionId) return;
    
    debugLog('Immediate switch to election:', newElectionId);
    
    // Validate election exists
    const election = state.allElections.find(e => e._id === newElectionId);
    if (!election) {
      dispatch({ type: 'SET_ERROR', payload: 'Election not found' });
      return;
    }
    
    dispatch({ type: 'SET_SELECTED_ID', payload: newElectionId });
  }, [state.selectedElectionId, state.allElections]);

  // Get election stats
  const getElectionStats = useCallback(() => {
    return state.electionStats;
  }, [state.electionStats]);

  // Update election stats manually
  const updateElectionStats = useCallback(async () => {
    if (!state.selectedElectionId) return;
    
    try {
      debugLog('Updating election stats');
      const res = await api.get(`/elections/${state.selectedElectionId}`);
      dispatch({ type: 'SET_STATS', payload: {
        candidates: res.data.stats?.offChain?.totalCandidates || 0,
        voters: res.data.stats?.offChain?.totalUsers || 0,
        votes: res.data.stats?.onChain?.numVotes || 0,
        verifiedVoters: res.data.stats?.offChain?.verifiedVoters || 0,
        votedCount: res.data.stats?.offChain?.votedCount || 0,
      }});
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  }, [state.selectedElectionId]);

  // Check if election is active
  const isElectionActive = useCallback(() => {
    if (!state.currentElectionDetails) return false;
    return state.currentElectionDetails.phase === 'voting';
  }, [state.currentElectionDetails]);

  // Get election phase
  const getElectionPhase = useCallback(() => {
    return state.currentElectionDetails?.phase || 'registration';
  }, [state.currentElectionDetails]);

  // Check if user can vote in election
  const canUserVoteInElection = useCallback((userStatus) => {
    if (!state.currentElectionDetails || !userStatus) return false;
    
    const canVote = (
      state.currentElectionDetails.phase === 'voting' &&
      state.currentElectionDetails.isActive &&
      userStatus.isVerified &&
      !userStatus.hasVoted &&
      userStatus.isRegisteredOnChain &&
      userStatus.faceEncoding
    );
    
    dispatch({ type: 'SET_CAN_VOTE', payload: canVote });
    return canVote;
  }, [state.currentElectionDetails]);

  // Get contract address
  const getContractAddress = useCallback(() => {
    return state.currentElectionDetails?.contractAddress || null;
  }, [state.currentElectionDetails]);

  // Clear cache (on logout)
  const clearElectionCache = useCallback(() => {
    debugLog('Clearing election cache');
    electionsCache.current = { data: null, timestamp: null };
    detailsCache.current = {};
    dispatch({ type: 'CLEAR_CACHE' });
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
    debugLog('Notifying switch callbacks:', electionId);
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
    allElections: state.allElections,
    selectedElectionId: state.selectedElectionId,
    currentElectionDetails: state.currentElectionDetails,
    isLoadingElections: state.isLoadingElections,
    electionError: state.electionError,
    electionStats: state.electionStats,
    canUserVote: state.canUserVote,
    lastUpdated: state.lastUpdated,
    
    // Legacy aliases
    elections: state.allElections,
    selectedElection: state.currentElectionDetails,
    loading: state.isLoadingElections,
    error: state.electionError,
    
    // Functions
    setSelectedElection,
    switchElection,
    fetchAllElections,
    refreshCurrentElection,
    getElectionStats,
    updateElectionStats,
    isElectionActive,
    getElectionPhase,
    canUserVoteInElection,
    getContractAddress,
    clearElectionCache,
    onElectionSwitch,
    
    // Legacy aliases
    selectElection: setSelectedElection,
    setSelectedElectionId: setSelectedElection,
    fetchElections: fetchAllElections,
    clearCache: clearElectionCache,
  }), [
    state,
    setSelectedElection,
    switchElection,
    fetchAllElections,
    refreshCurrentElection,
    getElectionStats,
    updateElectionStats,
    isElectionActive,
    getElectionPhase,
    canUserVoteInElection,
    getContractAddress,
    clearElectionCache,
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
