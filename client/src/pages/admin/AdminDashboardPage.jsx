import { Card } from '../../components/common'

export const AdminDashboardPage = () => {
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-8 rounded-lg">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-lg opacity-90 mt-2">
          Manage election, voters, and candidates
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: 'Total Voters', value: '1,234', icon: '👥' },
          { label: 'Votes Cast', value: '856', icon: '🗳️' },
          { label: 'Turnout', value: '69.4%', icon: '📊' },
          { label: 'Candidates', value: '5', icon: '🎯' },
        ].map((stat) => (
          <Card key={stat.label}>
            <div className="text-4xl mb-4">{stat.icon}</div>
            <p className="text-gray-600 mb-2">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="text-2xl font-bold mb-4">Election Status</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Status</span>
            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold">
              Active
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Time Remaining</span>
            <span className="font-semibold">2 hours 30 minutes</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Start Time</span>
            <span className="font-semibold">2026-03-29 10:00 AM</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">End Time</span>
            <span className="font-semibold">2026-03-29 06:00 PM</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
