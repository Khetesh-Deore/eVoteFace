import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export const Navbar = ({ onMenuToggle }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <button
              onClick={onMenuToggle}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">EV</span>
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:inline">eVoteFace</span>
            </div>
          </div>

          {/* Center - Title */}
          <div className="hidden md:block text-center">
            <h1 className="text-lg font-semibold text-gray-900">Secure Online Voting System</h1>
          </div>

          {/* Right - User Menu */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-gray-700">{user.name}</span>
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <button
                      onClick={() => navigate('/profile')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => navigate('/settings')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm font-medium"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
