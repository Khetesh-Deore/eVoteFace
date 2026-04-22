export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400">
      <div className="max-w-screen-2xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-x-8 gap-y-12">
          
          {/* Brand Column */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-x-3 mb-6">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center">
                <i className="fa-solid fa-fingerprint text-white text-xl"></i>
              </div>
              <span className="font-bold text-3xl tracking-[-1px] text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                eVoteface
              </span>
            </div>
            
            <p className="text-slate-300 max-w-md">
              India's most secure digital voting platform. 
              Face biometric authentication • Blockchain immutability • 
              Complete transparency for every citizen.
            </p>

            <div className="flex items-center gap-x-6 mt-8 text-sm">
              <div className="flex items-center gap-1.5">
                <i className="fa-solid fa-shield-halved text-emerald-500"></i>
                <span>ISO 27001</span>
              </div>
              <div className="flex items-center gap-1.5">
                <i className="fa-solid fa-fingerprint text-emerald-500"></i>
                <span>Aadhaar Verified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <i className="fa-solid fa-chain text-emerald-500"></i>
                <span>Blockchain Secured</span>
              </div>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <div className="font-semibold text-white mb-5 text-sm tracking-wider">PLATFORM</div>
            <div className="space-y-3 text-sm">
              <a href="/elections" className="block hover:text-white transition-colors">Active Elections</a>
              <a href="/dashboard" className="block hover:text-white transition-colors">Voter Dashboard</a>
              <a href="#" className="block hover:text-white transition-colors">How It Works</a>
              <a href="#" className="block hover:text-white transition-colors">Live Results</a>
            </div>
          </div>

          {/* Resources */}
          <div>
            <div className="font-semibold text-white mb-5 text-sm tracking-wider">RESOURCES</div>
            <div className="space-y-3 text-sm">
              <a href="#" className="block hover:text-white transition-colors">Voter Education</a>
              <a href="#" className="block hover:text-white transition-colors">Candidate Manifestos</a>
              <a href="#" className="block hover:text-white transition-colors">Election Guidelines</a>
              <a href="#" className="block hover:text-white transition-colors">Grievance Portal</a>
            </div>
          </div>

          {/* Legal & Government */}
          <div>
            <div className="font-semibold text-white mb-5 text-sm tracking-wider">LEGAL &amp; SUPPORT</div>
            <div className="space-y-3 text-sm">
              <a href="#" className="block hover:text-white transition-colors">Representation of the People Act</a>
              <a href="#" className="block hover:text-white transition-colors">Privacy &amp; Security</a>
              <a href="#" className="block hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="block hover:text-white transition-colors">Contact Election Commission</a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-y-4 text-xs">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-500">
            <span>© 2026 eVoteface — Official Digital Voting Initiative</span>
            <span className="hidden md:block">•</span>
            <span>Powered by Secure Biometric Systems &amp; Blockchain Technology</span>
          </div>
          
          <div className="flex items-center gap-x-5 text-slate-500">
            <div className="flex items-center gap-1">
              <i className="fa-solid fa-lock"></i>
              <span>End-to-End Encrypted</span>
            </div>
            <div>Made for the People of India</div>
          </div>
        </div>

        {/* Academic / Project Note (kept subtle) */}
        <div className="text-center text-[10px] text-slate-600 mt-10">
          Academic Project 2025–26 • Built on MERN Stack • Demonstration Purpose Only
        </div>
      </div>
    </footer>
  );
}
