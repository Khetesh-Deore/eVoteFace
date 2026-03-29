import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/common'

export const LandingPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to <span className="text-primary">eVoteFace</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Secure online voting system using face recognition and blockchain technology.
          Your vote matters. Your identity is protected.
        </p>
        <div className="flex gap-4 justify-center">
          {!user ? (
            <>
              <Button onClick={() => navigate('/login')} size="lg">
                Voter Login
              </Button>
              <Button onClick={() => navigate('/register')} variant="outline" size="lg">
                Register
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate('/dashboard')} size="lg">
              Go to Dashboard
            </Button>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="text-4xl mb-4">🔐</div>
          <h3 className="text-xl font-bold mb-2">Secure Authentication</h3>
          <p className="text-gray-600">
            Face recognition technology ensures only authorized voters can participate.
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="text-4xl mb-4">⛓️</div>
          <h3 className="text-xl font-bold mb-2">Blockchain Voting</h3>
          <p className="text-gray-600">
            Every vote is recorded on blockchain for immutability and transparency.
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-bold mb-2">Real-time Results</h3>
          <p className="text-gray-600">
            View live election results as votes are cast and verified.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white p-12 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold mb-8 text-center">How It Works</h2>
        <div className="grid md:grid-cols-5 gap-4">
          {[
            { step: 1, title: 'Login', desc: 'Enter your credentials' },
            { step: 2, title: 'Verify', desc: 'Face recognition check' },
            { step: 3, title: 'Vote', desc: 'Select your candidate' },
            { step: 4, title: 'Confirm', desc: 'Confirm your choice' },
            { step: 5, title: 'Receipt', desc: 'Get blockchain hash' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                {item.step}
              </div>
              <h4 className="font-semibold mb-2">{item.title}</h4>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Admin Section */}
      <section className="bg-gradient-to-r from-primary to-secondary p-12 rounded-lg text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold mb-2">Election Administrator?</h2>
            <p className="text-lg opacity-90">
              Manage voters, candidates, and monitor election results in real-time.
            </p>
          </div>
          <Button
            onClick={() => navigate('/admin/login')}
            variant="outline"
            size="lg"
            className="text-white border-white hover:bg-white/10"
          >
            Admin Login
          </Button>
        </div>
      </section>
    </div>
  )
}
