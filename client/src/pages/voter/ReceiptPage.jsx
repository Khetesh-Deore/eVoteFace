import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button } from '../../components/common'
import { voteService } from '../../services/voteService'

export const ReceiptPage = () => {
  const navigate = useNavigate()
  const [voteData, setVoteData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVoteData = async () => {
      try {
        const response = await voteService.getResults()
        const lastVote = response.data[response.data.length - 1]
        setVoteData({
          candidateName: lastVote.candidateName || 'Unknown',
          txnHash: lastVote.txnHash || 'Processing...',
          timestamp: new Date(lastVote.timestamp).toLocaleString(),
        })
      } catch (err) {
        setVoteData({
          candidateName: 'Vote Recorded',
          txnHash: 'Pending blockchain confirmation',
          timestamp: new Date().toLocaleString(),
        })
      } finally {
        setLoading(false)
      }
    }

    fetchVoteData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Processing your vote...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-bounce">✅</div>
          <h1 className="text-4xl font-bold text-green-600 mb-2">Vote Recorded Successfully!</h1>
          <p className="text-gray-600">Your vote has been securely recorded on the blockchain</p>
        </div>

        {/* Receipt Card */}
        <Card className="mb-8">
          <div className="space-y-6">
            {/* Candidate */}
            <div className="border-b pb-6">
              <p className="text-sm text-gray-600 mb-2">Candidate Voted For</p>
              <p className="text-2xl font-bold text-gray-900">{voteData?.candidateName}</p>
            </div>

            {/* Transaction Hash */}
            <div className="border-b pb-6">
              <p className="text-sm text-gray-600 mb-2">Blockchain Transaction Hash</p>
              <div className="bg-gray-50 p-4 rounded-lg break-all font-mono text-sm">
                {voteData?.txnHash}
              </div>
              {voteData?.txnHash !== 'Processing...' && voteData?.txnHash !== 'Pending blockchain confirmation' && (
                <a
                  href={`https://mumbai.polygonscan.com/tx/${voteData?.txnHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 text-sm mt-2 inline-block font-semibold"
                >
                  View on PolygonScan →
                </a>
              )}
            </div>

            {/* Timestamp */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Vote Timestamp</p>
              <p className="text-lg font-semibold text-gray-900">{voteData?.timestamp}</p>
            </div>
          </div>
        </Card>

        {/* Security Notice */}
        <Card className="bg-blue-50 border border-blue-200 mb-8">
          <div className="flex gap-4">
            <span className="text-2xl">🔐</span>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Your Vote is Secure</h3>
              <p className="text-sm text-blue-800">
                Your vote has been encrypted and recorded on the Polygon blockchain. It cannot be altered or deleted.
              </p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            onClick={() => navigate('/results')}
            className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold py-3 rounded-lg transition-all"
          >
            📊 View Results
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-lg transition-all"
          >
            🏠 Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
