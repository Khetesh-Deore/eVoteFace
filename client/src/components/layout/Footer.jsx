export const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-white font-bold mb-4">eVoteFace</h3>
            <p className="text-sm text-gray-400">
              Secure online voting system using face recognition and blockchain technology.
            </p>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-white font-semibold mb-4">Features</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition">Face Recognition</a></li>
              <li><a href="#" className="hover:text-white transition">Blockchain Voting</a></li>
              <li><a href="#" className="hover:text-white transition">Real-time Results</a></li>
              <li><a href="#" className="hover:text-white transition">Anti-Spoofing</a></li>
            </ul>
          </div>

          {/* Security */}
          <div>
            <h4 className="text-white font-semibold mb-4">Security</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition">JWT Authentication</a></li>
              <li><a href="#" className="hover:text-white transition">Rate Limiting</a></li>
              <li><a href="#" className="hover:text-white transition">Input Validation</a></li>
              <li><a href="#" className="hover:text-white transition">HTTPS Only</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Email: info@evoteface.com</li>
              <li>Phone: +1 (555) 123-4567</li>
              <li><a href="#" className="hover:text-white transition">Support</a></li>
              <li><a href="#" className="hover:text-white transition">Documentation</a></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              © {currentYear} eVoteFace. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition">Privacy Policy</a>
              <a href="#" className="hover:text-white transition">Terms of Service</a>
              <a href="#" className="hover:text-white transition">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
