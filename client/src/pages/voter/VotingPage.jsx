import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Alert, Loading } from '../../components/common'
import { voteService } from '../../services/voteService'

export const VotingPage = () => {
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  useEffect(() => {
    fetchCandidates()
  }, [])

  const fetchCandidates = async () => {
    try {
      setLoading(true)
      const response = await voteService.getCandidates()
      setCandidates(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch candidates')
    } finally {
      setLoading(false)
    }
  }

  const handleVoteClick = (candidate) => {
    setSelectedCandidate(candidate)
    setShowConfirmation(true)
  }

  const handleConfirmVote = async () => {
    if (!selectedCandidate) return

    try {
      setVoting(true)
      setError('')
      await voteService.castVote(selectedCandidate._id)
      setSuccess('Vote cast successfully!')
      setShowConfirmation(false)
      setTimeout(() => navigate('/receipt'), 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cast vote')
      setShowConfirmation(false)
    } finally {
      setVoting(false)
    }
  }

  const handleCancel = () => {
    setSelectedCandidate(null)
    setShowConfirmation(false)
  }

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Cast Your Vote</h1>
          <p className="text-gray-600 text-lg">Select a candidate and confirm your vote</p>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} className="mb-6" />}
        {success && <Alert type="success" message={success} className="mb-6" />}

        {/* Candidates Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {candidates.map((candidate) => (
            <Card
              key={candidate._id}
              className={`cursor-pointer transition-all transform hover:scale-105 ${
                selectedCandidate?._id === candidate._id
                  ? 'ring-2 ring-primary shadow-lg'
                  : 'hover:shadow-lg'
              }`}
            >
              <div className="text-center">
                {/* Party Symbol */}
                <div className="text-6xl mb-4">{candidate.partySymbol}</div>

                {/* Candidate Name */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {candidate.name}
                </h3>

                {/* Party Name */}
                <p className="text-gray-600 mb-4 font-semibold">
                  {candidate.party}
                </p>

                {/* Vote Count */}
                <div className="bg-gray-100 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-600">Current Votes</p>
                  <p className="text-2xl font-bold text-primary">
                    {candidate.voteCount || 0}
                  </p>
                </div>

                {/* Vote Button */}
                <Button
                  onClick={() => handleVoteClick(candidate)}
                  disabled={voting}
                  className={`w-full font-semibold py-2 rounded-lg transition-all ${
                    selectedCandidate?._id === candidate._id
                      ? 'bg-primary hover:bg-primary/90 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                >
                  {selectedCandidate?._id === candidate._id ? '✓ Selected' : '🗳️ Vote'}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* No Candidates */}
        {candidates.length === 0 && !loading && (
          <Card className="text-center py-12">
            <p className="text-gray-600 text-lg">No candidates available</p>
          </Card>
        )}

        {/* Confirmation Modal */}
        {showConfirmation && selectedCandidate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full">
              <div className="text-center">
                <div className="text-5xl mb-4">{selectedCandidate.partySymbol}</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Confirm Your Vote
                </h2>
                <p className="text-gray-600 mb-6">
                  You are about to vote for <strong>{selectedCandidate.name}</strong> from{' '}
                  <strong>{selectedCandidate.party}</strong>
                </p>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-900">
                    ⚠️ This action cannot be undone. You can only vote once.
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={handleConfirmVote}
                    disabled={voting}
                    className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold py-2 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {voting ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Voting...
                      </>
                    ) : (
                      <>✅ Confirm Vote</>
                    )}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    disabled={voting}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 rounded-lg transition-all disabled:opacity-50"
                  >
                    ✕ Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
