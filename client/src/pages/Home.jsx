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
      <section className="bg-slate-950 text-white hero-bg">
        <div className="max-w-screen-2xl mx-auto px-6 pt-20 pb-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-x-3 bg-white/10 backdrop-blur-md px-6 py-2 rounded-3xl text-sm mb-8 border border-white/20">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              OFFICIAL • POWERED BY ETHEREUM SEPOLIA
            </div>

            <h1 className="text-6xl md:text-7xl font-bold tracking-[-2px] leading-none mb-6" 
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Secure Voting.<br />
              <span className="text-emerald-400">Face Verified.</span>
            </h1>

            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
              India's trusted decentralized voting platform combining facial biometrics, 
              blockchain technology, and multi-factor authentication for transparent elections.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link 
                  to="/dashboard" 
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-lg px-10 py-4 rounded-3xl transition-all active:scale-95 flex items-center justify-center gap-x-3"
                >
                  Go to My Dashboard
                  <span>→</span>
                </Link>
              ) : (
                <>
                  <Link 
                    to="/register" 
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-lg px-10 py-4 rounded-3xl transition-all active:scale-95"
                  >
                    Register to Vote
                  </Link>
                  <Link 
                    to="/login" 
                    className="border border-white/50 hover:border-white text-white font-semibold text-lg px-10 py-4 rounded-3xl transition-all"
                  >
                    Voter Login
                  </Link>
                </>
              )}
              
              <Link 
                to="/elections" 
                className="border border-white/50 hover:border-white text-white font-semibold text-lg px-10 py-4 rounded-3xl transition-all"
              >
                Browse Elections
              </Link>
            </div>

            <div className="mt-12 flex justify-center gap-8 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-shield-halved text-emerald-400"></i>
                End-to-End Encrypted
              </div>
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-fingerprint text-emerald-400"></i>
                Biometric Secure
              </div>
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-chain text-emerald-400"></i>
                Blockchain Verified
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="px-5 py-2 bg-emerald-100 text-emerald-700 rounded-3xl text-sm font-semibold">3-STEP SECURE PROCESS</span>
            <h2 className="text-4xl font-semibold mt-4 tracking-tight">Three-Layer Authentication</h2>
            <p className="text-slate-600 mt-3 max-w-md mx-auto">
              Every vote must pass through all three security layers for maximum integrity.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div 
                key={step.title} 
                className="bg-white border border-slate-100 rounded-3xl p-10 hover:shadow-xl hover:border-emerald-200 transition-all card-hover"
              >
                <div className="text-5xl mb-8">{step.icon}</div>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-9 h-9 bg-emerald-500 text-white rounded-2xl flex items-center justify-center font-bold text-lg">
                    {index + 1}
                  </div>
                  <h3 className="text-2xl font-semibold">{step.title}</h3>
                </div>
                
                <p className="text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-emerald-600 font-medium">WHY CHOOSE eVOTEFACE</span>
            <h2 className="text-4xl font-semibold mt-3 tracking-tight">Built for Trust and Transparency</h2>
            <p className="text-slate-600 mt-3">Inspired by IEEE research on secure voting systems</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div 
                key={feature.title} 
                className="bg-white rounded-3xl p-8 flex gap-6 card-hover border border-slate-100"
              >
                <div className="text-5xl flex-shrink-0 mt-1">{feature.icon}</div>
                <div>
                  <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 px-6 bg-slate-950 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-semibold mb-4">Ready to cast your vote securely?</h2>
          <p className="text-slate-400 text-lg mb-10">
            Join thousands of verified voters using face recognition and blockchain technology.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user && (
              <Link 
                to="/register" 
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-lg px-12 py-4 rounded-3xl transition-all"
              >
                Register Now
              </Link>
            )}
            <Link 
              to="/elections" 
              className="border border-white/40 hover:border-white text-white font-semibold text-lg px-12 py-4 rounded-3xl transition-all"
            >
              Browse Active Elections
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}