import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/votes/results").then(r => setStats(r.data)).catch(() => {});
  }, []);

  const steps = [
    { icon: "🦊", title: "Connect MetaMask", desc: "Your Ethereum wallet is your unique blockchain identity. Only registered wallets can vote." },
    { icon: "📷", title: "Face Verification", desc: "Your live webcam image is matched against your registered face using AI biometrics." },
    { icon: "📧", title: "OTP Confirmation", desc: "A one-time password is sent to your registered email for final identity confirmation." },
  ];

  const features = [
    { icon: "⛓️", title: "Blockchain Immutability", desc: "Every vote is permanently recorded on Ethereum. No one can alter or delete it." },
    { icon: "🔒", title: "Triple Authentication", desc: "Wallet + Face + OTP ensures only the rightful voter can cast a vote." },
    { icon: "👁️", title: "Public Verifiability", desc: "Anyone can verify results directly on the blockchain — no trust required." },
    { icon: "🤖", title: "AI Face Recognition", desc: "128-dimensional face encoding using deep learning prevents impersonation." },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-primary text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-sm mb-6">
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
            Powered by Ethereum Sepolia Blockchain
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            <span className="text-accent">e</span>VoteFace
          </h1>
          <p className="text-xl text-blue-200 mb-2">Decentralized Online Voting System</p>
          <p className="text-blue-300 text-sm mb-8 max-w-xl mx-auto">
            Secure, transparent, and tamper-proof elections using Face Recognition,
            Blockchain Technology, and Multi-Factor Authentication.
          </p>

          {/* Live stats */}
          {stats && (
            <div className="flex justify-center gap-6 mb-8 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">{stats.totalVotes}</div>
                <div className="text-blue-300">Votes Cast</div>
              </div>
              <div className="w-px bg-white/20" />
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">{stats.candidates?.length}</div>
                <div className="text-blue-300">Candidates</div>
              </div>
              <div className="w-px bg-white/20" />
              <div className="text-center">
                <div className={`text-2xl font-bold ${stats.phase === "Voting" ? "text-green-400" : "text-accent"}`}>
                  {stats.phase}
                </div>
                <div className="text-blue-300">Phase</div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <Link to="/dashboard" className="bg-accent text-white px-8 py-3 rounded font-semibold hover:bg-orange-700 transition-colors">
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/register" className="bg-accent text-white px-8 py-3 rounded font-semibold hover:bg-orange-700 transition-colors">
                  Register to Vote
                </Link>
                <Link to="/login" className="bg-white/10 text-white border border-white/30 px-8 py-3 rounded font-semibold hover:bg-white/20 transition-colors">
                  Voter Login
                </Link>
              </>
            )}
            <Link to="/results" className="bg-white/10 text-white border border-white/30 px-8 py-3 rounded font-semibold hover:bg-white/20 transition-colors">
              View Results
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-primary">Three-Factor Authentication</h2>
            <p className="text-gray-500 text-sm mt-2">Every vote requires passing all three security layers</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div key={s.title} className="text-center p-6 rounded-lg border border-gray-100 hover:border-primary hover:shadow-sm transition-all">
                <div className="text-4xl mb-3">{s.icon}</div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="w-6 h-6 bg-primary text-white rounded-full text-xs flex items-center justify-center font-bold">{i + 1}</span>
                  <h3 className="font-semibold text-dark">{s.title}</h3>
                </div>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-14 px-4 bg-muted">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-primary">Why eVoteFace?</h2>
            <p className="text-gray-500 text-sm mt-2">Built on IEEE research — ISE-Voting (April 2025)</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {features.map((f) => (
              <div key={f.title} className="card flex gap-4">
                <span className="text-3xl">{f.icon}</span>
                <div>
                  <h3 className="font-semibold text-dark mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4 bg-primary text-white text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to participate?</h2>
        <p className="text-blue-200 text-sm mb-6">Register your voter account and cast your vote securely.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {!user && (
            <Link to="/register" className="bg-accent text-white px-8 py-3 rounded font-semibold hover:bg-orange-700 transition-colors">
              Register Now
            </Link>
          )}
          <Link to="/results" className="bg-white/10 border border-white/30 text-white px-8 py-3 rounded font-semibold hover:bg-white/20 transition-colors">
            View Live Results
          </Link>
        </div>
      </section>
    </div>
  );
}
