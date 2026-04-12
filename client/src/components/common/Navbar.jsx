import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useElection } from "../../context/ElectionContext";
import ElectionSelector from "./ElectionSelector";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { selectedElectionId, currentElectionDetails, isLoadingElections } = useElection();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/"); setOpen(false); };
  const close = () => setOpen(false);
  const isActive = (path) => location.pathname === path;

  const navLink = (to, label) => (
    <Link to={to} onClick={close}
      className={`hover:text-accent transition-colors ${isActive(to) ? "text-accent font-semibold" : ""}`}>
      {label}
    </Link>
  );

  // Show election selector for logged-in users
  const showElectionSelector = user && (isAdmin || location.pathname !== '/');

  return (
    <nav className="bg-primary text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 flex-shrink-0" onClick={close}>
          <span className="text-accent font-bold text-xl">e</span>
          <span className="font-bold text-lg tracking-wide">VoteFace</span>
          <span className="hidden md:block text-xs text-blue-300 ml-1 border-l border-blue-400 pl-2">
            Secure Digital Voting
          </span>
        </Link>

        {/* Election Selector - Desktop */}
        {showElectionSelector && (
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            {isLoadingElections ? (
              <div className="text-xs text-blue-300">Loading elections...</div>
            ) : (
              <ElectionSelector showDetails={false} />
            )}
          </div>
        )}

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-5 text-sm ml-auto">
          {navLink("/results", "Results")}
          {!user ? (
            <>
              {navLink("/login", "Login")}
              <Link to="/register"
                className="bg-accent text-white px-4 py-1.5 rounded hover:bg-orange-700 transition-colors font-medium">
                Register
              </Link>
            </>
          ) : isAdmin ? (
            <>
              {navLink("/admin/dashboard", "Dashboard")}
              {navLink("/admin/elections", "Elections")}
              {navLink("/admin/voters", "Voters")}
              {navLink("/admin/candidates", "Candidates")}
              {navLink("/admin/results", "Results")}
              <button onClick={handleLogout} className="hover:text-accent transition-colors">Logout</button>
            </>
          ) : (
            <>
              {navLink("/dashboard", "My Dashboard")}
              {navLink("/vote", "Vote")}
              <button onClick={handleLogout} className="hover:text-accent transition-colors">Logout</button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="sm:hidden p-2 rounded hover:bg-white/10 transition-colors"
          onClick={() => setOpen(!open)} aria-label="Toggle menu">
          <div className="space-y-1">
            <span className={`block w-5 h-0.5 bg-white transition-transform ${open ? "rotate-45 translate-y-1.5" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-opacity ${open ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-transform ${open ? "-rotate-45 -translate-y-1.5" : ""}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden bg-blue-900 border-t border-blue-700 px-4 py-3 space-y-3 text-sm">
          {/* Election Selector - Mobile */}
          {showElectionSelector && (
            <div className="pb-3 border-b border-blue-700">
              <label className="text-xs text-blue-300 mb-2 block">Current Election</label>
              {isLoadingElections ? (
                <div className="text-xs text-blue-300">Loading...</div>
              ) : selectedElectionId ? (
                <div className="text-sm font-medium">{currentElectionDetails?.title || 'Election'}</div>
              ) : (
                <div className="text-xs text-blue-300">No election selected</div>
              )}
            </div>
          )}
          
          {navLink("/results", "📊 Results")}
          {!user ? (
            <>
              {navLink("/login", "🔑 Login")}
              {navLink("/register", "📝 Register")}
            </>
          ) : isAdmin ? (
            <>
              {navLink("/admin/dashboard", "🏠 Dashboard")}
              {navLink("/admin/elections", "🗳️ Elections")}
              {navLink("/admin/voters", "👥 Voters")}
              {navLink("/admin/candidates", "🏛️ Candidates")}
              {navLink("/admin/face", "📷 Face Registration")}
              {navLink("/admin/election", "⚙️ Election Control")}
              <button onClick={handleLogout} className="block text-left hover:text-accent">🚪 Logout</button>
            </>
          ) : (
            <>
              {navLink("/dashboard", "🏠 My Dashboard")}
              {navLink("/vote", "🗳️ Cast Vote")}
              <button onClick={handleLogout} className="block text-left hover:text-accent">🚪 Logout</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
