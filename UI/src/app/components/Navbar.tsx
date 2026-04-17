import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Vote } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = user
    ? isAdmin
      ? [
          { name: 'Dashboard', path: '/admin/dashboard' },
          { name: 'Elections', path: '/admin/elections' },
        ]
      : [
          { name: 'Elections', path: '/elections' },
          { name: 'My Dashboard', path: '/dashboard' },
        ]
    : [
        { name: 'Elections', path: '/elections' },
        { name: 'Login', path: '/login' },
      ];

  return (
    <nav className="sticky top-0 z-50 bg-[#1a1a2e] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <Vote className="w-8 h-8 text-[#e94560] group-hover:rotate-12 transition-transform duration-300" />
            <div className="flex flex-col">
              <span className="font-bold text-xl">
                <span className="text-[#e94560]">e</span>VoteFace
              </span>
              <span className="text-xs text-gray-400">Secure Digital Voting</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md transition-all duration-200 ${
                  isActive(link.path)
                    ? 'text-[#e94560] bg-[#16213e]'
                    : 'hover:text-[#e94560] hover:bg-[#16213e]'
                }`}
              >
                {link.name}
              </Link>
            ))}
            {!user && (
              <Link
                to="/register"
                className="px-4 py-2 bg-[#e94560] hover:bg-[#d63651] rounded-md transition-colors duration-200"
              >
                Register
              </Link>
            )}
            {user && (
              <button
                onClick={logout}
                className="px-4 py-2 border border-[#e94560] text-[#e94560] hover:bg-[#e94560] hover:text-white rounded-md transition-all duration-200"
              >
                Logout
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-[#16213e] transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#16213e] border-t border-gray-700"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md transition-colors ${
                    isActive(link.path)
                      ? 'text-[#e94560] bg-[#1a1a2e]'
                      : 'hover:text-[#e94560] hover:bg-[#1a1a2e]'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              {!user && (
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 bg-[#e94560] hover:bg-[#d63651] rounded-md text-center"
                >
                  Register
                </Link>
              )}
              {user && (
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 border border-[#e94560] text-[#e94560] hover:bg-[#e94560] hover:text-white rounded-md transition-all"
                >
                  Logout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
