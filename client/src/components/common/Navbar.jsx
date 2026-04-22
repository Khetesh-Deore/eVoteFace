import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout, isAdmin, isSuperAdmin, isVoterAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setOpen(false);
  };

  const close = () => setOpen(false);
  const isActive = (path) => location.pathname === path;

  const navLink = (to, label, icon = null) => (
    <Link
      to={to}
      onClick={close}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl hover:bg-white/10 transition-all duration-200
        ${isActive(to) 
          ? "bg-white/15 text-white font-semibold shadow-inner" 
          : "text-slate-200 hover:text-white"}`}
    >
      {icon && <span className="text-lg">{icon}</span>}
      {label}
    </Link>
  );

  return (
    <nav className="bg-slate-950 border-b border-slate-800 sticky top-0 z-50 shadow-xl">
      <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between">
        
        {/* Logo - Premium Voting Theme */}
        <Link 
          to="/" 
          className="flex items-center gap-x-3 group" 
          onClick={close}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-fingerprint text-white text-2xl"></i>
          </div>
          <div>
            <span className="font-bold text-3xl tracking-[-1px] text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              eVoteface
            </span>
            <div className="text-[10px] text-emerald-400 -mt-1 tracking-[1px] font-medium">GOVERNMENT OF INDIA</div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-x-2 text-sm font-medium">
          {navLink("/elections", "Elections", "🗳️")}

          {!user ? (
            <>
              {navLink("/login", "Voter Login", "🔐")}
              <Link
                to="/register"
                onClick={close}
                className="ml-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-3xl transition-all active:scale-95"
              >
                Register as Voter
              </Link>
            </>
          ) : isAdmin ? (
            <>
              {isSuperAdmin && navLink("/admin/dashboard", "Dashboard", "📊")}
              {isVoterAdmin && navLink("/voter-admin/dashboard", "Dashboard", "📊")}
              {isSuperAdmin && navLink("/admin/elections", "Manage Elections", "⚙️")}
              {isVoterAdmin && navLink("/admin/elections", "Elections", "🗳️")}
              <button
                onClick={handleLogout}
                className="ml-6 flex items-center gap-2 px-5 py-2.5 text-red-400 hover:bg-red-500/10 rounded-3xl transition-colors"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
                Logout
              </button>
            </>
          ) : (
            <>
              {navLink("/dashboard", "My Dashboard", "🏠")}
              {navLink("/elections", "Vote Now", "🗳️")}
              
              <div className="ml-6 flex items-center gap-x-3 bg-slate-900 border border-slate-700 rounded-3xl px-4 py-1.5">
                <div className="w-7 h-7 bg-emerald-500 rounded-2xl flex items-center justify-center text-xs font-bold">
                  {user?.name?.charAt(0) || "U"}
                </div>
                <div className="text-sm">
                  <p className="font-medium text-white leading-none">{user?.name || "Voter"}</p>
                  <p className="text-xs text-emerald-400">Verified</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="ml-3 flex items-center gap-2 px-5 py-2.5 hover:bg-slate-800 rounded-3xl transition-colors"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
                Logout
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-3 rounded-2xl hover:bg-slate-800 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <i className={`fa-solid text-2xl text-white ${open ? "fa-xmark" : "fa-bars"}`}></i>
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-slate-950 border-t border-slate-800 px-6 py-6 space-y-2">
          {navLink("/elections", "Elections", "🗳️")}

          {!user ? (
            <>
              {navLink("/login", "Voter Login", "🔐")}
              {navLink("/register", "Register as Voter", "📝")}
            </>
          ) : isAdmin ? (
            <>
              {isSuperAdmin && navLink("/admin/dashboard", "Dashboard", "📊")}
              {isVoterAdmin && navLink("/voter-admin/dashboard", "Dashboard", "📊")}
              {isSuperAdmin && navLink("/admin/elections", "Manage Elections", "⚙️")}
              {isVoterAdmin && navLink("/admin/elections", "Elections", "🗳️")}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-2xl flex items-center gap-3 mt-4"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
                Logout
              </button>
            </>
          ) : (
            <>
              {navLink("/dashboard", "My Dashboard", "🏠")}
              {navLink("/elections", "Vote Now", "🗳️")}
              
              <div className="mt-6 mb-4 px-4 py-2.5 bg-slate-900 rounded-3xl border border-slate-700 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-2xl font-bold">
                  {user?.name?.charAt(0) || "👤"}
                </div>
                <div>
                  <p className="font-semibold text-white">{user?.name || "Verified Voter"}</p>
                  <p className="text-emerald-400 text-sm">Aadhaar + Face Verified</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-2.5 text-red-400 hover:bg-red-500/10 rounded-3xl flex items-center justify-center gap-3 font-medium"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
