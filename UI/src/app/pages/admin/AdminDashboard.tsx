import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { BarChart3, Users, Vote as VoteIcon, Calendar, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import PhaseIndicator from '../../components/PhaseIndicator';
import LoadingSpinner from '../../components/LoadingSpinner';
import axiosInstance from '../../lib/axios';
import { toast } from 'react-toastify';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [elections, setElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getStats = () => {
    const totalVoters = elections.reduce((sum, e) => sum + (e.stats?.voterCount || 0), 0);
    const totalVotes = elections.reduce((sum, e) => sum + (e.stats?.votedCount || 0), 0);
    
    return {
      totalElections: elections.length,
      activeElections: elections.filter((e) => e.phase === 'voting').length,
      totalVoters,
      totalVotes,
    };
  };

  const stats = getStats();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#f5f5f5] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-[#1a1a2e] mb-2">Admin Dashboard</h1>
          <p className="text-lg text-gray-600">Welcome, {user?.fullName}</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { icon: Calendar, label: 'Total Elections', value: stats.totalElections, color: 'blue' },
            { icon: VoteIcon, label: 'Active Elections', value: stats.activeElections, color: 'green' },
            { icon: Users, label: 'Total Voters', value: stats.totalVoters, color: 'purple' },
            { icon: BarChart3, label: 'Votes Cast', value: stats.totalVotes, color: 'orange' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-md p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-[#1a1a2e]">{stat.value}</p>
                </div>
                <stat.icon className={`w-12 h-12 text-${stat.color}-600`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-[#1a1a2e] mb-6">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/admin/elections/new"
              className="flex items-center gap-2 px-6 py-3 bg-[#e94560] hover:bg-[#d63651] text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create New Election
            </Link>
            <Link
              to="/admin/elections"
              className="px-6 py-3 border-2 border-[#e94560] text-[#e94560] hover:bg-[#e94560] hover:text-white rounded-lg font-semibold transition-all"
            >
              Manage Elections
            </Link>
          </div>
        </motion.div>

        {/* Recent Elections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold text-[#1a1a2e] mb-6">Recent Elections</h2>
          
          {elections.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No elections created yet.</p>
              <Link
                to="/admin/elections/new"
                className="inline-block px-6 py-3 bg-[#e94560] hover:bg-[#d63651] text-white rounded-lg transition-colors"
              >
                Create First Election
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Phase</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Candidates</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Voters</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Votes</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {elections.map((election) => (
                    <tr key={election._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <p className="font-medium text-gray-900">{election.title}</p>
                      </td>
                      <td className="py-4 px-4">
                        <PhaseIndicator phase={election.phase} />
                      </td>
                      <td className="py-4 px-4 text-gray-700">
                        {election.stats?.candidateCount || 0}
                      </td>
                      <td className="py-4 px-4 text-gray-700">
                        {election.stats?.voterCount || 0}
                      </td>
                      <td className="py-4 px-4 text-gray-700">
                        {election.stats?.votedCount || 0}
                      </td>
                      <td className="py-4 px-4">
                        <Link
                          to={`/admin/elections/${election._id}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          Manage
                        </Link>
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
