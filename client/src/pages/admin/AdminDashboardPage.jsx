import { useEffect, useState } from 'react'
import { Card, Loading, Alert } from '../../components/common'
import { adminService } from '../../services/adminService'

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardStats()
    const interval = setInterval(fetchDashboardStats, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await adminService.getDashboardStats()
      setStats(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard stats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading />

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'upcoming':
        return 'bg-blue-100 text-blue-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTimeRemaining = (endTime) => {
    const now = new Date()
    const end = new Date(endTime)
    const diff = end - now

    if (diff <= 0) return 'Ended'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const turnout = stats?.totalVoters > 0 
    ? ((stats?.totalVotes / stats?.totalVoters) * 100).toFixed(1)
    : 0

  return (
    <div className="space-y-8">
      {error && <Alert type="error" message={error} />}

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-300 text-lg">
          Manage election, voters, and candidates
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-blue-500">
          <div className="text-4xl mb-4">👥</div>
          <p className="text-gray-600 mb-2 text-sm">Total Voters</p>
          <p className="text-4xl font-bold text-gray-900">{stats?.totalVoters || 0}</p>
          <p className="text-xs text-gray-500 mt-2">Registered voters</p>
        </Card>

        <Card className="border-l-4 border-green-500">
          <div className="text-4xl mb-4">🗳️</div>
          <p className="text-gray-600 mb-2 text-sm">Votes Cast</p>
          <p className="text-4xl font-bold text-gray-900">{stats?.totalVotes || 0}</p>
          <p className="text-xs text-gray-500 mt-2">Votes recorded</p>
        </Card>

        <Card className="border-l-4 border-purple-500">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-600 mb-2 text-sm">Turnout</p>
          <p className="text-4xl font-bold text-gray-900">{turnout}%</p>
          <p className="text-xs text-gray-500 mt-2">Voter participation</p>
        </Card>

        <Card className="border-l-4 border-orange-500">
          <div className="text-4xl mb-4">🎯</div>
          <p className="text-gray-600 mb-2 text-sm">Candidates</p>
          <p className="text-4xl font-bold text-gray-900">{stats?.totalCandidates || 0}</p>
          <p className="text-xs text-gray-500 mt-2">Running candidates</p>
        </Card>
      </div>

      {/* Election Status */}
      <Card>
        <h2 className="text-2xl font-bold mb-6">Election Status</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-gray-600 font-semibold">Status</span>
              <span className={`px-4 py-2 rounded-full font-semibold text-sm ${getStatusColor(stats?.electionStatus)}`}>
                {stats?.electionStatus?.charAt(0).toUpperCase() + stats?.electionStatus?.slice(1) || 'N/A'}
              </span>
            </div>

            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-gray-600 font-semibold">Time Remaining</span>
              <span className="font-semibold text-lg">
                {stats?.electionStatus === 'active' ? getTimeRemaining(stats?.endTime) : 'N/A'}
              </span>
            </div>

            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-gray-600 font-semibold">Start Time</span>
              <span className="font-semibold">
                {stats?.startTime ? new Date(stats.startTime).toLocaleString() : 'N/A'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-semibold">End Time</span>
              <span className="font-semibold">
                {stats?.endTime ? new Date(stats.endTime).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex flex-col justify-center">
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 font-semibold">Voter Participation</span>
                <span className="font-bold text-primary">{turnout}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all"
                  style={{ width: `${turnout}%` }}
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>{stats?.totalVotes || 0}</strong> out of <strong>{stats?.totalVoters || 0}</strong> voters have cast their votes.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
          <div className="text-3xl mb-3">👥</div>
          <h3 className="font-bold text-gray-900 mb-2">Manage Voters</h3>
          <p className="text-sm text-gray-600">Approve or reject voter registrations</p>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
          <div className="text-3xl mb-3">🎯</div>
          <h3 className="font-bold text-gray-900 mb-2">Manage Candidates</h3>
          <p className="text-sm text-gray-600">Add, edit, or remove candidates</p>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
          <div className="text-3xl mb-3">📋</div>
          <h3 className="font-bold text-gray-900 mb-2">View Audit Log</h3>
          <p className="text-sm text-gray-600">Check all votes and blockchain records</p>
        </Card>
      </div>
    </div>
  )
}
