import { useState, useEffect } from 'react'
import { Card, Button, Input, Alert, Loading } from '../../components/common'
import { adminService } from '../../services/adminService'
import { useForm } from '../../hooks/useForm'

export const AdminElectionPage = () => {
  const [election, setElection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showStartForm, setShowStartForm] = useState(false)

  const { values, handleChange, resetForm } = useForm({
    title: '',
    endTime: '',
  })

  useEffect(() => {
    fetchElection()
  }, [])

  const fetchElection = async () => {
    try {
      setLoading(true)
      const response = await adminService.getElection()
      setElection(response.data)
    } catch (err) {
      // Election might not exist yet
      setElection(null)
    } finally {
      setLoading(false)
    }
  }

  const handleStartElection = async (e) => {
    e.preventDefault()
    if (!values.title || !values.endTime) {
      setError('Title and end time are required')
      return
    }

    try {
      setError('')
      await adminService.startElection(values.title, values.endTime)
      setSuccess('Election started successfully')
      resetForm()
      setShowStartForm(false)
      fetchElection()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start election')
    }
  }

  const handleStopElection = async () => {
    if (!window.confirm('Are you sure you want to stop the election?')) return

    try {
      setError('')
      await adminService.stopElection()
      setSuccess('Election stopped successfully')
      fetchElection()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to stop election')
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

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Election Management</h1>

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      {!election || election.status === 'closed' ? (
        <Card>
          <h2 className="text-xl font-bold mb-4">No Active Election</h2>
          <p className="text-gray-600 mb-6">
            {election ? 'The current election has ended.' : 'No election is currently running.'}
          </p>
          <Button
            onClick={() => setShowStartForm(!showStartForm)}
            className="bg-primary hover:bg-primary/90"
          >
            {showStartForm ? 'Cancel' : 'Start New Election'}
          </Button>

          {showStartForm && (
            <form onSubmit={handleStartElection} className="mt-6 space-y-4">
              <Input
                label="Election Title"
                name="title"
                value={values.title}
                onChange={handleChange}
                placeholder="e.g., General Elections 2026"
                required
              />
              <Input
                label="End Time"
                name="endTime"
                type="datetime-local"
                value={values.endTime}
                onChange={handleChange}
                required
              />
              <div className="flex gap-4">
                <Button type="submit" className="bg-success hover:bg-success/90">
                  Start Election
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowStartForm(false)
                    resetForm()
                  }}
                  className="bg-gray-300 hover:bg-gray-400"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <h2 className="text-2xl font-bold mb-6">{election.title}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-600 mb-2">Status</p>
                <p className="text-2xl font-bold">
                  <span
                    className={`px-4 py-2 rounded-full ${
                      election.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {election.status.charAt(0).toUpperCase() + election.status.slice(1)}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-2">Time Remaining</p>
                <p className="text-2xl font-bold">
                  {election.status === 'active' ? getTimeRemaining(election.endTime) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-2">Start Time</p>
                <p className="font-semibold">
                  {new Date(election.startTime).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-2">End Time</p>
                <p className="font-semibold">
                  {new Date(election.endTime).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          {election.status === 'active' && (
            <Card>
              <h3 className="text-lg font-bold mb-4">Election Controls</h3>
              <Button
                onClick={handleStopElection}
                className="bg-danger hover:bg-danger/90 text-white"
              >
                Stop Election
              </Button>
            </Card>
          )}

          <Card>
            <h3 className="text-lg font-bold mb-4">Election Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Election ID</span>
                <span className="font-mono text-sm">{election._id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created At</span>
                <span>{new Date(election.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated</span>
                <span>{new Date(election.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
