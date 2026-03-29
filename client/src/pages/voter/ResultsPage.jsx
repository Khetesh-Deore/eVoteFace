import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Card, Button, Loading, Alert } from '../../components/common'
import { voteService } from '../../services/voteService'

export const ResultsPage = () => {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchResults()
    const interval = autoRefresh ? setInterval(fetchResults, 5000) : null
    return () => clearInterval(interval)
  }, [autoRefresh])

  const fetchResults = async () => {
    try {
      const response = await voteService.getResults()
      setResults(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch results')
    } finally {
      setLoading(false)
    }
  }

  const totalVotes = results.reduce((sum, candidate) => sum + (candidate.voteCount || 0), 0)

  const chartData = results.map((candidate) => ({
    name: candidate.name,
    votes: candidate.voteCount || 0,
    percentage: totalVotes > 0 ? ((candidate.voteCount || 0) / totalVotes * 100).toFixed(1) : 0,
  }))

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Election Results</h1>
          <p className="text-gray-600">Live voting results</p>
        </div>

        {error && <Alert type="error" message={error} className="mb-6" />}

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <p className="text-gray-600 mb-2">Total Votes</p>
            <p className="text-4xl font-bold text-primary">{totalVotes}</p>
          </Card>
          <Card>
            <p className="text-gray-600 mb-2">Candidates</p>
            <p className="text-4xl font-bold text-primary">{results.length}</p>
          </Card>
          <Card>
            <p className="text-gray-600 mb-2">Leading Candidate</p>
            <p className="text-2xl font-bold text-primary">
              {results.length > 0 ? results.reduce((max, c) => (c.voteCount > max.voteCount ? c : max)).name : 'N/A'}
            </p>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Bar Chart */}
          <Card>
            <h2 className="text-xl font-bold mb-4">Vote Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="votes" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Pie Chart */}
          <Card>
            <h2 className="text-xl font-bold mb-4">Vote Percentage</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="votes"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Detailed Results Table */}
        <Card>
          <h2 className="text-xl font-bold mb-4">Detailed Results</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Candidate</th>
                  <th className="text-left py-3 px-4">Party</th>
                  <th className="text-left py-3 px-4">Votes</th>
                  <th className="text-left py-3 px-4">Percentage</th>
                  <th className="text-left py-3 px-4">Progress</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((candidate, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold">{candidate.name}</td>
                    <td className="py-3 px-4">{results[index]?.party || 'N/A'}</td>
                    <td className="py-3 px-4 font-bold text-primary">{candidate.votes}</td>
                    <td className="py-3 px-4">{candidate.percentage}%</td>
                    <td className="py-3 px-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${candidate.percentage}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Refresh Control */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`${
              autoRefresh
                ? 'bg-primary hover:bg-primary/90 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            } font-semibold py-2 px-6 rounded-lg transition-all`}
          >
            {autoRefresh ? '⏸️ Stop Auto-Refresh' : '▶️ Start Auto-Refresh'}
          </Button>
        </div>
      </div>
    </div>
  )
}
