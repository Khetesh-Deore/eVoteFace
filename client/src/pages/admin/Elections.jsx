import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useElection } from '../../context/ElectionContext';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { Search, Plus, Filter, Copy, Trash2, Edit, Eye, Users, FileText, BarChart3, Settings, Archive, CheckSquare } from 'lucide-react';

export default function Elections() {
  const navigate = useNavigate();
  const { allElections, selectedElectionId, setSelectedElection, fetchAllElections, isLoadingElections } = useElection();
  
  // State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedElection, setSelectedElectionLocal] = useState(null);
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [selectedElections, setSelectedElections] = useState([]);
  const [stats, setStats] = useState(null);
  const [electionStats, setElectionStats] = useState({});
  
  const itemsPerPage = 10;

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
  });

  // Load stats
  useEffect(() => {
    loadStats();
  }, [allElections]);

  const loadStats = async () => {
    const statsData = {
      total: allElections.length,
      registration: allElections.filter(e => e.phase === 'registration').length,
      voting: allElections.filter(e => e.phase === 'voting').length,
      completed: allElections.filter(e => e.phase === 'completed').length,
      active: allElections.filter(e => e.isActive).length,
    };
    setStats(statsData);

    // Load individual election stats
    const statsMap = {};
    for (const election of allElections.slice(0, 20)) {
      try {
        const res = await api.get(`/elections/${election._id}`);
        statsMap[election._id] = res.data.stats;
      } catch (err) {
        console.error('Failed to load stats for', election._id);
      }
    }
    setElectionStats(statsMap);
  };

  // Filter and sort elections
  const filteredElections = allElections
    .filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPhase = phaseFilter === 'all' || e.phase === phaseFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && e.isActive) || 
        (statusFilter === 'inactive' && !e.isActive);
      return matchesSearch && matchesPhase && matchesStatus;
    })
    .sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'createdAt') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

  const paginatedElections = filteredElections.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredElections.length / itemsPerPage);

  // Create election
  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (formData.title.length > 100) {
      toast.error('Title must be 100 characters or less');
      return;
    }
    if (formData.description.length > 500) {
      toast.error('Description must be 500 characters or less');
      return;
    }

    setCreating(true);
    try {
      const res = await api.post('/elections', formData);
      toast.success('Election created successfully!');
      setShowCreateModal(false);
      setFormData({ title: '', description: '', startTime: '', endTime: '' });
      await fetchAllElections(true);
      setSelectedElection(res.data.election._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create election');
    } finally {
      setCreating(false);
    }
  };

  // Delete election
  const handleDelete = async (electionId, title) => {
    if (!window.confirm(`Delete "${title}"? This action cannot be undone.`)) return;
    
    try {
      await api.delete(`/elections/${electionId}`);
      toast.success('Election deleted successfully');
      await fetchAllElections(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete election');
    }
  };

  // View details
  const viewDetails = async (election) => {
    setSelectedElectionLocal(election);
    setShowDetailsModal(true);
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Bulk actions
  const handleBulkArchive = async () => {
    if (selectedElections.length === 0) {
      toast.error('No elections selected');
      return;
    }
    toast.info('Bulk archive feature coming soon');
  };

  // Get phase color
  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'registration': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'voting': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getRowColor = (phase) => {
    switch (phase) {
      case 'registration': return 'bg-yellow-50/30';
      case 'voting': return 'bg-blue-50/30';
      case 'completed': return 'bg-gray-50/30';
      default: return '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Election Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all elections in the system</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create New Election
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white border rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500">Total Elections</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-700">{stats.registration}</div>
            <div className="text-xs text-yellow-600">Registration</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-700">{stats.voting}</div>
            <div className="text-xs text-blue-600">Voting</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-700">{stats.completed}</div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-700">{stats.active}</div>
            <div className="text-xs text-green-600">Active</div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search elections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
            />
          </div>

          {/* Phase Filter */}
          <select
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">All Phases</option>
            <option value="registration">Registration</option>
            <option value="voting">Voting</option>
            <option value="completed">Completed</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="title-asc">Title A-Z</option>
            <option value="title-desc">Title Z-A</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedElections.length > 0 && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm text-blue-700 font-medium">
              {selectedElections.length} selected
            </span>
            <button
              onClick={handleBulkArchive}
              className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Bulk Archive
            </button>
            <button
              onClick={() => setSelectedElections([])}
              className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Elections Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedElections(paginatedElections.map(e => e._id));
                      } else {
                        setSelectedElections([]);
                      }
                    }}
                    checked={selectedElections.length === paginatedElections.length && paginatedElections.length > 0}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phase</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Voters</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidates</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Votes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedElections.map((election) => {
                const stats = electionStats[election._id];
                const isSelected = selectedElections.includes(election._id);
                
                return (
                  <tr
                    key={election._id}
                    className={`hover:bg-gray-50 transition-colors ${getRowColor(election.phase)} ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedElections([...selectedElections, election._id]);
                          } else {
                            setSelectedElections(selectedElections.filter(id => id !== election._id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{election.title}</div>
                      {election.description && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">{election.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getPhaseColor(election.phase)}`}>
                        {election.phase}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(election.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {stats?.offChain?.totalUsers || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {stats?.offChain?.totalCandidates || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {stats?.onChain?.numVotes || 0}
                    </td>
                    <td className="px-4 py-3">
                      {election.isActive ? (
                        <span className="text-xs text-green-600 font-medium">Active</span>
                      ) : (
                        <span className="text-xs text-red-600 font-medium">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => viewDetails(election)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedElection(election._id);
                            navigate('/admin/candidates');
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Manage Candidates"
                        >
                          <Users className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedElection(election._id);
                            navigate('/admin/results');
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="View Results"
                        >
                          <BarChart3 className="w-4 h-4 text-gray-600" />
                        </button>
                        {election.phase === 'registration' && (
                          <button
                            onClick={() => handleDelete(election._id, election.title)}
                            className="p-1 hover:bg-red-100 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredElections.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No elections found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or create a new election</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t px-4 py-3 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filteredElections.length)} of {filteredElections.length} elections
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Election Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create New Election</h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Election Title * <span className="text-xs text-gray-500">({formData.title.length}/100)</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., Presidential Election 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description <span className="text-xs text-gray-500">({formData.description.length}/500)</span>
                </label>
                <textarea
                  maxLength={500}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  rows="3"
                  placeholder="Brief description of the election"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Start Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">End Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Election'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedElection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">{selectedElection.title}</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-gray-900">{selectedElection.description || 'No description'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Phase</label>
                  <p className="text-gray-900 capitalize">{selectedElection.phase}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-gray-900">{selectedElection.isActive ? 'Active' : 'Inactive'}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Contract Address</label>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 overflow-x-auto">
                    {selectedElection.contractAddress}
                  </code>
                  <button
                    onClick={() => copyToClipboard(selectedElection.contractAddress)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {selectedElection.factoryTxHash && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Deployment Transaction</label>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 overflow-x-auto">
                      {selectedElection.factoryTxHash}
                    </code>
                    <button
                      onClick={() => copyToClipboard(selectedElection.factoryTxHash)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-gray-900">{new Date(selectedElection.createdAt).toLocaleString()}</p>
                </div>
                {selectedElection.startTime && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Start Time</label>
                    <p className="text-gray-900">{new Date(selectedElection.startTime).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {selectedElection.endTime && (
                <div>
                  <label className="text-sm font-medium text-gray-500">End Time</label>
                  <p className="text-gray-900">{new Date(selectedElection.endTime).toLocaleString()}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setSelectedElection(selectedElection._id);
                      navigate('/admin/candidates');
                      setShowDetailsModal(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    <Users className="w-4 h-4" />
                    Manage Candidates
                  </button>
                  <button
                    onClick={() => {
                      setSelectedElection(selectedElection._id);
                      navigate('/admin/voters');
                      setShowDetailsModal(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    <Users className="w-4 h-4" />
                    Manage Voters
                  </button>
                  <button
                    onClick={() => {
                      setSelectedElection(selectedElection._id);
                      navigate('/admin/results');
                      setShowDetailsModal(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    <BarChart3 className="w-4 h-4" />
                    View Results
                  </button>
                  <button
                    onClick={() => {
                      setSelectedElection(selectedElection._id);
                      navigate('/admin/election');
                      setShowDetailsModal(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    <Settings className="w-4 h-4" />
                    Election Control
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
