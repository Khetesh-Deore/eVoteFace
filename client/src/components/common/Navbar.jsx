import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-primary text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-accent font-bold text-xl">e</span>
          <span className="font-bold text-lg tracking-wide">VoteFace</span>
          <span className="hidden sm:block text-xs text-blue-200 ml-1">| Secure Digital Voting</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-4 text-sm">
          <Link to="/results" className="hover:text-accent transition-colors">Results</Link>

          {!user ? (
            <>
              <Link to="/login" className="hover:text-accent transition-colors">Login</Link>
              <Link to="/register" className="bg-accent text-white px-4 py-1.5 rounded hover:bg-orange-700 transition-colors">
                Register
              </Link>
            </>
          ) : isAdmin ? (
            <>
              <Link to="/admin/dashboard" className="hover:text-accent transition-colors">Admin Panel</Link>
              <button onClick={handleLogout} className="hover:text-accent transition-colors">Logout</button>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="hover:text-accent transition-colors">Dashboard</Link>
              <Link to="/vote" className="hover:text-accent transition-colors">Vote</Link>
              <button onClick={handleLogout} className="hover:text-accent transition-colors">Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
