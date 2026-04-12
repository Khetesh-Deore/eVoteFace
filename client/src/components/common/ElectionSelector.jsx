import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useElection } from '../../context/ElectionContext';
import { RefreshCw, ChevronDown, Calendar, Users, Clock, Search, X, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

const ElectionSelector = memo(({ disabled = false, showDetails = true, onVotingSession = false }) => {
  const { 
    allElections, 
    selectedElectionId, 
    setSelectedElection, 
    isLoadingElections, 
    electionError, 
    fetchAllElections,
    getElectionStats 
  } = useElection();
  
  const [isOpen, setIsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [electionStats, setElectionStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOption, setFilterOption] = useState('all'); // 'all', 'active', 'my'
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingElectionId, setPendingElectionId] = useState(null);

  // Ensure allElections is always an array
  const elections = Array.isArray(allElections) ? allElections : [];
  const selectedElectionData = elections.find(e => e._id === selectedElectionId);

  // Filter and search elections
  const filteredElections = useMemo(() => {
    let filtered = elections;
    
    // Apply filter
    if (filterOption === 'active') {
      filtered = filtered.filter(e => e.isActive && e.phase !== 'completed');
    }
    
    // Apply search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(term) ||
        e.description?.toLowerCase().includes(term)
      );
    }
    
    // Sort: Active first, then by creation date
    return filtered.sort((a, b) => {
      // Active elections first
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      
      // Then by phase (voting > registration > completed)
      const phaseOrder = { voting: 0, registration: 1, completed: 2 };
      const phaseA = phaseOrder[a.phase] ?? 3;
      const phaseB = phaseOrder[b.phase] ?? 3;
      if (phaseA !== phaseB) return phaseA - phaseB;
      
      // Finally by creation date (newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [elections, searchTerm, filterOption]);

  useEffect(() => {
    if (showDetails && elections.length > 0) {
      loadElectionStats();
    }
  }, [elections, showDetails]);

  const loadElectionStats = useCallback(async () => {
    const stats = {};
    for (const election of elections) {
      try {
        const res = await api.get(`/elections/${election._id}`);
        stats[election._id] = {
          candidates: res.data.stats?.offChain?.totalCandidates || 0,
          voters: res.data.stats?.offChain?.totalUsers || 0,
          votes: res.data.stats?.onChain?.numVotes || 0,
        };
      } catch (err) {
        console.error('Failed to load stats for', election._id);
      }
    }
    setElectionStats(stats);
  }, [elections]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllElections(true);
    await loadElectionStats();
    setRefreshing(false);
  }, [fetchAllElections, loadElectionStats]);

  const handleSelect = useCallback((electionId) => {
    if (disabled) return;
    
    // Warn if switching during voting session
    if (onVotingSession) {
      setPendingElectionId(electionId);
      setShowConfirmModal(true);
      return;
    }
    
    setSelectedElection(electionId);
    setIsOpen(false);
    setSearchTerm('');
  }, [disabled, onVotingSession, setSelectedElection]);

  const confirmSwitch = useCallback(() => {
    if (pendingElectionId) {
      setSelectedElection(pendingElectionId);
      setIsOpen(false);
      setSearchTerm('');
      setShowConfirmModal(false);
      setPendingElectionId(null);
    }
  }, [pendingElectionId, setSelectedElection]);

  const cancelSwitch = useCallback(() => {
    setShowConfirmModal(false);
    setPendingElectionId(null);
  }, []);

  const getPhaseColor = useCallback((phase) => {
    switch (phase) {
      case 'registration':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'voting':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }, []);

  const getPhaseIcon = useCallback((phase) => {
    switch (phase) {
      case 'registration':
        return '📝';
      case 'voting':
        return '🗳️';
      case 'completed':
        return '✅';
      default:
        return '📋';
    }
  }, []);

  const getTimeRemaining = useCallback((endTime) => {
    if (!endTime) return null;
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (isLoadingElections && elections.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500" role="status" aria-live="polite">
        <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
        <span>Loading elections...</span>
      </div>
    );
  }

  if (electionError && elections.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-500" role="alert">
        <AlertCircle className="w-4 h-4" aria-hidden="true" />
        <span>{electionError}</span>
        <button 
          onClick={handleRefresh} 
          className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
          aria-label="Retry loading elections"
        >
          Retry
        </button>
      </div>
    );
  }

  if (elections.length === 0) {
    return (
      <div className="text-sm text-gray-500" role="status">
        No elections available
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        {/* Selected Election Display */}
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`flex items-center gap-2 px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50 transition-colors min-h-[44px] ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={`Selected election: ${selectedElectionData?.title || 'Select Election'}`}
        >
          <div className="flex items-center gap-2 flex-1">
            <span className="text-lg" aria-hidden="true">{getPhaseIcon(selectedElectionData?.phase)}</span>
            <div className="text-left">
              <div className="font-medium text-gray-900 text-sm">
                {selectedElectionData?.title || 'Select Election'}
              </div>
              {showDetails && selectedElectionData && (
                <div className="text-xs text-gray-500">
                  {selectedElectionData.phase} • {electionStats[selectedElectionId]?.candidates || 0} candidates
                </div>
              )}
            </div>
          </div>
          {onVotingSession && (
            <span className="text-xs text-orange-600 font-medium" aria-label="Voting session active">
              🔒 Locked
            </span>
          )}
          <ChevronDown 
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            aria-hidden="true"
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <div 
              className="absolute top-full mt-2 left-0 w-96 max-w-[calc(100vw-2rem)] bg-white border rounded-lg shadow-lg z-20 max-h-[32rem] overflow-hidden flex flex-col"
              role="listbox"
              aria-label="Available elections"
            >
              {/* Header with Search and Filters */}
              <div className="p-3 border-b bg-gray-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-gray-700">Select Election</span>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="p-1 hover:bg-gray-200 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Refresh elections"
                    aria-label="Refresh elections list"
                  >
                    <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search elections..."
                    className="w-full pl-8 pr-8 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Search elections"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 rounded"
                      aria-label="Clear search"
                    >
                      <X className="w-3 h-3 text-gray-400" />
                    </button>
                  )}
                </div>
                
                {/* Filter Options */}
                <div className="flex gap-2 text-xs">
                  <button
                    onClick={() => setFilterOption('all')}
                    className={`px-2 py-1 rounded ${filterOption === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    aria-pressed={filterOption === 'all'}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterOption('active')}
                    className={`px-2 py-1 rounded ${filterOption === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    aria-pressed={filterOption === 'active'}
                  >
                    Active Only
                  </button>
                </div>
              </div>

              {/* Election List */}
              <div className="overflow-y-auto flex-1">
                {filteredElections.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    {searchTerm ? 'No elections match your search' : 'No elections found'}
                  </div>
                ) : (
                  <div className="py-2">
                    {filteredElections.map((election) => {
                      const isSelected = election._id === selectedElectionId;
                      const stats = electionStats[election._id] || {};
                      const timeRemaining = getTimeRemaining(election.endTime);
                      const isExpired = election.phase === 'completed' || (election.endTime && new Date(election.endTime) < new Date());

                      return (
                        <button
                          key={election._id}
                          onClick={() => handleSelect(election._id)}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-l-4 focus:outline-none focus:bg-gray-100 ${
                            isSelected ? 'bg-blue-50 border-blue-500' : 'border-transparent'
                          } ${isExpired ? 'opacity-60' : ''}`}
                          role="option"
                          aria-selected={isSelected}
                          title={election.description}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {/* Title and Phase */}
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-base" aria-hidden="true">{getPhaseIcon(election.phase)}</span>
                                <h4 className="font-medium text-gray-900 text-sm truncate">
                                  {election.title}
                                </h4>
                                {isSelected && (
                                  <span className="text-xs text-blue-600 font-medium" aria-label="Currently selected">
                                    ✓ Active
                                  </span>
                                )}
                              </div>

                              {/* Description */}
                              {election.description && (
                                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                  {election.description}
                                </p>
                              )}

                              {/* Stats */}
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <div className="flex items-center gap-1" title="Candidates">
                                  <Users className="w-3 h-3" aria-hidden="true" />
                                  <span>{stats.candidates || 0}</span>
                                </div>
                                <div className="flex items-center gap-1" title="Total votes">
                                  <span aria-hidden="true">🗳️</span>
                                  <span>{stats.votes || 0}</span>
                                </div>
                                <div className="flex items-center gap-1" title="Created">
                                  <Calendar className="w-3 h-3" aria-hidden="true" />
                                  <span>{new Date(election.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>

                              {/* Time Remaining */}
                              {timeRemaining && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                  <Clock className="w-3 h-3" aria-hidden="true" />
                                  <span>{timeRemaining}</span>
                                </div>
                              )}
                            </div>

                            {/* Phase Badge */}
                            <span
                              className={`px-2 py-1 text-xs rounded-full border whitespace-nowrap ${getPhaseColor(
                                election.phase
                              )}`}
                              aria-label={`Phase: ${election.phase}`}
                            >
                              {election.phase}
                            </span>
                          </div>

                          {/* Status Indicator */}
                          {!election.isActive && (
                            <div className="mt-2 text-xs text-red-600" role="status">
                              ⚠️ Inactive
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t bg-gray-50 text-xs text-gray-500 text-center">
                {filteredElections.length} of {elections.length} election{elections.length !== 1 ? 's' : ''}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confirmation Modal for Voting Session */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 id="confirm-title" className="font-semibold text-gray-900 mb-2">
                  Switch Election During Voting?
                </h3>
                <p className="text-sm text-gray-600">
                  You are currently in an active voting session. Switching elections will discard your current vote. Are you sure you want to continue?
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelSwitch}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmSwitch}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                Switch Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

ElectionSelector.displayName = 'ElectionSelector';

export default ElectionSelector;
