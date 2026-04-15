import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
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

  return (
    <nav className="bg-primary text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5" onClick={close}>
          <span className="text-accent font-bold text-xl">e</span>
          <span className="font-bold text-lg tracking-wide">VoteFace</span>
          <span className="hidden md:block text-xs text-blue-300 ml-1 border-l border-blue-400 pl-2">
            Secure Digital Voting
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-5 text-sm">
          {navLink("/elections", "Elections")}
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
              <button onClick={handleLogout} className="hover:text-accent transition-colors">Logout</button>
            </>
          ) : (
            <>
              {navLink("/dashboard", "My Dashboard")}
              {navLink("/elections", "Elections")}
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
          {navLink("/elections", "📊 Elections")}
          {!user ? (
            <>
              {navLink("/login", "🔑 Login")}
              {navLink("/register", "📝 Register")}
            </>
          ) : isAdmin ? (
            <>
              {navLink("/admin/dashboard", "🏠 Dashboard")}
              {navLink("/admin/elections", "🗳️ Elections")}
              <button onClick={handleLogout} className="block text-left hover:text-accent">🚪 Logout</button>
            </>
          ) : (
            <>
              {navLink("/dashboard", "🏠 My Dashboard")}
              {navLink("/elections", "🗳️ Elections")}
              <button onClick={handleLogout} className="block text-left hover:text-accent">🚪 Logout</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
