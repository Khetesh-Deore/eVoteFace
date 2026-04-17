import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Plus, Search } from 'lucide-react';
import { motion } from 'motion/react';
import PhaseIndicator from '../../components/PhaseIndicator';
import LoadingSpinner from '../../components/LoadingSpinner';
import axiosInstance from '../../lib/axios';
import { toast } from 'react-toastify';

export default function AdminElections() {
  const [elections, setElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = async () => {
    try {
      const response = await axiosInstance.get('/admin/elections');
      setElections(response.data);
    } catch (error) {
      toast.error('Failed to load elections');
    } finally {
      setLoading(false);
    }
  };

  const filteredElections = elections.filter((election) =>
    election.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    election.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#f5f5f5] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold text-[#1a1a2e] mb-2">Elections Management</h1>
            <p className="text-gray-600">{elections.length} total elections</p>
          </div>
          <Link
            to="/admin/elections/new"
            className="flex items-center gap-2 px-6 py-3 bg-[#e94560] hover:bg-[#d63651] text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Create New Election
          </Link>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, description..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e94560] focus:border-transparent outline-none"
            />
          </div>
        </motion.div>

        {/* Elections List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          {filteredElections.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No elections found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Title</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Phase</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Candidates</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Voters</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Votes</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredElections.map((election) => (
                    <tr key={election._id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <p className="font-medium text-gray-900">{election.title}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">{election.description}</p>
                      </td>
                      <td className="py-4 px-6">
                        <PhaseIndicator phase={election.phase} />
                      </td>
                      <td className="py-4 px-6 text-gray-700">
                        {election.stats?.candidateCount || 0}
                      </td>
                      <td className="py-4 px-6 text-gray-700">
                        {election.stats?.voterCount || 0}
                      </td>
                      <td className="py-4 px-6 text-gray-700">
                        {election.stats?.votedCount || 0}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          <Link
                            to={`/admin/elections/${election._id}`}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            Manage
                          </Link>
                          <Link
                            to={`/elections/${election._id}/results`}
                            className="text-green-600 hover:underline font-medium"
                          >
                            Results
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
