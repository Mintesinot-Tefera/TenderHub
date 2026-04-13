import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Briefcase, LogOut, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './Avatar';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">TenderHub</span>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                {user.role === 'BIDDER' && (
                  <NavLink
                    to="/my-bids"
                    className={({ isActive }) =>
                      `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`
                    }
                  >
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">My Bids</span>
                  </NavLink>
                )}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-slate-100"
                  title="Profile settings"
                >
                  <Avatar src={user.avatarUrl} name={user.fullName} size="sm" />
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium leading-tight text-slate-900">
                      {user.fullName}
                    </div>
                    <div className="text-xs leading-tight text-slate-500">{user.role}</div>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-secondary !px-3"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
