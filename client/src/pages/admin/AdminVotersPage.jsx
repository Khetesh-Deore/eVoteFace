import { useState, useEffect } from 'react'
import { Card, Button, Alert, Loading } from '../../components/common'
import { adminService } from '../../services/adminService'

export const AdminVotersPage = () => {
  const [voters, setVoters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filter, setFilter] = useState('all') // all, pending, approved

  useEffect(() => {
    fetchVoters()
  }, [])

  const fetchVoters = async () => {
    try {
      setLoading(true)
      const response = await adminService.getVoters()
      setVoters(response.data)
    } catch (err) {
      setError('Failed to fetch voters')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveVoter = async (voterId) => {
    try {
      setError('')
      await adminService.approveVoter(voterId)
      setSuccess('Voter approved successfully')
      fetchVoters()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve voter')
    }
  }

  const handleRejectVoter = async (voterId) => {
    if (!window.confirm('Are you sure you want to reject this voter?')) return

    try {
      setError('')
      await adminService.rejectVoter(voterId)
      setSuccess('Voter rejected successfully')
      fetchVoters()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject voter')
    }
  }

  const filteredVoters = voters.filter((voter) => {
    if (filter === 'pending') return !voter.isApproved
    if (filter === 'approved') return voter.isApproved
    return true
  })

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">Manage Voters</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            All ({voters.length})
          </Button>
          <Button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded ${
              filter === 'pending'
                ? 'bg-primary text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Pending ({voters.filter((v) => !v.isApproved).length})
          </Button>
          <Button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded ${
              filter === 'approved'
                ? 'bg-primary text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Approved ({voters.filter((v) => v.isApproved).length})
          </Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Voter ID</th>
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Has Voted</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVoters.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">
                    No voters found
                  </td>
                </tr>
              ) : (
                filteredVoters.map((voter) => (
                  <tr key={voter._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">{voter.voterId}</td>
                    <td className="py-3 px-4 font-semibold">{voter.name}</td>
                    <td className="py-3 px-4">{voter.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          voter.isApproved
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {voter.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          voter.hasVoted
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {voter.hasVoted ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="py-3 px-4 space-x-2">
                      {!voter.isApproved && (
                        <>
                          <Button
                            onClick={() => handleApproveVoter(voter._id)}
                            className="bg-success hover:bg-success/90 text-white px-3 py-1 text-sm"
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleRejectVoter(voter._id)}
                            className="bg-danger hover:bg-danger/90 text-white px-3 py-1 text-sm"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {voter.isApproved && (
                        <Button
                          onClick={() => handleRejectVoter(voter._id)}
                          className="bg-danger hover:bg-danger/90 text-white px-3 py-1 text-sm"
                        >
                          Remove
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
