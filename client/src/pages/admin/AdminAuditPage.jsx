import { useState, useEffect } from 'react'
import { Card, Button, Alert, Loading } from '../../components/common'
import { adminService } from '../../services/adminService'

export const AdminAuditPage = () => {
  const [auditLog, setAuditLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('timestamp') // timestamp, voterId, candidateId

  useEffect(() => {
    fetchAuditLog()
  }, [])

  const fetchAuditLog = async () => {
    try {
      setLoading(true)
      const response = await adminService.getAuditLog()
      setAuditLog(response.data)
    } catch (err) {
      setError('Failed to fetch audit log')
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    const headers = ['Voter ID', 'Candidate ID', 'Candidate Name', 'Transaction Hash', 'Timestamp']
    const rows = auditLog.map((vote) => [
      vote.voterId,
      vote.candidateId,
      vote.candidateName || 'N/A',
      vote.txnHash || 'Pending',
      new Date(vote.timestamp).toLocaleString(),
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getSortedData = () => {
    const sorted = [...auditLog]
    if (sortBy === 'timestamp') {
      sorted.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    } else if (sortBy === 'voterId') {
      sorted.sort((a, b) => a.voterId.localeCompare(b.voterId))
    } else if (sortBy === 'candidateId') {
      sorted.sort((a, b) => a.candidateId.localeCompare(b.candidateId))
    }
    return sorted
  }

  if (loading) return <Loading />

  const sortedData = getSortedData()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Audit Log</h1>
        <Button
          onClick={handleExportCSV}
          className="bg-primary hover:bg-primary/90"
        >
          📥 Export as CSV
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}

      <Card>
        <div className="mb-4 flex gap-2">
          <span className="text-gray-600 font-semibold">Sort by:</span>
          <Button
            onClick={() => setSortBy('timestamp')}
            className={`px-3 py-1 text-sm rounded ${
              sortBy === 'timestamp'
                ? 'bg-primary text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Timestamp
          </Button>
          <Button
            onClick={() => setSortBy('voterId')}
            className={`px-3 py-1 text-sm rounded ${
              sortBy === 'voterId'
                ? 'bg-primary text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Voter ID
          </Button>
          <Button
            onClick={() => setSortBy('candidateId')}
            className={`px-3 py-1 text-sm rounded ${
              sortBy === 'candidateId'
                ? 'bg-primary text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Candidate
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Voter ID</th>
                <th className="text-left py-3 px-4">Candidate</th>
                <th className="text-left py-3 px-4">Transaction Hash</th>
                <th className="text-left py-3 px-4">Timestamp</th>
                <th className="text-left py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">
                    No votes recorded yet
                  </td>
                </tr>
              ) : (
                sortedData.map((vote, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs">
                      {vote.voterId.substring(0, 8)}...
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold">{vote.candidateName || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{vote.candidateId}</div>
                    </td>
                    <td className="py-3 px-4">
                      {vote.txnHash ? (
                        <a
                          href={`https://mumbai.polygonscan.com/tx/${vote.txnHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-mono text-xs"
                        >
                          {vote.txnHash.substring(0, 10)}...
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {new Date(vote.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          vote.txnHash
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {vote.txnHash ? 'Confirmed' : 'Processing'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600">
            Total votes: <span className="font-bold">{sortedData.length}</span>
          </p>
          <p className="text-sm text-gray-600">
            Confirmed on blockchain:{' '}
            <span className="font-bold">
              {sortedData.filter((v) => v.txnHash).length}
            </span>
          </p>
        </div>
      </Card>
    </div>
  )
}
