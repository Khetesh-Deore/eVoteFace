import { useState, useEffect } from 'react';
import { useElection } from '../../context/ElectionContext';
import { RefreshCw, ChevronDown, Calendar, Users, Clock } from 'lucide-react';
import api from '../../utils/api';

export default function ElectionSelector({ disabled = false, showDetails = true }) {
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

  // Ensure allElections is always an array
  const elections = Array.isArray(allElections) ? allElections : [];
  const selectedElectionData = elections.find(e => e._id === selectedElectionId);

  useEffect(() => {
    if (showDetails && elections.length > 0) {
      loadElectionStats();
    }
  }, [elections, showDetails]);

  const loadElectionStats = async () => {
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
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllElections(true);
    await loadElectionStats();
    setRefreshing(false);
  };

  const handleSelect = (electionId) => {
    if (!disabled) {
      setSelectedElection(electionId);
      setIsOpen(false);
    }
  };

  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'registration':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'voting':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPhaseIcon = (phase) => {
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
  };

  const getTimeRemaining = (endTime) => {
    if (!endTime) return null;
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  if (isLoadingElections && elections.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <RefreshCw className="w-4 h-4 animate-spin" />
        Loading elections...
      </div>
    );
  }

  if (electionError && elections.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-500">
        <span>⚠️ {electionError}</span>
        <button onClick={handleRefresh} className="text-blue-600 hover:underline">
          Retry
        </button>
      </div>
    );
  }

  if (elections.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No elections available
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Selected Election Display */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50 transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-2 flex-1">
          <span className="text-lg">{getPhaseIcon(selectedElectionData?.phase)}</span>
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
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 left-0 w-96 bg-white border rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b bg-gray-50">
              <span className="font-semibold text-sm text-gray-700">Select Election</span>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Refresh elections"
              >
                <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Election List */}
            <div className="py-2">
              {elections.map((election) => {
                const isSelected = election._id === selectedElectionId;
                const stats = electionStats[election._id] || {};
                const timeRemaining = getTimeRemaining(election.endTime);
                const isExpired = election.phase === 'completed' || (election.endTime && new Date(election.endTime) < new Date());

                return (
                  <button
                    key={election._id}
                    onClick={() => handleSelect(election._id)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-l-4 ${
                      isSelected ? 'bg-blue-50 border-blue-500' : 'border-transparent'
                    } ${isExpired ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Title and Phase */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">{getPhaseIcon(election.phase)}</span>
                          <h4 className="font-medium text-gray-900 text-sm truncate">
                            {election.title}
                          </h4>
                          {isSelected && (
                            <span className="text-xs text-blue-600 font-medium">✓ Active</span>
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
                            <Users className="w-3 h-3" />
                            <span>{stats.candidates || 0}</span>
                          </div>
                          <div className="flex items-center gap-1" title="Total votes">
                            <span>🗳️</span>
                            <span>{stats.votes || 0}</span>
                          </div>
                          <div className="flex items-center gap-1" title="Created">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(election.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Time Remaining */}
                        {timeRemaining && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Clock className="w-3 h-3" />
                            <span>{timeRemaining}</span>
                          </div>
                        )}
                      </div>

                      {/* Phase Badge */}
                      <span
                        className={`px-2 py-1 text-xs rounded-full border whitespace-nowrap ${getPhaseColor(
                          election.phase
                        )}`}
                      >
                        {election.phase}
                      </span>
                    </div>

                    {/* Status Indicator */}
                    {!election.isActive && (
                      <div className="mt-2 text-xs text-red-600">
                        ⚠️ Inactive
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-3 border-t bg-gray-50 text-xs text-gray-500 text-center">
              {elections.length} election{elections.length !== 1 ? 's' : ''} available
            </div>
          </div>
        </>
      )}
    </div>
  );
}
