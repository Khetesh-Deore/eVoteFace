import { useState, useEffect } from 'react'
import { Card, Button, Input, Alert, Loading } from '../../components/common'
import { adminService } from '../../services/adminService'
import { useForm } from '../../hooks/useForm'

export const AdminCandidatesPage = () => {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const { values, handleChange, resetForm } = useForm({
    name: '',
    party: '',
    partySymbol: '',
  })

  useEffect(() => {
    fetchCandidates()
  }, [])

  const fetchCandidates = async () => {
    try {
      setLoading(true)
      // Note: This endpoint needs to be created in backend
      // For now, we'll use a placeholder
      setCandidates([
        { id: '1', name: 'Candidate A', party: 'Party A', partySymbol: '🔶', voteCount: 0 },
        { id: '2', name: 'Candidate B', party: 'Party B', partySymbol: '🔷', voteCount: 0 },
      ])
    } catch (err) {
      setError('Failed to fetch candidates')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCandidate = async (e) => {
    e.preventDefault()
    if (!values.name || !values.party || !values.partySymbol) {
      setError('All fields are required')
      return
    }

    try {
      setError('')
      await adminService.addCandidate(values.name, values.party, values.partySymbol)
      setSuccess('Candidate added successfully')
      resetForm()
      setShowForm(false)
      fetchCandidates()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add candidate')
    }
  }

  const handleUpdateCandidate = async (e) => {
    e.preventDefault()
    try {
      setError('')
      await adminService.updateCandidate(editingId, {
        name: values.name,
        party: values.party,
        partySymbol: values.partySymbol,
      })
      setSuccess('Candidate updated successfully')
      resetForm()
      setEditingId(null)
      setShowForm(false)
      fetchCandidates()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update candidate')
    }
  }

  const handleDeleteCandidate = async (candidateId) => {
    if (!window.confirm('Are you sure you want to delete this candidate?')) return

    try {
      setError('')
      await adminService.deleteCandidate(candidateId)
      setSuccess('Candidate deleted successfully')
      fetchCandidates()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete candidate')
    }
  }

  const handleEdit = (candidate) => {
    handleChange({ target: { name: 'name', value: candidate.name } })
    handleChange({ target: { name: 'party', value: candidate.party } })
    handleChange({ target: { name: 'partySymbol', value: candidate.partySymbol } })
    setEditingId(candidate.id)
    setShowForm(true)
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Candidates</h1>
        <Button
          onClick={() => {
            resetForm()
            setEditingId(null)
            setShowForm(!showForm)
          }}
          className="bg-primary hover:bg-primary/90"
        >
          {showForm ? 'Cancel' : '+ Add Candidate'}
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      {showForm && (
        <Card>
          <h2 className="text-xl font-bold mb-4">
            {editingId ? 'Edit Candidate' : 'Add New Candidate'}
          </h2>
          <form onSubmit={editingId ? handleUpdateCandidate : handleAddCandidate} className="space-y-4">
            <Input
              label="Candidate Name"
              name="name"
              value={values.name}
              onChange={handleChange}
              placeholder="Enter candidate name"
              required
            />
            <Input
              label="Party Name"
              name="party"
              value={values.party}
              onChange={handleChange}
              placeholder="Enter party name"
              required
            />
            <Input
              label="Party Symbol"
              name="partySymbol"
              value={values.partySymbol}
              onChange={handleChange}
              placeholder="Enter party symbol (emoji or text)"
              required
            />
            <div className="flex gap-4">
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                {editingId ? 'Update' : 'Add'} Candidate
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  resetForm()
                }}
                className="bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <h2 className="text-xl font-bold mb-4">Candidates List</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Symbol</th>
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Party</th>
                <th className="text-left py-3 px-4">Votes</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-2xl">{candidate.partySymbol}</td>
                  <td className="py-3 px-4 font-semibold">{candidate.name}</td>
                  <td className="py-3 px-4">{candidate.party}</td>
                  <td className="py-3 px-4">{candidate.voteCount}</td>
                  <td className="py-3 px-4 space-x-2">
                    <Button
                      onClick={() => handleEdit(candidate)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-sm"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteCandidate(candidate.id)}
                      className="bg-danger hover:bg-danger/90 text-white px-3 py-1 text-sm"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
