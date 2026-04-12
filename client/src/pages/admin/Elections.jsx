import { useState } from 'react';
import { useElection } from '../../context/ElectionContext';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function Elections() {
  const { elections, selectedElectionId, selectElection, fetchElections } = useElection();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        '/api/elections',
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('Election created successfully!');
      setShowCreateModal(false);
      setFormData({ title: '', description: '', startTime: '', endTime: '' });
      fetchElections();
      selectElection(res.data.election._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create election');
    } finally {
      setCreating(false);
    }
  };

  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'registration':
        return 'bg-yellow-100 text-yellow-800';
      case 'voting':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Elections</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Create New Election
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {elections.map((election) => (
          <div
            key={election._id}
            onClick={() => selectElection(election._id)}
            className={`p-6 border rounded-lg cursor-pointer transition ${
              selectedElectionId === election._id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-300'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-semibold">{election.title}</h3>
              <span
                className={`px-2 py-1 text-xs rounded-full ${getPhaseColor(
                  election.phase
                )}`}
              >
                {election.phase}
              </span>
            </div>

            <p className="text-gray-600 text-sm mb-4">
              {election.description || 'No description'}
            </p>

            <div className="space-y-2 text-sm text-gray-500">
              <div>
                <span className="font-medium">Contract:</span>{' '}
                <span className="font-mono text-xs">
                  {election.contractAddress?.slice(0, 10)}...
                </span>
              </div>
              <div>
                <span className="font-medium">Status:</span>{' '}
                {election.isActive ? (
                  <span className="text-green-600">Active</span>
                ) : (
                  <span className="text-red-600">Inactive</span>
                )}
              </div>
              <div>
                <span className="font-medium">Created:</span>{' '}
                {new Date(election.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {elections.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No elections found</p>
          <p className="text-sm">Create your first election to get started</p>
        </div>
      )}

      {/* Create Election Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Create New Election</h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Election Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., Presidential Election 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  rows="3"
                  placeholder="Brief description of the election"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Start Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  End Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
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
    </div>
  );
}
