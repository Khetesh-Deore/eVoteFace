import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Remove old stats fetching since we don't have a single election anymore
    setStats(null);
  }, []);

  const steps = [
    { 
      icon: "🔗", 
      title: "Connect MetaMask", 
      desc: "Your Ethereum wallet serves as your unique blockchain identity. Only registered wallets can participate." 
    },
    { 
      icon: "📷", 
      title: "Face Verification", 
      desc: "Live facial biometric scan matched against your registered Aadhaar-linked photo using AI." 
    },
    { 
      icon: "📱", 
      title: "OTP Confirmation", 
      desc: "Secure one-time password sent to your registered mobile/email for final verification." 
    },
  ];

  const features = [
    { 
      icon: "⛓️", 
      title: "Blockchain Immutability", 
      desc: "Every vote is permanently recorded on Ethereum Sepolia. Tamper-proof and publicly verifiable." 
    },
    { 
      icon: "🔒", 
      title: "Triple Authentication", 
      desc: "MetaMask Wallet + Facial Biometrics + OTP — three layers of security against impersonation." 
    },
    { 
      icon: "👁️", 
      title: "Public Verifiability", 
      desc: "Any citizen can independently verify election results directly on the blockchain." 
    },
    { 
      icon: "🧠", 
      title: "AI Face Recognition", 
      desc: "Advanced 128-dimensional deep learning model ensures highest accuracy and security." 
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HERO SECTION */}
      <section className="bg-slate-950 text-white w-full" style={{ minHeight: 'calc(100vh - 48px)' }}>
        <div className="w-full h-full flex items-center justify-center px-8 py-16">
          <div className="max-w-3xl w-full text-center">
            <div className="inline-flex items-center gap-x-3 bg-white/10 backdrop-blur-md px-5 py-1.5 rounded-3xl text-xs mb-6 border border-white/20">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              OFFICIAL • POWERED BY ETHEREUM SEPOLIA
            </div>

            <h1 className="font-bold tracking-[-2px] leading-tight mb-5"
                style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}>
              Secure Voting.<br />
              <span className="text-emerald-400">Face Verified.</span>
            </h1>

            <p className="text-slate-300 max-w-xl mx-auto mb-8" style={{ fontSize: 'clamp(0.95rem, 1.5vw, 1.15rem)' }}>
              India's trusted decentralized voting platform combining facial biometrics,
              blockchain technology, and multi-factor authentication for transparent elections.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {user ? (
                <Link
                  to="/dashboard"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-3 rounded-3xl transition-all active:scale-95 flex items-center justify-center gap-x-2"
                >
                  Go to My Dashboard <span>→</span>
                </Link>
              ) : (
                <>
                  <Link to="/register" className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-3 rounded-3xl transition-all active:scale-95">
                    Register to Vote
                  </Link>
                  <Link to="/login" className="border border-white/50 hover:border-white text-white font-semibold px-8 py-3 rounded-3xl transition-all">
                    Voter Login
                  </Link>
                </>
              )}
              <Link to="/elections" className="border border-white/50 hover:border-white text-white font-semibold px-8 py-3 rounded-3xl transition-all">
                Browse Elections
              </Link>
            </div>

            <div className="mt-8 flex justify-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-1.5"><i className="fa-solid fa-shield-halved text-emerald-400"></i> End-to-End Encrypted</div>
              <div className="flex items-center gap-1.5"><i className="fa-solid fa-fingerprint text-emerald-400"></i> Biometric Secure</div>
              <div className="flex items-center gap-1.5"><i className="fa-solid fa-chain text-emerald-400"></i> Blockchain Verified</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-12 px-8 bg-white w-full">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-3xl text-xs font-semibold">3-STEP SECURE PROCESS</span>
            <h2 className="text-3xl font-semibold mt-3 tracking-tight">Three-Layer Authentication</h2>
            <p className="text-slate-600 mt-2 max-w-md mx-auto text-sm">Every vote must pass through all three security layers for maximum integrity.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {steps.map((step, index) => (
              <div key={step.title} className="bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-lg hover:border-emerald-200 transition-all">
                <div className="text-4xl mb-5">{step.icon}</div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-7 h-7 bg-emerald-500 text-white rounded-xl flex items-center justify-center font-bold text-sm">{index + 1}</div>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-12 px-8 bg-slate-50 w-full">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-emerald-600 font-medium text-xs">WHY CHOOSE eVOTEFACE</span>
            <h2 className="text-3xl font-semibold mt-2 tracking-tight">Built for Trust and Transparency</h2>
            <p className="text-slate-600 mt-2 text-sm">Inspired by IEEE research on secure voting systems</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white rounded-2xl p-5 flex gap-4 border border-slate-100 hover:shadow-md transition-all">
                <div className="text-4xl flex-shrink-0 mt-1">{feature.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold mb-1.5">{feature.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-12 px-8 bg-slate-950 text-white w-full">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-3">Ready to cast your vote securely?</h2>
          <p className="text-slate-400 text-sm mb-8">Join thousands of verified voters using face recognition and blockchain technology.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!user && (
              <Link to="/register" className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-10 py-3 rounded-3xl transition-all">
                Register Now
              </Link>
            )}
            <Link to="/elections" className="border border-white/40 hover:border-white text-white font-semibold px-10 py-3 rounded-3xl transition-all">
              Browse Active Elections
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
