import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Wallet, Camera, Mail, Shield, Eye, Link2, Bot } from 'lucide-react';

export default function Home() {
  const { user, isAdmin } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-sm">Powered by Ethereum Sepolia Blockchain</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold">
              <span className="text-[#e94560]">e</span>VoteFace
            </h1>
            
            <p className="text-2xl md:text-3xl text-gray-300">
              Decentralized Online Voting System
            </p>
            
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Secure, transparent, and tamper-proof elections using Face Recognition, 
              Blockchain Technology, and Multi-Factor Authentication.
            </p>

            <div className="flex flex-wrap gap-4 justify-center pt-6">
              {!user ? (
                <>
                  <Link
                    to="/register"
                    className="px-8 py-4 bg-[#e94560] hover:bg-[#d63651] text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Register to Vote
                  </Link>
                  <Link
                    to="/login"
                    className="px-8 py-4 border-2 border-white/30 hover:border-white/50 text-white rounded-lg font-semibold transition-all duration-200"
                  >
                    Voter Login
                  </Link>
                  <Link
                    to="/elections"
                    className="px-8 py-4 border-2 border-white/30 hover:border-white/50 text-white rounded-lg font-semibold transition-all duration-200"
                  >
                    Browse Elections
                  </Link>
                </>
              ) : isAdmin ? (
                <Link
                  to="/admin/dashboard"
                  className="px-8 py-4 bg-[#e94560] hover:bg-[#d63651] text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Go to Admin Dashboard →
                </Link>
              ) : (
                <>
                  <Link
                    to="/dashboard"
                    className="px-8 py-4 bg-[#e94560] hover:bg-[#d63651] text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Go to Dashboard →
                  </Link>
                  <Link
                    to="/elections"
                    className="px-8 py-4 border-2 border-white/30 hover:border-white/50 text-white rounded-lg font-semibold transition-all duration-200"
                  >
                    Browse Elections
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Three-Factor Authentication Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-[#1a1a2e] mb-4">
              Three-Factor Authentication
            </h2>
            <p className="text-gray-600 text-lg">
              Your vote is secured through multiple layers of verification
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Wallet,
                step: '1',
                title: 'Connect MetaMask',
                description: 'Your Ethereum wallet is your unique blockchain identity'
              },
              {
                icon: Camera,
                step: '2',
                title: 'Face Verification',
                description: 'Your live webcam image is matched against your registered face using AI biometrics'
              },
              {
                icon: Mail,
                step: '3',
                title: 'OTP Confirmation',
                description: 'A one-time password is sent to your registered email for final identity confirmation'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-[#e94560] hover:shadow-lg transition-all duration-300"
              >
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#e94560] text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                  {item.step}
                </div>
                <item.icon className="w-16 h-16 text-[#e94560] mb-4 mx-auto" />
                <h3 className="text-xl font-bold text-[#1a1a2e] mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#f5f5f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-[#1a1a2e] mb-4">
              Why eVoteFace?
            </h2>
            <p className="text-gray-600 text-lg">
              Built on IEEE research — ISE-Voting (April 2025)
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Link2,
                title: 'Blockchain Immutability',
                description: 'Votes are permanently recorded on Ethereum blockchain'
              },
              {
                icon: Shield,
                title: 'Triple Authentication',
                description: 'MetaMask + Face Recognition + OTP verification'
              },
              {
                icon: Eye,
                title: 'Public Verifiability',
                description: 'Anyone can verify election results on the blockchain'
              },
              {
                icon: Bot,
                title: 'AI Face Recognition',
                description: 'Advanced biometric matching prevents voter fraud'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <feature.icon className="w-12 h-12 text-[#e94560] mb-4" />
                <h3 className="text-lg font-bold text-[#1a1a2e] mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to participate?
            </h2>
            <p className="text-xl text-gray-300">
              Join thousands of voters using secure blockchain-based voting
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              {!user && (
                <Link
                  to="/register"
                  className="px-8 py-4 bg-[#e94560] hover:bg-[#d63651] text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Register Now
                </Link>
              )}
              <Link
                to="/elections"
                className="px-8 py-4 border-2 border-white/30 hover:border-white/50 text-white rounded-lg font-semibold transition-all duration-200"
              >
                Browse Elections
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
