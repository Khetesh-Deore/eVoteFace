import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/common'

export const LandingPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 -z-10" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            {/* Logo/Title */}
            <div className="space-y-4">
              <div className="inline-block">
                <div className="text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                  eVoteFace
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                Secure Digital Voting
              </h1>
            </div>

            {/* Tagline */}
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Experience the future of elections with <span className="font-semibold text-primary">face recognition</span> authentication and <span className="font-semibold text-primary">blockchain</span> transparency. Your vote is secure. Your identity is protected.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              {!user ? (
                <>
                  <Button
                    onClick={() => navigate('/login')}
                    className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    🗳️ Voter Login
                  </Button>
                  <Button
                    onClick={() => navigate('/register')}
                    className="bg-white hover:bg-gray-50 text-primary border-2 border-primary px-8 py-3 text-lg font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                  >
                    📝 Register to Vote
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Go to Dashboard
                </Button>
              )}
            </div>

            {/* Admin Quick Access */}
            <div className="pt-4">
              <p className="text-gray-600 mb-3">Are you an election administrator?</p>
              <Button
                onClick={() => navigate('/admin/login')}
                className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-semibold transition-all"
              >
                🔐 Admin Login
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose eVoteFace?</h2>
            <p className="text-xl text-gray-600">Advanced security meets democratic principles</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 rounded-xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
              <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform">🔐</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Face Recognition</h3>
              <p className="text-gray-600 leading-relaxed">
                Advanced biometric authentication using DeepFace technology ensures only authorized voters can participate. Anti-spoofing detection prevents fraud.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
              <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform">⛓️</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Blockchain Verified</h3>
              <p className="text-gray-600 leading-relaxed">
                Every vote is immutably recorded on Polygon blockchain. Transparent, tamper-proof, and verifiable by anyone. Complete audit trail.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
              <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform">📊</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Real-time Results</h3>
              <p className="text-gray-600 leading-relaxed">
                Live election results dashboard with instant vote counting. Transparent vote distribution and turnout statistics.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-8 rounded-xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
              <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform">🛡️</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Privacy Protected</h3>
              <p className="text-gray-600 leading-relaxed">
                Your personal data is encrypted and secure. Vote anonymity is maintained while ensuring one person, one vote.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-8 rounded-xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
              <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform">⚡</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Fast & Reliable</h3>
              <p className="text-gray-600 leading-relaxed">
                Instant vote processing with sub-second blockchain confirmation. Scalable infrastructure for large elections.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-8 rounded-xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
              <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform">📱</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Web-Based Access</h3>
              <p className="text-gray-600 leading-relaxed">
                Vote from any device with a webcam. Responsive design works seamlessly on desktop, tablet, and mobile.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple, secure, and transparent voting process</p>
          </div>

          <div className="grid md:grid-cols-5 gap-6">
            {[
              { step: 1, icon: '📝', title: 'Register', desc: 'Create your voter account' },
              { step: 2, icon: '🔐', title: 'Verify', desc: 'Face recognition check' },
              { step: 3, icon: '🗳️', title: 'Vote', desc: 'Select your candidate' },
              { step: 4, icon: '✅', title: 'Confirm', desc: 'Confirm your choice' },
              { step: 5, icon: '📜', title: 'Receipt', desc: 'Get blockchain hash' },
            ].map((item, idx) => (
              <div key={item.step} className="relative">
                {/* Connector Line */}
                {idx < 4 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-1 bg-gradient-to-r from-primary to-transparent -z-10" />
                )}

                {/* Card */}
                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-center">
                  <div className="text-5xl mb-4">{item.icon}</div>
                  <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                    {item.step}
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Highlights */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Enterprise-Grade Security</h2>
              <ul className="space-y-4">
                {[
                  'End-to-end encryption for all communications',
                  'Multi-factor authentication with biometrics',
                  'Immutable blockchain voting records',
                  'Anti-spoofing and liveness detection',
                  'Rate limiting and DDoS protection',
                  'Regular security audits and compliance',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-primary font-bold text-xl mt-1">✓</span>
                    <span className="text-gray-700 text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-12 rounded-xl border border-primary/20">
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-3xl font-bold text-primary mb-2">99.9%</div>
                  <p className="text-gray-600">Uptime Guarantee</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-3xl font-bold text-primary mb-2">&lt;1s</div>
                  <p className="text-gray-600">Vote Processing Time</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-3xl font-bold text-primary mb-2">256-bit</div>
                  <p className="text-gray-600">Encryption Standard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">For Election Administrators</h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Powerful admin dashboard to manage voters, candidates, and monitor elections in real-time. Complete control with comprehensive audit logs.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Voter registration and approval workflow',
                  'Candidate management and configuration',
                  'Real-time election monitoring',
                  'Live results dashboard',
                  'Complete audit trail and reports',
                  'Election start/stop controls',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <span className="text-primary font-bold">→</span>
                    <span className="text-gray-200">{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => navigate('/admin/login')}
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                🔐 Admin Login
              </Button>
            </div>
            <div className="bg-gradient-to-br from-primary/20 to-secondary/20 p-12 rounded-xl border border-primary/30">
              <div className="space-y-4">
                <div className="bg-gray-800/50 p-6 rounded-lg backdrop-blur">
                  <div className="text-2xl font-bold text-primary mb-2">Dashboard</div>
                  <p className="text-gray-300 text-sm">Real-time statistics and metrics</p>
                </div>
                <div className="bg-gray-800/50 p-6 rounded-lg backdrop-blur">
                  <div className="text-2xl font-bold text-primary mb-2">Voter Management</div>
                  <p className="text-gray-300 text-sm">Approve and manage registrations</p>
                </div>
                <div className="bg-gray-800/50 p-6 rounded-lg backdrop-blur">
                  <div className="text-2xl font-bold text-primary mb-2">Audit Logs</div>
                  <p className="text-gray-300 text-sm">Complete voting records with blockchain hashes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to Vote?</h2>
          <p className="text-xl text-gray-600 mb-10">
            Join the future of secure, transparent, and democratic voting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user ? (
              <>
                <Button
                  onClick={() => navigate('/login')}
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  🗳️ Voter Login
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-8 py-3 text-lg font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  📝 Register Now
                </Button>
              </>
            ) : (
              <Button
                onClick={() => navigate('/dashboard')}
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                Go to Dashboard
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="py-12 bg-gray-900 text-gray-400 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4">eVoteFace</h3>
              <p className="text-sm">Secure digital voting platform powered by face recognition and blockchain.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Face Recognition</a></li>
                <li><a href="#" className="hover:text-white transition">Blockchain</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Users</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Voter Login</a></li>
                <li><a href="#" className="hover:text-white transition">Register</a></li>
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Admin</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Admin Login</a></li>
                <li><a href="#" className="hover:text-white transition">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 eVoteFace. All rights reserved. Secure voting for a better democracy.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
