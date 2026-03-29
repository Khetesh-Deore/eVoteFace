import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const isActive = (path) => location.pathname === path

  const voterMenuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Vote', path: '/vote', icon: '🗳️' },
    { label: 'Results', path: '/results', icon: '📈' },
    { label: 'Receipt', path: '/receipt', icon: '📄' },
  ]

  const adminMenuItems = [
    { label: 'Dashboard', path: '/admin', icon: '📊' },
    { label: 'Voters', path: '/admin/voters', icon: '👥' },
    { label: 'Candidates', path: '/admin/candidates', icon: '🎯' },
    { label: 'Election', path: '/admin/election', icon: '⚙️' },
    { label: 'Results', path: '/admin/results', icon: '📈' },
    { label: 'Audit Log', path: '/admin/audit', icon: '📋' },
  ]

  const menuItems = user?.role === 'admin' || user?.role === 'superadmin' ? adminMenuItems : voterMenuItems

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static left-0 top-16 md:top-0 h-[calc(100vh-4rem)] md:h-screen w-64 bg-gray-900 text-white transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Menu Items */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path)
                  onClose()
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive(item.path)
                    ? 'bg-primary text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Footer Info */}
          <div className="border-t border-gray-700 p-4">
            <div className="text-xs text-gray-400 space-y-1">
              <p className="font-semibold text-gray-300">eVoteFace v1.0</p>
              <p>Secure Voting System</p>
              <p className="text-gray-500 mt-2">© 2026 All rights reserved</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
