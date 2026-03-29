import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button, Card } from '../../components/common'

export const DashboardPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-8 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name}!</h1>
        <p className="text-lg opacity-90">
          You're ready to cast your vote. Follow the steps below to participate in the election.
        </p>
      </div>

      {/* Voting Steps */}
      <div className="grid md:grid-cols-3 gap-6">
        {[
          {
            step: 1,
            title: 'Face Verification',
            desc: 'Verify your identity using face recognition',
            action: 'Verify',
            path: '/verify',
            completed: false,
          },
          {
            step: 2,
            title: 'Cast Your Vote',
            desc: 'Select your preferred candidate',
            action: 'Vote',
            path: '/vote',
            completed: false,
          },
          {
            step: 3,
            title: 'Get Receipt',
            desc: 'Receive your blockchain transaction hash',
            action: 'View',
            path: '/receipt',
            completed: false,
          },
        ].map((item) => (
          <Card key={item.step}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                {item.step}
              </div>
              {item.completed && <span className="text-green-600 text-2xl">✓</span>}
            </div>
            <h3 className="text-xl font-bold mb-2">{item.title}</h3>
            <p className="text-gray-600 mb-6">{item.desc}</p>
            <Button
              onClick={() => navigate(item.path)}
              className="w-full"
            >
              {item.action}
            </Button>
          </Card>
        ))}
      </div>

      {/* Election Info */}
      <Card>
        <h2 className="text-2xl font-bold mb-4">Election Information</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-600 mb-2">Election Status</p>
            <p className="text-2xl font-bold text-green-600">Active</p>
          </div>
          <div>
            <p className="text-gray-600 mb-2">Time Remaining</p>
            <p className="text-2xl font-bold">2 hours 30 minutes</p>
          </div>
          <div>
            <p className="text-gray-600 mb-2">Total Candidates</p>
            <p className="text-2xl font-bold">5</p>
          </div>
          <div>
            <p className="text-gray-600 mb-2">Your Status</p>
            <p className="text-2xl font-bold text-blue-600">Not Voted</p>
          </div>
        </div>
      </Card>

      {/* Quick Links */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-bold mb-4">View Results</h3>
          <p className="text-gray-600 mb-4">
            Check live election results as votes are being cast.
          </p>
          <Button
            onClick={() => navigate('/results')}
            variant="outline"
            className="w-full"
          >
            View Results
          </Button>
        </Card>

        <Card>
          <h3 className="text-lg font-bold mb-4">Need Help?</h3>
          <p className="text-gray-600 mb-4">
            Contact support if you have any questions or issues.
          </p>
          <Button
            variant="outline"
            className="w-full"
          >
            Contact Support
          </Button>
        </Card>
      </div>
    </div>
  )
}
